// 相册表

'use server'

import { db } from '~/lib/db'
import type { AlbumType } from '~/types'
import { cacheWrap, cacheInvalidate } from '~/lib/redis'

const DEFAULT_ORDER_BY = [
  { sort: 'asc' as const },
  { createdAt: 'desc' as const },
  { updatedAt: 'desc' as const },
]

const CACHE_KEY_ALBUMS_LIST = 'albums:list'
const CACHE_KEY_ALBUMS_SHOW_WITH_COUNTS = 'albums:show_with_counts'

export async function invalidateAlbumsListCache(): Promise<void> {
  await cacheInvalidate(CACHE_KEY_ALBUMS_LIST, CACHE_KEY_ALBUMS_SHOW_WITH_COUNTS)
}

export async function fetchAlbumsList(): Promise<AlbumType[]> {
  return cacheWrap<AlbumType[]>(CACHE_KEY_ALBUMS_LIST, () =>
    db.albums.findMany({
      where: { del: 0 },
      orderBy: DEFAULT_ORDER_BY,
    }),
  )
}

/**
 * 获取所有能显示的相册列表（除了首页路由外，且 show 为 0）
 */
export async function fetchAlbumsShow(): Promise<AlbumType[]> {
  return await db.albums.findMany({
    where: {
      del: 0,
      show: 0,
      album_value: { not: '/' },
    },
    orderBy: [{ sort: 'asc' }],
  })
}

export type AlbumWithCount = AlbumType & { count: number }

/**
 * 获取可展示的相册列表（带公开图片数量），用于 covers 页避免 N+1
 */
export async function fetchAlbumsShowWithCounts(): Promise<AlbumWithCount[]> {
  return cacheWrap<AlbumWithCount[]>(CACHE_KEY_ALBUMS_SHOW_WITH_COUNTS, async () => {
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
    return rows.map((r) => ({
      ...r,
      count: Number((r as any).count ?? 0),
    }))
  })
}

/**
 * 获取对应路由的相册信息
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
