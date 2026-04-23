'use server'

import { db } from '~/lib/db'

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

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [
    imagesCount,
    guidesCount,
    albumsCount,
    cameraStats,
    lensStats,
    visitStats,
    photosByYear,
  ] = await Promise.all([
    db.$queryRaw<[{ total: number; public: number }]>`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE show = 0) as public
      FROM images
      WHERE del = 0
    `,
    db.$queryRaw<[{ total: number; public: number }]>`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE show = 1) as public
      FROM guides
      WHERE del = 0
    `,
    db.$queryRaw<[{ total: number }]>`
      SELECT COUNT(*) as total
      FROM albums
      WHERE del = 0
    `,
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
    fetchVisitStats(),
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

  return {
    images: {
      total: Number(imagesCount[0].total),
      public: Number(imagesCount[0].public),
    },
    guides: {
      total: Number(guidesCount[0].total),
      public: Number(guidesCount[0].public),
    },
    albums: {
      total: Number(albumsCount[0].total),
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
    visits: visitStats,
    photosByYear: photosByYear.map((item) => ({
      year: item.year,
      count: Number(item.count),
    })),
  }
}

async function fetchVisitStats() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const sevenDaysAgo = new Date(todayStart)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [totalVisits, todayVisits, yesterdayVisits, last7DaysVisits] = await Promise.all([
    db.visitLog.count(),
    db.visitLog.count({
      where: { createdAt: { gte: todayStart } },
    }),
    db.visitLog.count({
      where: {
        createdAt: {
          gte: yesterdayStart,
          lt: todayStart,
        },
      },
    }),
    db.visitLog.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    }),
  ])

  const byDate = new Map<string, number>()
  for (const visit of last7DaysVisits) {
    const dateKey = visit.createdAt.toISOString().split('T')[0]
    byDate.set(dateKey, (byDate.get(dateKey) || 0) + 1)
  }

  const last7Days: Array<{ date: string; count: number }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    last7Days.push({
      date: key,
      count: byDate.get(key) || 0,
    })
  }

  return {
    total: totalVisits,
    today: todayVisits,
    yesterday: yesterdayVisits,
    last7Days,
  }
}
