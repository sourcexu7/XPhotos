import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/lib/db/query/images'

const app = new Hono()

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  album: z.string().default('/'),
  pageSize: z.coerce.number().int().min(1).max(200).default(16),
  cameras: z.string().optional(),
  lenses: z.string().optional(),
  tags: z.string().optional(),
  tagsOperator: z.enum(['and', 'or']).optional(),
  sortByShootTime: z.enum(['asc', 'desc']).optional(),
  // 布局参数：由客户端在首次渲染后测量并附带
  containerWidth: z.coerce.number().int().min(1).optional(),
  cols: z.coerce.number().int().min(1).max(8).optional(),
  gap: z.coerce.number().int().min(0).max(40).optional(),
  // 上一页末尾的列高度状态，JSON 序列化的 number[]，用于跨页连续计算
  colHeights: z.string().optional(),
})

function splitCsv(v?: string | null): string[] | undefined {
  if (!v) return undefined
  const list = v.split(',').map((s) => s.trim()).filter(Boolean)
  return list.length > 0 ? list : undefined
}

/** 服务端瀑布流布局计算，返回每张图的绝对定位信息 */
function computeLayout(
  items: { id: string; width: number; height: number }[],
  containerWidth: number,
  cols: number,
  gap: number,
  initialColHeights: number[],
): {
  slots: { id: string; x: number; y: number; w: number; h: number }[]
  colHeights: number[]
} {
  const colWidth = Math.floor((containerWidth - gap * (cols - 1)) / cols)
  const colHeights = initialColHeights.length === cols
    ? [...initialColHeights]
    : new Array<number>(cols).fill(initialColHeights[0] ?? 0)

  const slots = items.map((img) => {
    const rw = img.width > 0 ? img.width : 0
    const rh = img.height > 0 ? img.height : 0
    const ratio = rw > 0 && rh > 0 ? rw / rh : 3 / 4
    // 高度上限 2.5 倍列宽，避免超高竖图
    const h = Math.min(Math.round(colWidth / ratio), Math.round(colWidth * 2.5))

    // 选最短列
    let col = 0
    for (let c = 1; c < cols; c++) {
      if (colHeights[c] < colHeights[col]) col = c
    }
    const x = col * (colWidth + gap)
    const y = colHeights[col]
    colHeights[col] += h + gap

    return { id: img.id, x, y, w: colWidth, h }
  })

  return { slots, colHeights }
}

app.get('/images', async (c) => {
  try {
    const { searchParams } = new URL(c.req.url)

    const parsed = querySchema.safeParse({
      page: searchParams.get('page') ?? '1',
      album: searchParams.get('album') ?? '/',
      pageSize: searchParams.get('pageSize') ?? undefined,
      cameras: searchParams.get('cameras') ?? undefined,
      lenses: searchParams.get('lenses') ?? undefined,
      tags: searchParams.get('tags') ?? undefined,
      tagsOperator: searchParams.get('tagsOperator') ?? undefined,
      sortByShootTime: searchParams.get('sortByShootTime') ?? undefined,
      containerWidth: searchParams.get('containerWidth') ?? undefined,
      cols: searchParams.get('cols') ?? undefined,
      gap: searchParams.get('gap') ?? undefined,
      colHeights: searchParams.get('colHeights') ?? undefined,
    })

    if (!parsed.success) {
      throw new HTTPException(400, { message: 'Invalid query params', cause: parsed.error })
    }

    const q = parsed.data
    const cameras = splitCsv(q.cameras)
    const lenses = splitCsv(q.lenses)
    const tags = splitCsv(q.tags)

    const [list, pageTotal] = await Promise.all([
      fetchClientImagesListByAlbum(
        q.page, q.album, cameras, lenses, tags,
        tags && tags.length > 0 ? (q.tagsOperator ?? 'and') : 'and',
        q.sortByShootTime,
        q.pageSize,
      ),
      fetchClientImagesPageTotalByAlbum(
        q.album, cameras, lenses, tags,
        tags && tags.length > 0 ? (q.tagsOperator ?? 'and') : 'and',
        q.pageSize,
      ),
    ])

    // 如果客户端传了布局参数，后端计算每张图的绝对定位
    let layoutSlots: { id: string; x: number; y: number; w: number; h: number }[] | undefined
    let nextColHeights: number[] | undefined

    if (q.containerWidth && q.cols) {
      const gap = q.gap ?? 6
      let initialColHeights: number[] = new Array<number>(q.cols).fill(0)
      if (q.colHeights) {
        try {
          const parsed = JSON.parse(q.colHeights) as unknown
          if (Array.isArray(parsed) && parsed.length === q.cols) {
            initialColHeights = parsed as number[]
          }
        } catch { /* 解析失败时用全零 */ }
      }

      const listForLayout = list.map(img => ({
        id: img.id,
        width: img.width || 0,
        height: img.height || 0,
      }))
      const result = computeLayout(listForLayout, q.containerWidth, q.cols, gap, initialColHeights)
      layoutSlots = result.slots
      nextColHeights = result.colHeights
    }

    const res = c.json({
      page: q.page,
      pageSize: q.pageSize,
      pageTotal,
      items: list,
      // 布局数据（仅在客户端传了 containerWidth+cols 时才有）
      layout: layoutSlots
        ? {
            containerWidth: q.containerWidth!,
            cols: q.cols!,
            gap: q.gap ?? 6,
            slots: layoutSlots,
            // 下一页请求时需要传入这些列高，保证连续性
            nextColHeights,
          }
        : undefined,
    })

    const hasFilters = q.cameras || q.lenses || q.tags
    const maxAge = hasFilters ? 30 : 60
    res.headers.set('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=300`)
    return res
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to fetch public gallery images', cause: e })
  }
})

export default app
