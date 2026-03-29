// 图片表

'use server'

import { Prisma } from '@prisma/client'
import { db } from '~/lib/db'
import type { ImageType } from '~/types'
import { fetchConfigValue } from './configs'
import { cache } from 'react'

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
  [AlbumImageSorting.SHOOT_TIME_DESC]: 'COALESCE(image.shoot_at, \'1970-01-01 00:00:00\') DESC, image.created_at DESC, image.updated_at DESC',
  [AlbumImageSorting.CREATED_ASC]: 'image.created_at ASC, image.updated_at ASC',
  [AlbumImageSorting.SHOOT_TIME_ASC]: 'COALESCE(image.shoot_at, \'1970-01-01 00:00:00\') ASC, image.created_at ASC, image.updated_at ASC',
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
        Prisma.sql` OR `
      )})`
    : Prisma.empty

  const lensFilter = lensesArray.length > 0
    ? Prisma.sql`AND (${Prisma.join(
        lensesArray.map(l => Prisma.sql`COALESCE(image.exif->>'lens_model', 'Unknown') = ${l}`),
        Prisma.sql` OR `
      )})`
    : Prisma.empty

  const tagsFilter = tagsArray.length > 0
    ? options.tagsOperator === 'and'
      ? Prisma.sql`AND image.labels::jsonb @> ${JSON.stringify(tagsArray)}::jsonb`
      : Prisma.sql`AND (${Prisma.join(
          tagsArray.map(t => Prisma.sql`image.labels::jsonb @> ${JSON.stringify([t])}::jsonb`),
          Prisma.sql` OR `
        )})`
    : Prisma.empty

  return { cameraFilter, lensFilter, tagsFilter }
}

function buildServerFilters(options: FilterOptions) {
  const labelsArray = Array.isArray(options.labels) ? options.labels : (options.labels ? [String(options.labels)] : [])

  const showStatusFilter = options.showStatus !== undefined && options.showStatus !== -1
    ? Prisma.sql`AND image.show = ${options.showStatus}`
    : Prisma.empty

  const featuredFilter = options.featured !== undefined && options.featured !== -1
    ? Prisma.sql`AND image.featured = ${options.featured}`
    : Prisma.empty

  const cameraFilter = options.camera
    ? Prisma.sql`AND COALESCE(image.exif->>'model', 'Unknown') = ${options.camera}`
    : Prisma.empty

  const lensFilter = options.lens
    ? Prisma.sql`AND COALESCE(image.exif->>'lens_model', 'Unknown') = ${options.lens}`
    : Prisma.empty

  const exposureFilter = options.exposure
    ? Prisma.sql`AND COALESCE(image.exif->>'exposure_time', '') = ${options.exposure}`
    : Prisma.empty

  const fNumberFilter = options.f_number
    ? Prisma.sql`AND COALESCE(image.exif->>'f_number', '') = ${options.f_number}`
    : Prisma.empty

  const isoFilter = options.iso
    ? Prisma.sql`AND COALESCE(image.exif->>'iso_speed_rating', '') = ${options.iso}`
    : Prisma.empty

  const labelsFilter = labelsArray.length > 0
    ? options.labelsOperator === 'and'
      ? Prisma.sql`AND image.labels::jsonb @> ${JSON.stringify(labelsArray)}::jsonb`
      : Prisma.sql`AND (${Prisma.join(
          labelsArray.map(l => Prisma.sql`image.labels::jsonb @> ${JSON.stringify([l])}::jsonb`),
          Prisma.sql` OR `
        )})`
    : Prisma.empty

  return {
    showStatusFilter,
    featuredFilter,
    cameraFilter,
    lensFilter,
    exposureFilter,
    fNumberFilter,
    isoFilter,
    labelsFilter,
  }
}

export type ServerImagesPageResult = {
  items: ImageType[]
  total: number
  pageTotal: number
  pageSize: number
}

/**
 * 后台：一次查询返回列表 + 总数（避免列表与 count 两次重查询）
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

  const offset = (normalizedPageNum - 1) * pageSize

  const filters = buildServerFilters({
    showStatus,
    featured,
    camera,
    lens,
    exposure,
    f_number: f_number,
    iso,
    labels,
    labelsOperator,
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

  // 管理端图片维护：按最新上传优先
  const orderByFinal = Prisma.sql`image.created_at DESC, image.updated_at DESC, image.sort ASC`

  if (normalizedAlbum && normalizedAlbum !== '') {
    const rows = await db.$queryRaw<Array<ImageType & { total: number }>>`
      WITH filtered AS (
        SELECT DISTINCT
          image.id,
          image.created_at,
          image.updated_at
        FROM "public"."images" AS image
        INNER JOIN "public"."images_albums_relation" AS relation
          ON image.id = relation."imageId"
        INNER JOIN "public"."albums" AS albums
          ON relation.album_value = albums.album_value
        WHERE
          image.del = 0
          AND albums.del = 0
          AND albums.album_value = ${normalizedAlbum}
          ${filters.showStatusFilter}
          ${filters.featuredFilter}
          ${filters.cameraFilter}
          ${filters.lensFilter}
          ${filters.exposureFilter}
          ${filters.fNumberFilter}
          ${filters.isoFilter}
          ${filters.labelsFilter}
      ),
      counted AS (
        SELECT id, (SELECT COUNT(*) FROM filtered) AS total
        FROM filtered
        ORDER BY created_at DESC, updated_at DESC, id DESC
        LIMIT ${pageSize} OFFSET ${offset}
      )
      SELECT
        ${Prisma.raw(selectFields)},
        albums.name AS album_name,
        albums.id AS album_value,
        counted.total AS total
      FROM counted
      INNER JOIN "public"."images" AS image
        ON image.id = counted.id
      INNER JOIN "public"."images_albums_relation" AS relation
        ON image.id = relation."imageId"
      INNER JOIN "public"."albums" AS albums
        ON relation.album_value = albums.album_value
      WHERE
        image.del = 0
        AND albums.del = 0
        AND albums.album_value = ${normalizedAlbum}
      ORDER BY ${orderByFinal}
    `

    const total = rows.length > 0 ? Number((rows[0] as any).total ?? 0) : 0
    const items = rows.map(({ total: _t, ...rest }) => rest as unknown as ImageType)

    return {
      items,
      total,
      pageTotal: total > 0 ? Math.ceil(total / pageSize) : 0,
      pageSize,
    }
  }

  const rows = await db.$queryRaw<Array<ImageType & { total: number }>>`
    WITH filtered AS (
      SELECT DISTINCT
        image.id,
        image.created_at,
        image.updated_at
      FROM "public"."images" AS image
      LEFT JOIN "public"."images_albums_relation" AS relation
        ON image.id = relation."imageId"
      LEFT JOIN "public"."albums" AS albums
        ON relation.album_value = albums.album_value
      WHERE
        image.del = 0
        ${filters.showStatusFilter}
        ${filters.featuredFilter}
        ${filters.cameraFilter}
        ${filters.lensFilter}
        ${filters.exposureFilter}
        ${filters.fNumberFilter}
        ${filters.isoFilter}
        ${filters.labelsFilter}
    ),
    counted AS (
      SELECT id, (SELECT COUNT(*) FROM filtered) AS total
      FROM filtered
      ORDER BY created_at DESC, updated_at DESC, id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    )
    SELECT
      ${Prisma.raw(selectFields)},
      albums.name AS album_name,
      albums.id AS album_value,
      counted.total AS total
    FROM counted
    INNER JOIN "public"."images" AS image
      ON image.id = counted.id
    LEFT JOIN "public"."images_albums_relation" AS relation
      ON image.id = relation."imageId"
    LEFT JOIN "public"."albums" AS albums
      ON relation.album_value = albums.album_value
    WHERE
      image.del = 0
    ORDER BY ${orderByFinal}
  `

  const total = rows.length > 0 ? Number((rows[0] as any).total ?? 0) : 0
  const items = rows.map(({ total: _t, ...rest }) => rest as unknown as ImageType)

  return {
    items,
    total,
    pageTotal: total > 0 ? Math.ceil(total / pageSize) : 0,
    pageSize,
  }
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

  const offset = (normalizedPageNum - 1) * pageSize

  const filters = buildServerFilters({
    showStatus,
    featured,
    camera,
    lens,
    exposure,
    f_number: f_number,
    iso,
    labels,
    labelsOperator,
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

  if (normalizedAlbum) {
    result = await db.$queryRaw`
      SELECT 
          ${Prisma.raw(selectFields)},
          albums.name AS album_name,
          albums.id AS album_value
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
          albums.album_value = ${normalizedAlbum}
          ${filters.showStatusFilter}
          ${filters.featuredFilter}
          ${filters.cameraFilter}
          ${filters.lensFilter}
          ${filters.exposureFilter}
          ${filters.fNumberFilter}
          ${filters.isoFilter}
          ${filters.labelsFilter}
      ORDER BY image.created_at DESC, image.updated_at DESC, image.sort ASC
      LIMIT ${pageSize} OFFSET ${offset}
    `
  } else {
    result = await db.$queryRaw`
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
        ${filters.showStatusFilter}
        ${filters.featuredFilter}
        ${filters.cameraFilter}
        ${filters.lensFilter}
        ${filters.exposureFilter}
        ${filters.fNumberFilter}
        ${filters.isoFilter}
        ${filters.labelsFilter}
      ORDER BY image.created_at DESC, image.updated_at DESC, image.sort ASC 
      LIMIT ${pageSize} OFFSET ${offset}
    `
  }

  return result
}

/**
 * 根据相册获取图片分页总数（服务端）
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
  const filters = buildServerFilters({
    showStatus,
    featured,
    camera,
    lens,
    exposure,
    f_number: f_number,
    iso,
    labels,
    labelsOperator,
  })

  const normalizedAlbum = album === 'all' ? '' : album

  let count: number

  if (normalizedAlbum && normalizedAlbum !== '') {
    const pageTotal = await db.$queryRaw`
      SELECT COALESCE(COUNT(DISTINCT image.id), 0) AS total
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
          albums.album_value = ${normalizedAlbum}
          ${filters.showStatusFilter}
          ${filters.featuredFilter}
          ${filters.cameraFilter}
          ${filters.lensFilter}
          ${filters.exposureFilter}
          ${filters.fNumberFilter}
          ${filters.isoFilter}
          ${filters.labelsFilter}
    `
    // @ts-expect-error - The query result is guaranteed to have a total field
    count = Number(pageTotal[0].total) ?? 0
  } else {
    const pageTotal = await db.$queryRaw`
      SELECT COALESCE(COUNT(DISTINCT image.id), 0) AS total
      FROM
          "public"."images" AS image
      LEFT JOIN "public"."images_albums_relation" AS relation
          ON image.id = relation."imageId"
      LEFT JOIN "public"."albums" AS albums
          ON relation.album_value = albums.album_value
      WHERE
          image.del = 0
          ${filters.showStatusFilter}
          ${filters.featuredFilter}
          ${filters.cameraFilter}
          ${filters.lensFilter}
          ${filters.exposureFilter}
          ${filters.fNumberFilter}
          ${filters.isoFilter}
          ${filters.labelsFilter}
    `
    // @ts-expect-error - The query result is guaranteed to have a total field
    count = Number(pageTotal[0].total) ?? 0
  }

  return count
}

/**
 * 根据相册获取图片分页列表（客户端）
 */
export async function fetchClientImagesListByAlbum(
  pageNum: number,
  album: string,
  cameras?: string[],
  lenses?: string[],
  tags?: string[],
  tagsOperator: 'and' | 'or' = 'and',
  sortByShootTime?: 'desc' | 'asc'
): Promise<ImageType[]> {
  if (pageNum < 1) {
    pageNum = 1
  }

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
  let albumData: { random_show: number } | null = null

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
        COALESCE(
          image.shoot_at,
          '1970-01-01 00:00:00'::timestamp
        ) DESC,
        image.created_at DESC,
        image.updated_at DESC
      LIMIT 16 OFFSET ${(pageNum - 1) * 16}
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
        COALESCE(
          image.shoot_at,
          '1970-01-01 00:00:00'::timestamp
        ) ASC,
        image.created_at ASC,
        image.updated_at ASC
      LIMIT 16 OFFSET ${(pageNum - 1) * 16}
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
      LIMIT 16 OFFSET ${(pageNum - 1) * 16}
    `
    }
  } else {
    albumData = await db.albums.findFirst({
      where: {
        album_value: album
      }
    })

    let orderBy = Prisma.sql(['image.sort ASC, image.created_at DESC, image.updated_at DESC'])
    if (albumData?.image_sorting && ALBUM_IMAGE_SORTING_ORDER[albumData.image_sorting]) {
      orderBy = Prisma.sql([`image.sort ASC, ${ALBUM_IMAGE_SORTING_ORDER[albumData.image_sorting]}`])
    }

    result = await db.$queryRaw`
      SELECT 
          ${Prisma.raw(selectFields)},
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
      LIMIT 16 OFFSET ${(pageNum - 1) * 16}
    `
  }

  if (result && albumData && albumData.random_show === 0) {
    result = shuffleArray(result)
  }

  return result
}

/**
 * 根据相册获取图片分页总数（客户端）
 */
export async function fetchClientImagesPageTotalByAlbum(
  album: string,
  cameras?: string[],
  lenses?: string[],
  tags?: string[],
  tagsOperator: 'and' | 'or' = 'and'
): Promise<number> {
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
    // @ts-expect-error -- $queryRaw returns an untyped row object from SQL
    return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / 16) : 0
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
  // @ts-expect-error -- $queryRaw returns an untyped row object from SQL; page total
  return Number(pageTotal[0].total) > 0 ? Math.ceil(Number(pageTotal[0].total) / 16) : 0
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

  // @ts-expect-error -- prisma raw result uses snake_case keys without type guard; coerce to numbers
  ;(result as any).total = Number((result as any).total)
  // @ts-expect-error -- prisma raw result uses snake_case keys without type guard; coerce to numbers
  ;(result as any).show_total = Number((result as any).show_total)

  return {
    total: Number(counts[0].images_total),
    showTotal: Number(counts[0].images_show),
    crTotal: Number(counts[0].cr_total),
    tagsTotal: Number(counts[0].tags_total),
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
 * 获取精选图片列表
 */
export const fetchFeaturedImages = cache(async (): Promise<ImageType[]> => {
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

/**
 * 获取所有相机和镜头型号列表
 */
export async function fetchCameraAndLensList(): Promise<{ cameras: string[], lenses: string[] }> {
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
    lenses: Array.from(lensSet)
  }
}
