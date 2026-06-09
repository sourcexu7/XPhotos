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
const CACHE_KEY_ALBUMS_SHOW = 'albums:show'
const CACHE_KEY_ALBUMS_SHOW_WITH_COUNTS = 'albums:show_with_counts'

export async function invalidateAlbumsListCache(): Promise<void> {
  await cacheInvalidate(CACHE_KEY_ALBUMS_LIST, CACHE_KEY_ALBUMS_SHOW, CACHE_KEY_ALBUMS_SHOW_WITH_COUNTS)
}

/**
 * 相册封面策略：
 *   1. 若用户已在相册表 albums.cover 中设置了封面，优先保留用户设置；
 *      如果该 cover 存的是原图 URL，则把它替换为对应 preview_url（体积更小、加载更快）。
 *   2. 若 albums.cover 为空，使用该相册内第一张（relation.sort 升序）未删除图片的 preview_url 作为默认封面。
 *
 * 不会再用相册第一张图去覆盖用户已手动设置的封面。
 */
export async function replaceCoverWithPreview<T extends { album_value: string; cover?: string | null }>(
  albums: T[]
): Promise<T[]> {
  if (!albums.length) return albums

  const albumValues = albums.map(a => a.album_value).filter(Boolean)
  if (!albumValues.length) return albums

  // 收集用户已显式设置的 cover（可能是原图 URL），统一映射为 preview_url
  const explicitCoverUrls = albums
    .map(a => (typeof a.cover === 'string' && a.cover.length > 0 ? a.cover : null))
    .filter((u): u is string => u !== null)

  const [firstImages, explicitCoverImages] = await Promise.all([
    // 用于相册无 cover 时的默认封面（相册内第一张未删除图片）
    db.imagesAlbumsRelation.findMany({
      where: {
        album_value: { in: albumValues },
        images: { del: 0 },
      },
      include: {
        images: { select: { url: true, preview_url: true } },
      },
      orderBy: { sort: 'asc' },
    }),
    // 用于把用户已设置的 cover（原图 URL）映射为 preview_url
    explicitCoverUrls.length
      ? db.images.findMany({
          where: { url: { in: explicitCoverUrls }, del: 0 },
          select: { url: true, preview_url: true },
        })
      : Promise.resolve([]),
  ])

  // 相册 -> 默认封面预览图（仅当相册无 cover 时使用）
  const defaultCoverMap = new Map<string, string>()
  for (const rel of firstImages) {
    if (!defaultCoverMap.has(rel.album_value)) {
      defaultCoverMap.set(rel.album_value, rel.images.preview_url || rel.images.url || '')
    }
  }

  // 原图 URL -> 预览图 URL（用于用户已设置 cover 为原图时的优化）
  const urlToPreview = new Map<string, string>()
  for (const img of explicitCoverImages) {
    if (img.url) {
      urlToPreview.set(img.url, img.preview_url || img.url)
    }
  }

  return albums.map(a => {
    if (a.cover && typeof a.cover === 'string' && a.cover.length > 0) {
      // 用户已设置封面：保留；若恰好命中图片表记录，则优化为 preview_url
      const optimized = urlToPreview.get(a.cover)
      return {
        ...a,
        cover: optimized ?? a.cover,
      }
    }
    // 未设置封面，使用相册第一张图片作为默认封面
    return {
      ...a,
      cover: defaultCoverMap.get(a.album_value) ?? null,
    }
  })
}

export async function fetchAlbumsList(): Promise<AlbumType[]> {
  const albums = await cacheWrap<AlbumType[]>(CACHE_KEY_ALBUMS_LIST, () =>
    db.albums.findMany({
      where: { del: 0 },
      orderBy: DEFAULT_ORDER_BY,
    }),
  )
  return replaceCoverWithPreview(albums)
}

/**
 * 获取所有能显示的相册列表（除了首页路由外，且 show 为 0）——接入 Redis 缓存
 */
export async function fetchAlbumsShow(): Promise<AlbumType[]> {
  const albums = await cacheWrap<AlbumType[]>(CACHE_KEY_ALBUMS_SHOW, () =>
    db.albums.findMany({
      where: {
        del: 0,
        show: 0,
        album_value: { not: '/' },
      },
      orderBy: [{ sort: 'asc' }],
    }),
  )
  return replaceCoverWithPreview(albums)
}

export type AlbumWithCount = AlbumType & { count: number }

/**
 * 获取可展示的相册列表（带公开图片数量），用于 covers 页避免 N+1
 * cover 字段自动替换为预览图 URL
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
    const mapped = rows.map((r) => ({
      ...r,
      count: Number((r as any).count ?? 0),
    }))
    return replaceCoverWithPreview(mapped)
  })
}

/**
 * 获取对应路由的相册信息
 */
export async function fetchAlbumByRouter(router: string): Promise<AlbumType | null> {
  const album = await db.albums.findFirst({
    where: {
      del: 0,
      show: 0,
      album_value: router,
    },
  })
  if (!album) return null
  const [replaced] = await replaceCoverWithPreview([album])
  return replaced
}
