import { Prisma } from '@prisma/client'
import { db } from '~/lib/db'
import type { ImageType } from '~/types'

/**
 * 统一的 SELECT 字段列表
 * ——所有图片查询共享的字段定义
 */
export const IMAGE_SELECT_FIELDS = `
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

/**
 * 服务器端过滤选项
 */
export interface ServerFilterOptions {
  showStatus?: number
  featured?: number
  camera?: string
  lens?: string
  exposure?: string
  f_number?: string
  iso?: string
  labels?: string[]
  labelsOperator?: 'and' | 'or'
}

/**
 * 构建服务器端过滤条件（复用 images.ts 中的 buildServerFilters 逻辑）
 */
export function buildServerFilters(options: ServerFilterOptions) {
  const labelsArray = Array.isArray(options.labels)
    ? options.labels
    : options.labels
      ? [String(options.labels)]
      : []

  const showStatusFilter =
    options.showStatus !== undefined && options.showStatus !== -1
      ? Prisma.sql`AND image.show = ${options.showStatus}`
      : Prisma.empty

  const featuredFilter =
    options.featured !== undefined && options.featured !== -1
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
          labelsArray.map((l) => Prisma.sql`image.labels::jsonb @> ${JSON.stringify([l])}::jsonb`),
          ' OR '
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

type ServerFilters = ReturnType<typeof buildServerFilters>

/**
 * 图片查询构建器
 *
 * 统一封装三种后台查询模式：
 *   1. 分页查询 + 总数（CTE 方式，一次查询）
 *   2. 简单列表查询
 *   3. 总数查询
 *
 * 根据是否传入 album 自动选择 INNER JOIN（有具体相册）或 LEFT JOIN（所有相册）
 */
export class ImageQueryBuilder {
  private album: string
  private filters: ServerFilters
  private pageSize = 8
  private pageNum = 1

  constructor(options: {
    album?: string
    pageNum?: number
    pageSize?: number
    filters?: ServerFilterOptions
  }) {
    this.album = options.album || ''
    this.pageSize = options.pageSize ?? 8
    this.pageNum = options.pageNum ?? 1
    this.filters = buildServerFilters(options.filters || {})
  }

  /**
   * 是否为特定相册查询
   */
  private hasAlbum(): boolean {
    return this.album !== ''
  }

  /**
   * 获取相册相关的 WHERE 条件
   */
  private getAlbumWhere(): Prisma.Sql {
    if (this.hasAlbum()) {
      return Prisma.sql`
        AND albums.del = 0
        AND albums.album_value = ${this.album}
      `
    }
    return Prisma.empty
  }

  /**
   * 构建分页查询（一次查询同时返回列表和总数）
   *
   * 通过 CTE 方式：
   *   filtered -> 过滤出符合条件的图片 ID
   *   counted  -> 对 filtered 应用分页并附带总数
   *   主查询    -> 取完整字段
   */
  async buildPaginatedQuery(): Promise<{
    items: ImageType[]
    total: number
    pageTotal: number
    pageSize: number
  }> {
    const pageSize = this.pageSize
    const pageNum = Math.max(1, this.pageNum)
    const offset = (pageNum - 1) * pageSize
    const albumWhere = this.getAlbumWhere()

    // 相册特定查询：INNER JOIN + album_value 过滤 + albums.del = 0
    if (this.hasAlbum()) {
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
            ${albumWhere}
            ${this.filters.showStatusFilter}
            ${this.filters.featuredFilter}
            ${this.filters.cameraFilter}
            ${this.filters.lensFilter}
            ${this.filters.exposureFilter}
            ${this.filters.fNumberFilter}
            ${this.filters.isoFilter}
            ${this.filters.labelsFilter}
        ),
        counted AS (
          SELECT id, (SELECT COUNT(*) FROM filtered) AS total
          FROM filtered
          ORDER BY created_at DESC, updated_at DESC, id DESC
          LIMIT ${pageSize} OFFSET ${offset}
        )
        SELECT
          ${Prisma.raw(IMAGE_SELECT_FIELDS)},
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
          ${albumWhere}
        ORDER BY image.sort ASC, image.created_at DESC, image.updated_at DESC
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

    // 无具体相册：LEFT JOIN + 无需 albums.del 或 album_value 过滤
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
          ${this.filters.showStatusFilter}
          ${this.filters.featuredFilter}
          ${this.filters.cameraFilter}
          ${this.filters.lensFilter}
          ${this.filters.exposureFilter}
          ${this.filters.fNumberFilter}
          ${this.filters.isoFilter}
          ${this.filters.labelsFilter}
      ),
      counted AS (
        SELECT id, (SELECT COUNT(*) FROM filtered) AS total
        FROM filtered
        ORDER BY created_at DESC, updated_at DESC, id DESC
        LIMIT ${pageSize} OFFSET ${offset}
      )
      SELECT
        ${Prisma.raw(IMAGE_SELECT_FIELDS)},
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
      ORDER BY image.sort ASC, image.created_at DESC, image.updated_at DESC
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
   * 构建简单的分页列表查询（不带总数）
   * 
   * 根据是否有相册选择不同的查询方式：
   * - 有具体相册：INNER JOIN（只保留匹配该相册的图片）
   * - 无具体相册：LEFT JOIN（保留所有图片）
   */
  async buildListQuery(): Promise<ImageType[]> {
    const pageSize = this.pageSize
    const pageNum = Math.max(1, this.pageNum)
    const offset = (pageNum - 1) * pageSize
    const albumWhere = this.getAlbumWhere()

    // 相册特定查询：INNER JOIN + album_value 过滤 + albums.del = 0
    if (this.hasAlbum()) {
      const result = await db.$queryRaw`
        SELECT
            ${Prisma.raw(IMAGE_SELECT_FIELDS)},
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
            ${albumWhere}
            ${this.filters.showStatusFilter}
            ${this.filters.featuredFilter}
            ${this.filters.cameraFilter}
            ${this.filters.lensFilter}
            ${this.filters.exposureFilter}
            ${this.filters.fNumberFilter}
            ${this.filters.isoFilter}
            ${this.filters.labelsFilter}
        ORDER BY image.sort ASC, image.created_at DESC, image.updated_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `

      return result as ImageType[]
    }

    // 无具体相册：LEFT JOIN + 无需 albums.del 或 album_value 过滤
    const result = await db.$queryRaw`
      SELECT
          ${Prisma.raw(IMAGE_SELECT_FIELDS)},
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
          ${this.filters.showStatusFilter}
          ${this.filters.featuredFilter}
          ${this.filters.cameraFilter}
          ${this.filters.lensFilter}
          ${this.filters.exposureFilter}
          ${this.filters.fNumberFilter}
          ${this.filters.isoFilter}
          ${this.filters.labelsFilter}
      ORDER BY image.sort ASC, image.created_at DESC, image.updated_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `

    return result as ImageType[]
  }

  /**
   * 构建总数查询
   * 
   * 根据是否有相册选择不同的查询方式：
   * - 有具体相册：INNER JOIN（只保留匹配该相册的图片）
   * - 无具体相册：LEFT JOIN（保留所有图片）
   */
  async buildCountQuery(): Promise<number> {
    const albumWhere = this.getAlbumWhere()

    // 相册特定查询：INNER JOIN + album_value 过滤 + albums.del = 0
    if (this.hasAlbum()) {
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
            ${albumWhere}
            ${this.filters.showStatusFilter}
            ${this.filters.featuredFilter}
            ${this.filters.cameraFilter}
            ${this.filters.lensFilter}
            ${this.filters.exposureFilter}
            ${this.filters.fNumberFilter}
            ${this.filters.isoFilter}
            ${this.filters.labelsFilter}
      `

      return Array.isArray(pageTotal) && pageTotal.length > 0
        ? Number((pageTotal[0] as any).total ?? 0)
        : 0
    }

    // 无具体相册：LEFT JOIN + 无需 albums.del 或 album_value 过滤
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
          ${this.filters.showStatusFilter}
          ${this.filters.featuredFilter}
          ${this.filters.cameraFilter}
          ${this.filters.lensFilter}
          ${this.filters.exposureFilter}
          ${this.filters.fNumberFilter}
          ${this.filters.isoFilter}
          ${this.filters.labelsFilter}
    `

    return Array.isArray(pageTotal) && pageTotal.length > 0
      ? Number((pageTotal[0] as any).total ?? 0)
      : 0
  }
}

/**
 * 创建图片查询构建器的工厂函数
 */
export function createImageQueryBuilder(options: {
  album?: string
  pageNum?: number
  pageSize?: number
  filters?: ServerFilterOptions
}): ImageQueryBuilder {
  return new ImageQueryBuilder(options)
}
