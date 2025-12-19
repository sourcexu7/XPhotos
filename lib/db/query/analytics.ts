'use server'

import { db } from '~/lib/db'

export type VisitSummary = {
  totalVisits: number
  todayVisits: number
  yesterdayVisits: number
  uniqueIpCount: number
  sources: {
    direct: number
    referer: number
    search: number
    other: number
  }
  pages: {
    home: number
    gallery: number
    album: number
    admin: number
    other: number
  }
  last7Days: {
    date: string
    count: number
  }[]
  todayByHour: {
    hour: number
    count: number
  }[]
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function getVisitAnalytics(): Promise<VisitSummary> {
  const now = new Date()
  const todayStart = startOfDay(now)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const sevenDaysAgo = new Date(todayStart)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [allFor7Days, todayList, yesterdayList, totalCount, uniqueIps] = await Promise.all([
    db.visitLog.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
        pageType: true,
        source: true,
      },
    }),
    db.visitLog.findMany({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
      select: {
        id: true,
        ip: true,
        createdAt: true,
      },
    }),
    db.visitLog.findMany({
      where: {
        createdAt: {
          gte: yesterdayStart,
          lt: todayStart,
        },
      },
      select: {
        id: true,
      },
    }),
    db.visitLog.count(),
    db.visitLog.findMany({
      where: {
        ip: {
          not: null,
        },
      },
      select: {
        ip: true,
      },
      distinct: ['ip'],
    }),
  ])

  // 近 7 天按日期聚合
  const byDate = new Map<string, number>()
  const pageAgg = {
    home: 0,
    gallery: 0,
    album: 0,
    admin: 0,
    other: 0,
  }
  const sourceAgg = {
    direct: 0,
    referer: 0,
    search: 0,
    other: 0,
  }

  for (const item of allFor7Days) {
    const d = startOfDay(item.createdAt)
    const key = formatDateLocal(d)
    byDate.set(key, (byDate.get(key) ?? 0) + 1)

    const pageKey = (item.pageType as keyof typeof pageAgg) || 'other'
    if (pageKey in pageAgg) {
      pageAgg[pageKey]++
    } else {
      pageAgg.other++
    }

    const srcKey = (item.source as keyof typeof sourceAgg) || 'other'
    if (srcKey in sourceAgg) {
      sourceAgg[srcKey]++
    } else {
      sourceAgg.other++
    }
  }

  // 补齐没有访问的日期（包含今天在内的最近7天）
  const last7Days: { date: string; count: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayStart)
    d.setDate(d.getDate() - i)
    const key = formatDateLocal(d)
    last7Days.push({
      date: key,
      count: byDate.get(key) ?? 0,
    })
  }

  // 今日按小时聚合（0-23）
  const todayByHour: { hour: number; count: number }[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
  }))
  for (const item of todayList) {
    const h = new Date(item.createdAt).getHours()
    if (h >= 0 && h < 24) {
      todayByHour[h].count += 1
    }
  }

  return {
    totalVisits: totalCount,
    todayVisits: todayList.length,
    yesterdayVisits: yesterdayList.length,
    uniqueIpCount: uniqueIps.length,
    sources: sourceAgg,
    pages: pageAgg,
    last7Days,
    todayByHour,
  }
}


