// 图片表

'use server'

import { Prisma } from '@prisma/client'
import { db } from '~/lib/db'
import type { ImageType } from '~/types'
import { fetchConfigValue } from './configs'
import { cache } from 'react'
import { cacheWrap, cacheInvalidate, cacheInvalidateByPattern } from '~/lib/redis'
import { createImageQueryBuilder } from './builders/image-query-builder'

// 使用枚举替代魔法值，提升可维护性
enum AlbumImageSorting {
  DEFAULT = 0,
  CREATED_DESC = 1,
  SHOOT_TIME_DESC = 2,
  CREATED_ASC = 3,
  SHOOT_TIME_ASC = 4,
}

const ALBUM_IMAGE_SORTING_ORDER: Record<number, string> = {
  [AlbumImageSorting.DEFAULT]: 'image.sort ASC, image.created_at DESC, image.updated_at DESC',
  [AlbumImageSorting.CREATED_DESC]: 'image.created_at DESC, image.updated_at DESC',
  [AlbumImageSorting.SHOOT_TIME_DESC]: 'image.shoot_at DESC NULLS LAST, image.created_at DESC, image.updated_at DESC',
  [AlbumImageSorting.CREATED_ASC]: 'image.created_at ASC, image.updated_at ASC',
  [AlbumImageSorting.SHOOT_TIME_ASC]: 'image.shoot_at ASC NULLS FIRST, image.created_at ASC, image.updated_at ASC',
}

/**
 * 优化：Fisher-Yates 洗牌算法，性能优于 sort(() => Math.random() - 0.5)
 * 时间复杂度 O(n)，且分布更均匀
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 优化：提取公共筛选条件构建函数，消除重复代码
 * 使用原生 for 循环优化性能（大数据量场景）
 */
interface FilterOptions {
  cameras?: string[]
  lenses?: string[]
  tags?: string[]
  tagsOperator?: 'and' | 'or'
  camera?: string
  lens?: string
  exposure?: string
  f_number?: string
  iso?: string
  labels?: string[]
  labelsOperator?: 'and' | 'or'
  showStatus?: number
  featured?: number
}

function buildClientFilters(options: FilterOptions) {
  const camerasArray = Array.isArray(options.cameras) && options.cameras.length > 0 ? options.cameras : []
  const lensesArray = Array.isArray(options.lenses) && options.lenses.length > 0 ? options.lenses : []
  const tagsArray = Array.isArray(options.tags) && options.tags.length > 0 ? options.tags : []

  // 优化：使用原生 for 循环构建 SQL，避免多次数组遍历
  const cameraFilter = camerasArray.length > 0
    ? Prisma.sql`AND (${Prisma.join(
        camerasArray.map(c => Prisma.sql`COALESCE(image.exif->>'model', 'Unknown') = ${c}`),
        ' OR '
      )})`
    : Prisma.empty

  const lensFilter = lensesArray.length > 0
    ? Prisma.sql`AND (${Prisma.join(
        lensesArray.map(l => Prisma.sql`COALESCE(image.exif->>'lens_model', 'Unknown') = ${l}`),
        ' OR '
      )})`
    : Prisma.empty

  const tagsFilter = tagsArray.length > 0
    ? options.tagsOperator === 'and'
      ? Prisma.sql`AND image.labels::jsonb @> ${JSON.stringify(tagsArray)}::jsonb`
      : Prisma.sql`AND (${Prisma.join(
          tagsArray.map(t => Prisma.sql`image.labels::jsonb @> ${JSON.stringify([t])}::jsonb`),
          ' OR '
        )})`
    : Prisma.empty

  return { cameraFilter, lensFilter, tagsFilter }
}



export type ServerImagesPageResult = {
  items: ImageType[]
  total: number
  pageTotal: number
  pageSize: number
}

/**
 * 后台：一次查询返回列表 + 总数（避免列表与 count 两次重查询）
 * ——使用 ImageQueryBuilder 统一处理：特定相册走 INNER JOIN，所有相册走 LEFT JOIN
 */
export async function fetchServerImagesPageByAlbum(
  pageNum: number,
  album: string,
  showStatus: number = -1,
  featured: number = -1,
  camera?: string,
  lens?: string,
  exposure?: string,
  f_number?: string,
  iso?: string,
  labels?: string[],
  labelsOperator: 'and' | 'or' = 'and',
  pageSize?: number
): Promise<ServerImagesPageResult> {
  const normalizedAlbum = album === 'all' ? '' : album
  const normalizedPageNum = Math.max(1, pageNum)

  if (!pageSize) {
    const configPageSize = await fetchConfigValue('admin_images_per_page', '8')
    pageSize = parseInt(configPageSize, 10) || 8
  }

  const builder = createImageQueryBuilder({
    album: normalizedAlbum,
    pageNum: normalizedPageNum,
    pageSize,
    filters: {
      showStatus,
      featured,
      camera,
      lens,
      exposure,
      f_number,
      iso,
      labels,
      labelsOperator,
    },
  })

  return builder.buildPaginatedQuery()
}

/**
 * 供下载打包：根据用户与图片ID列表取元数据
 */
export async function fetchImageMetadataByIds(userId: string, imageIds: string[]) {
  if (!userId) return new Map<string, any>()
  const ids = Array.isArray(imageIds) ? imageIds.map(String).filter(Boolean) : []
  if (ids.length === 0) return new Map<string, any>()

  // 目前权限策略：只要图片存在且未删除即可（如你有更严格的相册/用户权限，可在此加 JOIN 校验）
  const rows = await db.images.findMany({
    where: {
      id: { in: ids },
      del: 0,
    },
  })

  const map = new Map<string, any>()
  for (const r of rows) {
    map.set(r.id, r)
  }
  return map
}

/**
 * 供下载相册：根据用户与 albumValue 拉取该相册下图片 id 列表
 */
export async function fetchImageIdsByAlbum(userId: string, albumValue: string): Promise<string[]> {
  if (!userId) return []
  if (!albumValue) return []

  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT DISTINCT image.id
    FROM "public"."images" AS image
    INNER JOIN "public"."images_albums_relation" AS relation
      ON image.id = relation."imageId"
    INNER JOIN "public"."albums" AS albums
      ON relation.album_value = albums.album_value
    WHERE
      image.del = 0
      AND albums.del = 0
      AND albums.album_value = ${albumValue}
  `

  return rows.map(r => String((r as any).id)).filter(Boolean)
}

/**
 * 根据相册获取图片分页列表（服务端）
 * ——使用 ImageQueryBuilder 统一处理：特定相册走 INNER JOIN，所有相册走 LEFT JOIN
 */
export async function fetchServerImagesListByAlbum(
  pageNum: number,
  album: string,
  showStatus: number = -1,
  featured: number = -1,
  camera?: string,
  lens?: string,
  exposure?: string,
  f_number?: string,
  iso?: string,
  labels?: string[],
  labelsOperator: 'and' | 'or' = 'and',
  pageSize?: number
): Promise<ImageType[]> {
  const normalizedAlbum = album === 'all' ? '' : album
  const normalizedPageNum = Math.max(1, pageNum)

  if (!pageSize) {
    const configPageSize = await fetchConfigValue('admin_images_per_page', '8')
    pageSize = parseInt(configPageSize, 10) || 8
  }

  const builder = createImageQueryBuilder({
    album: normalizedAlbum,
    pageNum: normalizedPageNum,
    pageSize,
    filters: {
      showStatus,
      featured,
      camera,
      lens,
      exposure,
      f_number,
      iso,
      labels,
      labelsOperator,
    },
  })

  return builder.buildListQuery()
}

/**
 * 根据相册获取图片分页总数（服务端）
 * ——使用 ImageQueryBuilder 统一处理：特定相册走 INNER JOIN，所有相册走 LEFT JOIN
 */
export async function fetchServerImagesPageTotalByAlbum(
  album: string,
  showStatus: number = -1,
  featured: number = -1,
  camera?: string,
  lens?: string,
  exposure?: string,
  f_number?: string,
  iso?: string,
  labels?: string[],
  labelsOperator: 'and' | 'or' = 'and'
): Promise<number> {
  const normalizedAlbum = album === 'all' ? '' : album

  const builder = createImageQueryBuilder({
    album: normalizedAlbum,
    filters: {
      showStatus,
      featured,
      camera,
      lens,
      exposure,
      f_number,
      iso,
      labels,
      labelsOperator,
    },
  })

  return builder.buildCountQuery()
}

/**
 * 构建图片列表/总数缓存的稳定 key
 * ——过滤参数排序后拼接，等价参数命中同一 key
 */
function buildGalleryCacheKey(prefix: string, album: string, pageNum: number | null, filters: {
  cameras?: string[]
  lenses?: string[]
  tags?: string[]
  tagsOperator?: 'and' | 'or'
  sortByShootTime?: 'asc' | 'desc'
}): string {
  const norm = (arr?: string[]) => (arr && arr.length > 0 ? [...arr].sort().join(',') : '')
  const parts = [
    norm(filters.cameras),
    norm(filters.lenses),
    norm(filters.tags),
    filters.tagsOperator ?? 'and',
    filters.sortByShootTime ?? '',
  ]
  const hasAny = parts.some(p => p && p !== 'and')
  const pagePart = pageNum != null ? `:${pageNum}` : ''
  const filterPart = hasAny ? `:${parts.map(p => p || '_').join('|')}` : ''
  return `${prefix}:${album}${pagePart}${filterPart}`
}

/**
 * 根据相册获取图片分页列表（客户端）——接入 Redis 缓存
 * 注意：当相册启用随机展示时，为避免随机结果被固化，直接跳过缓存
 */
export const fetchClientImagesListByAlbum = cache(async (
  pageNum: number,
  album: string,
  cameras?: string[],
  lenses?: string[],
  tags?: string[],
  tagsOperator: 'and' | 'or' = 'and',
  sortByShootTime?: 'desc' | 'asc',
  pageSize: number = 16
): Promise<ImageType[]> => {
  if (pageNum < 1) {
    pageNum = 1
  }
  if (pageSize < 1) {
    pageSize = 16
  }

  // 1) 非根相册：先读取一次相册元数据判断是否启用随机展示
  //    ——随机展示相册的结果不稳定，直接跳过 Redis 缓存，避免“随机结果被固化”
  let albumData: { random_show: number; image_sorting?: number } | null = null
  let skipCache = false
  if (album !== '/') {
    albumData = await db.albums.findFirst({ where: { album_value: album } })
    if (albumData && albumData.random_show === 0) {
      skipCache = true
    }
  }

  const doQuery = async () => {
    const { cameraFilter, lensFilter, tagsFilter } = buildClientFilters({
      cameras,
      lenses,
      tags,
      tagsOperator,
    })

    const selectFields = `
      image.id,
      image.image_name,
      image.url,
      image.preview_url,
      image.video_url,
      image.blurhash,
      image.width,
      image.height,
      image.title,
      image.detail,
      image.type,
      image.show,
      image.show_on_mainpage,
      image.featured,
      image.sort,
      image.created_at,
      image.updated_at,
      image.labels,
      image.exif
    `

    let result: ImageType[]

    if (album === '/') {
      if (sortByShootTime === 'desc') {
        result = await db.$queryRaw`
        SELECT
            ${Prisma.raw(selectFields)}
        FROM
            "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE
            image.del = 0
        AND
            image.show = 0
        AND
            image.show_on_mainpage = 0
        AND
            albums.del = 0
        AND
            albums.show = 0
            ${cameraFilter}
            ${lensFilter}
            ${tagsFilter}
        ORDER BY
          image.shoot_at DESC NULLS LAST,
          image.created_at DESC,
          image.updated_at DESC
        LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}
      `
      } else if (sortByShootTime === 'asc') {
        result = await db.$queryRaw`
        SELECT
            ${Prisma.raw(selectFields)}
        FROM
            "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE
            image.del = 0
        AND
            image.show = 0
        AND
            image.show_on_mainpage = 0
        AND
            albums.del = 0
        AND
            albums.show = 0
            ${cameraFilter}
            ${lensFilter}
            ${tagsFilter}
        ORDER BY
          image.shoot_at ASC NULLS FIRST,
          image.created_at ASC,
          image.updated_at ASC
        LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}
      `
      } else {
        result = await db.$queryRaw`
        SELECT
            ${Prisma.raw(selectFields)}
        FROM
            "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE
            image.del = 0
        AND
            image.show = 0
        AND
            image.show_on_mainpage = 0
        AND
            albums.del = 0
        AND
            albums.show = 0
            ${cameraFilter}
            ${lensFilter}
            ${tagsFilter}
        ORDER BY image.created_at DESC, image.updated_at DESC, image.sort ASC
        LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}
      `
      }
    } else {
      const selectFieldsWithSort = `
        image.id,
        image.image_name,
        image.url,
        image.preview_url,
        image.video_url,
        image.blurhash,
        image.width,
        image.height,
        image.title,
        image.detail,
        image.type,
        image.show,
        image.show_on_mainpage,
        image.featured,
        image.sort,
        image.created_at,
        image.updated_at,
        image.labels,
        image.exif,
        relation.sort AS album_sort
      `

      let orderBy = Prisma.sql`relation.sort ASC, image.created_at DESC, image.updated_at DESC`
      if (albumData?.image_sorting && albumData.image_sorting !== 0 && ALBUM_IMAGE_SORTING_ORDER[albumData.image_sorting]) {
        orderBy = Prisma.sql([`relation.sort ASC, ${ALBUM_IMAGE_SORTING_ORDER[albumData.image_sorting]}`])
      }

      result = await db.$queryRaw`
        SELECT
            ${Prisma.raw(selectFieldsWithSort)},
            albums.name AS album_name,
            albums.id AS album_value,
            albums.license AS album_license,
            albums.image_sorting AS album_image_sorting
        FROM
            "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE
            image.del = 0
        AND
            albums.del = 0
        AND
            image.show = 0
        AND
            albums.show = 0
        AND
            albums.album_value = ${album}
            ${cameraFilter}
            ${lensFilter}
            ${tagsFilter}
        ORDER BY ${orderBy}
        LIMIT ${pageSize} OFFSET ${(pageNum - 1) * pageSize}
      `
    }

    // 仅在非缓存路径下执行 shuffle（缓存路径 random_show 不是 0，不会进入这个分支）
    if (result && albumData && albumData.random_show === 0) {
      result = shuffleArray(result)
    }

    return result
  }

  if (skipCache) {
    return doQuery()
  }

  const cacheKey = buildGalleryCacheKey('images:list', album, pageNum, {
    cameras, lenses, tags, tagsOperator, sortByShootTime,
  }) + `:ps=${pageSize}`
  return cacheWrap<ImageType[]>(cacheKey, doQuery)
})

/**
 * 根据相册获取图片分页总数（客户端）——接入 Redis 缓存
 */
export async function fetchClientImagesPageTotalByAlbum(
  album: string,
  cameras?: string[],
  lenses?: string[],
  tags?: string[],
  tagsOperator: 'and' | 'or' = 'and',
  pageSize: number = 16
): Promise<number> {
  if (pageSize < 1) {
    pageSize = 16
  }
  const cacheKey = buildGalleryCacheKey('images:count', album, null, {
    cameras, lenses, tags, tagsOperator,
  }) + `:ps=${pageSize}`

  return cacheWrap<number>(cacheKey, async () => {
    const { cameraFilter, lensFilter, tagsFilter } = buildClientFilters({
      cameras,
      lenses,
      tags,
      tagsOperator,
    })

    if (album === '/') {
      const pageTotal = await db.$queryRaw`
    SELECT COALESCE(COUNT(1),0) AS total
    FROM (
        SELECT DISTINCT ON (image.id)
           image.id
        FROM
           "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE
            image.del = 0
        AND
            image.show = 0
        AND
            image.show_on_mainpage = 0
        AND
            albums.del = 0
        AND
            albums.show = 0
            ${cameraFilter}
            ${lensFilter}
            ${tagsFilter}
    ) AS unique_images;
  `
      const totalCount = Array.isArray(pageTotal) && pageTotal.length > 0 ? Number((pageTotal[0] as any).total ?? 0) : 0
      return totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0
    }
    const pageTotal = await db.$queryRaw`
    SELECT COALESCE(COUNT(1),0) AS total
    FROM (
        SELECT DISTINCT ON (image.id)
           image.id
        FROM
           "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
            ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
            ON relation.album_value = albums.album_value
        WHERE
            image.del = 0
        AND
            albums.del = 0
        AND
            image.show = 0
        AND
            albums.show = 0
        AND
            albums.album_value = ${album}
            ${cameraFilter}
            ${lensFilter}
            ${tagsFilter}
    ) AS unique_images;
  `
    const totalCount2 = Array.isArray(pageTotal) && pageTotal.length > 0 ? Number((pageTotal[0] as any).total ?? 0) : 0
    return totalCount2 > 0 ? Math.ceil(totalCount2 / pageSize) : 0
  })
}

/**
 * 获取图片分析数据
 */
export async function fetchImagesAnalysis():
  Promise<{
    total: number,
    showTotal: number,
    crTotal: number,
    tagsTotal: number,
    cameraStats: { count: number; camera: string }[],
    result: {
      name: string;
      value: string;
      created_at: Date;
      updated_at: Date;
      total: number;
      show_total: number;
    }[]
  }> {
  const counts = await db.$queryRaw<[{ images_total: number, images_show: number, cr_total: number, tags_total: number }]>`
    SELECT 
      (SELECT COALESCE(COUNT(*), 0) FROM "public"."images" WHERE del = 0) as images_total,
      (SELECT COALESCE(COUNT(*), 0) FROM "public"."images" WHERE del = 0 AND show = 0) as images_show,
      (SELECT COALESCE(COUNT(*), 0) FROM "public"."albums" WHERE del = 0) as tags_total
  `

  const cameraStats = await db.$queryRaw`
    SELECT COUNT(*) as count, 
      COALESCE(exif->>'model', 'Unknown') as camera
    FROM "public"."images"
    WHERE del = 0
    GROUP BY camera
    ORDER BY count DESC
  ` as { count: number; camera: string }[]

  const result = await db.$queryRaw`
    SELECT
        albums.name AS name,
        albums.album_value AS value,
        albums.created_at AS created_at,
        albums.updated_at AS updated_at,
        COALESCE(COUNT(1), 0) AS total,
        COALESCE(SUM(CASE WHEN image.show = 0 THEN 1 ELSE 0 END), 0) AS show_total
    FROM
        "public"."images" AS image
    INNER JOIN "public"."images_albums_relation" AS relation
        ON image.id = relation."imageId"
    INNER JOIN "public"."albums" AS albums
        ON relation.album_value = albums.album_value
    WHERE 
        image.del = 0
    AND
        albums.del = 0
    GROUP BY albums.name, albums.album_value, albums.created_at, albums.updated_at
    ORDER BY total DESC
  ` as {
    name: string;
    value: string;
    created_at: Date;
    updated_at: Date;
    total: number;
    show_total: number;
  }[]

  // Coerce snake_case keys to numbers
  for (const item of result) {
    item.total = Number(item.total)
    item.show_total = Number(item.show_total)
  }

  const safeCounts = Array.isArray(counts) && counts.length > 0 ? counts[0] : null
  return {
    total: safeCounts ? Number(safeCounts.images_total) : 0,
    showTotal: safeCounts ? Number(safeCounts.images_show) : 0,
    crTotal: safeCounts ? Number(safeCounts.cr_total) : 0,
    tagsTotal: safeCounts ? Number(safeCounts.tags_total) : 0,
    cameraStats,
    result
  }
}

/**
 * 根据图片 ID 获取图片详情
 */
export async function fetchImageByIdAndAuth(id: string): Promise<ImageType> {
  const data: ImageType[] = await db.$queryRaw`
    SELECT
        "images".*,
        "albums".license AS album_license,
        "albums".album_value AS album_value
    FROM
        "images"
    LEFT JOIN "images_albums_relation"
        ON "images"."id" = "images_albums_relation"."imageId"
    LEFT JOIN "albums"
        ON "images_albums_relation".album_value = "albums".album_value
        AND "albums".del = 0
    WHERE
        "images".del = 0
    AND
        "images".show = 0
    AND
        "images"."id" = ${id}
    LIMIT 1
  `
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Image ${id} not found`)
  }
  return data[0]
}

/**
 * 获取最新的 10 张图片
 */
export async function getRSSImages(): Promise<ImageType[]> {
  // 每个相册取最新 10 张照片
  return await db.$queryRaw`
    WITH RankedImages AS (
    SELECT
      i.*,
      A.album_value,
      ROW_NUMBER() OVER (PARTITION BY A.album_value ORDER BY i.created_at DESC) AS rn
    FROM
      images i
      INNER JOIN images_albums_relation iar ON i.ID = iar."imageId"
      INNER JOIN albums A ON iar.album_value = A.album_value
    WHERE
      A.del = 0
      AND A."show" = 0
      AND i.del = 0
      AND i."show" = 0
    )
    SELECT *
    FROM RankedImages
    WHERE rn <= 10;
  `
}

/**
 * 获取精选图片列表（接入 Redis 缓存，首页 SSR 高频访问）
 */
export const fetchFeaturedImages = cache(async (): Promise<ImageType[]> => {
  return cacheWrap('images:featured', async () => {
    const selectFields = `
      image.id,
      image.image_name,
      image.url,
      image.preview_url,
      image.video_url,
      image.blurhash,
      image.width,
      image.height,
      image.title,
      image.detail,
      image.type,
      image.show,
      image.show_on_mainpage,
      image.featured,
      image.sort,
      image.created_at,
      image.updated_at,
      image.labels,
      image.exif
    `

    const data = await db.$queryRaw<ImageType[]>`
      SELECT
          ${Prisma.raw(selectFields)},
          albums.name AS album_name,
          albums.id AS album_value
      FROM
          "public"."images" AS image
      LEFT JOIN "public"."images_albums_relation" AS relation
          ON image.id = relation."imageId"
      LEFT JOIN "public"."albums" AS albums
          ON relation.album_value = albums.album_value
      WHERE
          image.del = 0
      AND
          image.show = 0
      AND
          image.featured = 1
      ORDER BY image.sort DESC, image.created_at DESC
    `

    return data
  })
})

/**
 * 获取所有相机和镜头型号列表
 */
export const fetchCameraAndLensList = cache(async (): Promise<{ cameras: string[], lenses: string[] }> => {
  return cacheWrap('images:camera_lens_list', async () => {
    const stats = await db.$queryRaw<Array<{ camera: string; lens: string }>>`
      SELECT DISTINCT
        COALESCE(exif->>'model', 'Unknown') as camera,
        COALESCE(exif->>'lens_model', 'Unknown') as lens
      FROM "public"."images"
      WHERE del = 0
      ORDER BY camera, lens
    `

    const cameraSet = new Set<string>()
    const lensSet = new Set<string>()

    for (let i = 0; i < stats.length; i++) {
      cameraSet.add(stats[i].camera)
      lensSet.add(stats[i].lens)
    }

    return {
      cameras: Array.from(cameraSet),
      lenses: Array.from(lensSet),
    }
  })
})

export async function invalidateCameraLensListCache(): Promise<void> {
  await cacheInvalidate('images:camera_lens_list')
}

/**
 * 从图片表 exif 字段中提取：快门速度 / 光圈 / ISO
 * ——用于后台图片维护下拉框的"真实数据源"，替代写死的预设值
 */
export const fetchExifPresets = cache(async (): Promise<{
  shutterSpeeds: string[]
  apertures: string[]
  isos: string[]
}> => {
  return cacheWrap('images:exif_presets', async () => {
    const rows = await db.$queryRaw<Array<{ exposure_time: string; f_number: string; iso: string }>>`
      SELECT DISTINCT
        COALESCE(exif->>'exposure_time', '') as exposure_time,
        COALESCE(exif->>'f_number', '')      as f_number,
        COALESCE(exif->>'iso_speed_rating', '') as iso
      FROM "public"."images"
      WHERE del = 0
    `

    const ssSet = new Set<string>()
    const apSet = new Set<string>()
    const isoSet = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      if (r.exposure_time && r.exposure_time.trim() !== '') ssSet.add(r.exposure_time)
      if (r.f_number && r.f_number.trim() !== '')           apSet.add(r.f_number)
      if (r.iso && r.iso.trim() !== '')                      isoSet.add(r.iso)
    }

    return {
      shutterSpeeds: Array.from(ssSet),
      apertures:     Array.from(apSet),
      isos:          Array.from(isoSet),
    }
  })
})

export async function invalidateExifPresetsCache(): Promise<void> {
  await cacheInvalidate('images:exif_presets')
}

/**
 * 写操作后失效图片列表/总数缓存
 * ——传入 album 时只失效该相册的缓存；不传则全部失效（images:list:* / images:count:*）
 */
export async function invalidateGalleryCache(album?: string): Promise<void> {
  if (album) {
    await Promise.all([
      cacheInvalidateByPattern(`images:list:${album}*`),
      cacheInvalidateByPattern(`images:count:${album}*`),
    ])
  } else {
    await Promise.all([
      cacheInvalidateByPattern('images:list:*'),
      cacheInvalidateByPattern('images:count:*'),
    ])
  }
}

/** 写操作后失效精选图缓存 */
export async function invalidateFeaturedCache(): Promise<void> {
  await cacheInvalidate('images:featured')
}

/**
 * 统一的图片相关缓存失效入口（上传/删除/修改排序/修改展示状态等）
 */
export async function invalidateAllImageReadCaches(album?: string): Promise<void> {
  await Promise.all([
    invalidateFeaturedCache(),
    invalidateGalleryCache(album),
    invalidateCameraLensListCache(),
    invalidateExifPresetsCache(),
  ])
}
