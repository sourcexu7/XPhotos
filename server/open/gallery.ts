import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/lib/db/query/images'

const app = new Hono()

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  album: z.string().default('/'),
  cameras: z.string().optional(),
  lenses: z.string().optional(),
  tags: z.string().optional(),
  tagsOperator: z.enum(['and', 'or']).optional(),
  sortByShootTime: z.enum(['asc', 'desc']).optional(),
})

function splitCsv(v?: string | null): string[] | undefined {
  if (!v) return undefined
  const list = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return list.length > 0 ? list : undefined
}

app.get('/images', async (c) => {
  try {
    const { searchParams } = new URL(c.req.url)

    const parsed = querySchema.safeParse({
      page: searchParams.get('page') ?? '1',
      album: searchParams.get('album') ?? '/',
      cameras: searchParams.get('cameras') ?? undefined,
      lenses: searchParams.get('lenses') ?? undefined,
      tags: searchParams.get('tags') ?? undefined,
      tagsOperator: searchParams.get('tagsOperator') ?? undefined,
      sortByShootTime: searchParams.get('sortByShootTime') ?? undefined,
    })

    if (!parsed.success) {
      throw new HTTPException(400, { message: 'Invalid query params', cause: parsed.error })
    }

    const q = parsed.data

    const cameras = splitCsv(q.cameras)
    const lenses = splitCsv(q.lenses)
    const tags = splitCsv(q.tags)

    const list = await fetchClientImagesListByAlbum(
      q.page,
      q.album,
      cameras,
      lenses,
      tags,
      tags && tags.length > 0 ? (q.tagsOperator ?? 'and') : 'and',
      q.sortByShootTime
    )

    const pageTotal = await fetchClientImagesPageTotalByAlbum(
      q.album,
      cameras,
      lenses,
      tags,
      tags && tags.length > 0 ? (q.tagsOperator ?? 'and') : 'and'
    )

    return c.json({
      page: q.page,
      pageSize: 16,
      pageTotal,
      items: list,
    })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to fetch public gallery images', cause: e })
  }
})

export default app

