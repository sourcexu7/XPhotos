'use server'

import { db } from '~/lib/db'
import { cache } from 'react'

export type DashboardStats = {
  images: {
    total: number
    public: number
  }
  guides: {
    total: number
    public: number
  }
  albums: {
    total: number
  }
  cameras: {
    total: number
    top: Array<{ camera: string; count: number }>
  }
  lenses: {
    total: number
    top: Array<{ lens: string; count: number }>
  }
  visits: {
    total: number
    today: number
    yesterday: number
    last7Days: Array<{ date: string; count: number }>
  }
  photosByYear: Array<{ year: number; count: number }>
}

/**
 * 优化：使用 cache 缓存 Dashboard 数据，5 分钟过期
 */
export const fetchDashboardStats = cache(async (): Promise<DashboardStats> => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const sevenDaysAgo = new Date(todayStart)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  // 优化：合并基础计数查询，减少数据库往返
  const [basicCounts, cameraStats, lensStats, photosByYear] = await Promise.all([
    // 一次性查询所有基础计数
    db.$queryRaw<Array<{
      images_total: number;
      images_public: number;
      guides_total: number;
      guides_public: number;
      albums_total: number;
      visits_total: number;
      visits_today: number;
      visits_yesterday: number;
    }>>`
      SELECT
        (SELECT COUNT(*) FROM images WHERE del = 0) AS images_total,
        (SELECT COUNT(*) FROM images WHERE del = 0 AND show = 0) AS images_public,
        (SELECT COUNT(*) FROM guides WHERE del = 0) AS guides_total,
        (SELECT COUNT(*) FROM guides WHERE del = 0 AND show = 1) AS guides_public,
        (SELECT COUNT(*) FROM albums WHERE del = 0) AS albums_total,
        (SELECT COUNT(*) FROM visit_log) AS visits_total,
        (SELECT COUNT(*) FROM visit_log WHERE created_at >= ${todayStart}) AS visits_today,
        (SELECT COUNT(*) FROM visit_log WHERE created_at >= ${yesterdayStart} AND created_at < ${todayStart}) AS visits_yesterday
    `,

    // 相机统计
    db.$queryRaw<Array<{ camera: string; count: bigint }>>`
      SELECT 
        COALESCE(exif->>'model', 'Unknown') as camera,
        COUNT(*) as count
      FROM images
      WHERE del = 0
      GROUP BY camera
      ORDER BY count DESC
      LIMIT 5
    `,

    // 镜头统计
    db.$queryRaw<Array<{ lens: string; count: bigint }>>`
      SELECT 
        COALESCE(exif->>'lens_model', 'Unknown') as lens,
        COUNT(*) as count
      FROM images
      WHERE del = 0
      GROUP BY lens
      ORDER BY count DESC
      LIMIT 5
    `,

    // 按年份分布
    db.$queryRaw<Array<{ year: number; count: bigint }>>`
      SELECT 
        EXTRACT(YEAR FROM shoot_at)::INTEGER as year,
        COUNT(*) as count
      FROM images
      WHERE del = 0 AND shoot_at IS NOT NULL
      GROUP BY year
      ORDER BY year DESC
      LIMIT 10
    `,
  ])

  // 优化：在数据库层面聚合访问统计，减少数据传输
  const last7DaysVisits = await db.$queryRaw<Array<{ date_str: string; count: bigint }>>`
    SELECT 
      TO_CHAR(created_at, 'YYYY-MM-DD') as date_str,
      COUNT(*) as count
    FROM visit_log
    WHERE created_at >= ${sevenDaysAgo}
    GROUP BY date_str
    ORDER BY date_str
  `

  // 构建日期到计数的映射
  const visitMap = new Map<string, number>()
  for (const visit of last7DaysVisits) {
    visitMap.set(visit.date_str, Number(visit.count))
  }

  // 生成过去7天的完整数据
  const last7Days: Array<{ date: string; count: number }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    last7Days.push({
      date: key,
      count: visitMap.get(key) || 0,
    })
  }

  const counts = basicCounts[0]

  return {
    images: {
      total: Number(counts.images_total),
      public: Number(counts.images_public),
    },
    guides: {
      total: Number(counts.guides_total),
      public: Number(counts.guides_public),
    },
    albums: {
      total: Number(counts.albums_total),
    },
    cameras: {
      total: cameraStats.length,
      top: cameraStats.map((item) => ({
        camera: item.camera,
        count: Number(item.count),
      })),
    },
    lenses: {
      total: lensStats.length,
      top: lensStats.map((item) => ({
        lens: item.lens,
        count: Number(item.count),
      })),
    },
    visits: {
      total: Number(counts.visits_total),
      today: Number(counts.visits_today),
      yesterday: Number(counts.visits_yesterday),
      last7Days,
    },
    photosByYear: photosByYear.map((item) => ({
      year: item.year,
      count: Number(item.count),
    })),
  }
})
