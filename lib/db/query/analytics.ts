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

const ANALYTICS_TZ = 'Asia/Shanghai'

/**
 * 将 Date 显式转换到指定时区的年月日时分秒 parts
 */
function getZonedParts(date: Date, timeZone: string): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const parts = dtf.formatToParts(date)
  const pick = (type: string) => parts.find((p) => p.type === type)?.value
  const year = Number(pick('year'))
  const month = Number(pick('month'))
  const day = Number(pick('day'))
  const hour = Number(pick('hour'))
  const minute = Number(pick('minute'))
  const second = Number(pick('second'))

  return { year, month, day, hour, minute, second }
}

/**
 * 获取指定时区相对 UTC 的偏移分钟数（例如 GMT+8 => 480）
 */
function getTimeZoneOffsetMinutes(at: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
    hour: '2-digit',
  })
  const parts = dtf.formatToParts(at)
  const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
  if (tz === 'GMT' || tz === 'UTC') return 0

  // 兼容形如 "GMT+8" / "GMT+08:00" / "UTC+8"
  const m = tz.match(/([+-])(\d{1,2})(?::?(\d{2}))?/)
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  const hh = Number(m[2] ?? 0)
  const mm = Number(m[3] ?? 0)
  return sign * (hh * 60 + mm)
}

/**
 * 获取指定时区的当天开始时间（返回 UTC Date，用于数据库查询）
 */
function startOfDayInTimeZone(date: Date, timeZone: string): Date {
  const { year, month, day } = getZonedParts(date, timeZone)
  const baseUtcMs = Date.UTC(year, month - 1, day, 0, 0, 0, 0)

  // 用迭代方式求出该“时区当天 00:00”对应的 UTC instant（避免依赖宿主机时区）
  let guessUtcMs = baseUtcMs
  for (let i = 0; i < 2; i++) {
    const offsetMin = getTimeZoneOffsetMinutes(new Date(guessUtcMs), timeZone)
    guessUtcMs = baseUtcMs - offsetMin * 60_000
  }

  return new Date(guessUtcMs)
}

/**
 * 将时间按指定时区格式化为 YYYY-MM-DD
 */
function formatDateInTimeZone(date: Date, timeZone: string): string {
  const { year, month, day } = getZonedParts(date, timeZone)
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

/**
 * 获取指定时区的小时（0-23）
 */
function getHourInTimeZone(date: Date, timeZone: string): number {
  return getZonedParts(date, timeZone).hour
}

export async function getVisitAnalytics(): Promise<VisitSummary> {
  const now = new Date()
  // 显式按北京时间（Asia/Shanghai）计算“今天 00:00”的 UTC instant
  const todayStart = startOfDayInTimeZone(now, ANALYTICS_TZ)
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
    // item.createdAt 是 UTC 时间，按北京时间聚合到日期
    const key = formatDateInTimeZone(item.createdAt, ANALYTICS_TZ)
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
    // 用“北京时间今天 00:00”向前推 i 天，再按北京时间格式化日期 key
    const d = new Date(todayStart)
    d.setUTCDate(d.getUTCDate() - i)
    const key = formatDateInTimeZone(d, ANALYTICS_TZ)
    last7Days.push({
      date: key,
      count: byDate.get(key) ?? 0,
    })
  }

  // 今日按小时聚合（0-23）- 显式使用北京时间
  const todayByHour: { hour: number; count: number }[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
  }))
  for (const item of todayList) {
    // item.createdAt 是 UTC 时间，转换为北京时间的小时
    const h = getHourInTimeZone(item.createdAt, ANALYTICS_TZ)
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


