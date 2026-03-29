// 相册表

'use server'

import { db } from '~/lib/db'
import type { AlbumType } from '~/types'

// 后台相册管理默认按 sort 升序（权重越小越靠前），其后再按创建/更新时间倒序
const DEFAULT_ORDER_BY = [
  { sort: 'asc' as const },
  { createdAt: 'desc' as const },
  { updatedAt: 'desc' as const },
]

/**
 * 获取所有相册列表
 * @returns {Promise<AlbumType[]>} 相册列表
 */
// 优化点: 为后台 & 封面页的相册列表增加 60s 进程内缓存
let albumsListCache:
  | { data: AlbumType[]; expiresAt: number }
  | null = null

let albumsShowWithCountsCache:
  | { data: AlbumWithCount[]; expiresAt: number }
  | null = null

const ALBUMS_TTL = 60_000

export async function invalidateAlbumsListCache(): Promise<void> {
  albumsListCache = null
}

export async function fetchAlbumsList(): Promise<AlbumType[]> {
  const now = Date.now()
  if (albumsListCache && albumsListCache.expiresAt > now) {
    return albumsListCache.data
  }

  const data = await db.albums.findMany({
    where: { del: 0 },
    orderBy: DEFAULT_ORDER_BY,
  })

  albumsListCache = {
    data,
    expiresAt: now + ALBUMS_TTL,
  }
  return data
}

/**
 * 获取所有能显示的相册列表（除了首页路由外，且 show 为 0）
 * @returns {Promise<AlbumType[]>} 相册列表
 */
export async function fetchAlbumsShow(): Promise<AlbumType[]> {
  return await db.albums.findMany({
    where: {
      del: 0,
      show: 0,
      album_value: { not: '/' },
    },
    // 封面路由 & covers 页：按排序权重升序（越小越靠前）
    orderBy: [{ sort: 'asc' }],
  })
}

export type AlbumWithCount = AlbumType & { count: number }

/**
 * 获取可展示的相册列表（带公开图片数量），用于 covers 页避免 N+1
 */
export async function fetchAlbumsShowWithCounts(): Promise<AlbumWithCount[]> {
  const now = Date.now()
  if (albumsShowWithCountsCache && albumsShowWithCountsCache.expiresAt > now) {
    return albumsShowWithCountsCache.data
  }

  const rows = await db.$queryRaw<Array<AlbumWithCount>>`
    SELECT
      a.*,
      COALESCE(cnt.count, 0)::int AS count
    FROM
      "public"."albums" a
    LEFT JOIN LATERAL (
      SELECT
        COUNT(DISTINCT i.id) AS count
      FROM
        "public"."images_albums_relation" r
      LEFT JOIN "public"."images" i
        ON i.id = r."imageId"
        AND i.del = 0
        AND i.show = 0
      WHERE
        r.album_value = a.album_value
    ) cnt ON TRUE
    WHERE
      a.del = 0
      AND a.show = 0
      AND a.album_value <> '/'
      AND a.cover IS NOT NULL
    ORDER BY a.sort ASC
  `

  // $queryRaw 会返回 snake_case + map 字段名兼容的结果（取决于 prisma client 设置）。
  // 这里保证 count 为 number。
  const data = rows.map((r) => ({
    ...r,
    count: Number((r as any).count ?? 0),
  }))

  albumsShowWithCountsCache = {
    data,
    expiresAt: now + ALBUMS_TTL,
  }

  return data
}

/**
 * 获取对应路由的相册信息
 * @param router 相册路由
 */
export async function fetchAlbumByRouter(router: string): Promise<AlbumType | null> {
  return await db.albums.findFirst({
    where: {
      del: 0,
      show: 0,
      album_value: router,
    },
  })
}
