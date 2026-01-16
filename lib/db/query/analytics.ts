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

/**
 * 获取本地时区的当天开始时间（用于数据库查询的 UTC Date 对象）
 * 因为数据库存储的是 UTC 时间，所以需要将本地时区的开始时间转换为 UTC
 */
function startOfDayLocal(date: Date): Date {
  const localDate = new Date(date)
  const year = localDate.getFullYear()
  const month = localDate.getMonth()
  const day = localDate.getDate()
  // 创建本地时区的当天 00:00:00（这个 Date 对象内部存储的是 UTC 时间戳）
  // 当用于 Prisma 查询时，Prisma 会将其作为 UTC 时间处理
  const localStart = new Date(year, month, day, 0, 0, 0, 0)
  return localStart
}

/**
 * 将 UTC 时间转换为本地时区的日期字符串
 */
function formatDateLocal(utcDate: Date): string {
  const localDate = new Date(utcDate)
  const year = localDate.getFullYear()
  const month = String(localDate.getMonth() + 1).padStart(2, '0')
  const day = String(localDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 获取本地时区的小时（0-23）
 */
function getLocalHour(utcDate: Date): number {
  return new Date(utcDate).getHours()
}

export async function getVisitAnalytics(): Promise<VisitSummary> {
  const now = new Date()
  // 获取本地时区的今天开始时间（UTC 表示）
  const todayStart = startOfDayLocal(now)
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
    // item.createdAt 是 UTC 时间，转换为本地时区的日期
    const key = formatDateLocal(item.createdAt)
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
  const nowLocal = new Date(now)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(nowLocal)
    d.setDate(d.getDate() - i)
    // 获取本地时区的日期字符串
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const key = `${year}-${month}-${day}`
    last7Days.push({
      date: key,
      count: byDate.get(key) ?? 0,
    })
  }

  // 今日按小时聚合（0-23）- 使用本地时区
  const todayByHour: { hour: number; count: number }[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
  }))
  for (const item of todayList) {
    // item.createdAt 是 UTC 时间，转换为本地时区的小时
    const h = getLocalHour(item.createdAt)
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


