import 'server-only'

import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import { fetchAlbumsShowWithCounts } from '~/lib/db/query/albums'
import gallery from '~/server/open/gallery'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { db } from '~/lib/db'

const app = new Hono()

/**
 * 公开 API：获取「关于我」页面配置（无需登录）
 * 仅返回前台展示所需的配置项，不包含敏感信息
 */
app.get('/about-info', async (c) => {
  try {
    const data = await fetchConfigsByKeys([
      // 「关于我」前台展示配置
      'about_intro',
      'about_ins_url',
      'about_xhs_url',
      'about_weibo_url',
      'about_github_url',
      'about_gallery_images', // 向后兼容
      'about_gallery_images_full', // 完整数据（包含原图和预览图）
    ])
    return c.json(data)
  } catch (error) {
    console.error('Error fetching about info:', error)
    throw new HTTPException(500, { message: 'Failed to fetch about info', cause: error })
  }
})

/**
 * 公开 API：获取网站基础信息（无需登录）
 * 用于前台页面的网站标题、作者等显示
 */
app.get('/site-info', async (c) => {
  try {
    const data = await fetchConfigsByKeys([
      'custom_title',
      'custom_favicon_url',
      'custom_author',
      'custom_index_style',
      'custom_index_download_enable',
      'custom_index_origin_enable',
    ])
    return c.json(data)
  } catch (error) {
    console.error('Error fetching site info:', error)
    throw new HTTPException(500, { message: 'Failed to fetch site info' })
  }
})

/**
 * 公开 API：获取 /covers 封面页数据（相册 + 公开图片数量）
 * 用于前端 SWR 缓存，避免移动端返回/切换时重复请求导致卡顿/崩溃
 */
app.get('/covers', async (c) => {
  try {
    const data = await fetchAlbumsShowWithCounts()
    return c.json(data)
  } catch (error) {
    console.error('Error fetching covers:', error)
    throw new HTTPException(500, { message: 'Failed to fetch covers', cause: error })
  }
})

app.route('/gallery', gallery)

/**
 * 公开 API：获取所有攻略列表（无需登录）
 */
app.get('/guides', async (c) => {
  try {
    const guides = await db.guides.findMany({
      where: {
        del: 0,
        show: 1,
      },
      include: {
        components: true,
      },
      orderBy: [
        { sort: 'asc' },
        { createdAt: 'desc' },
      ],
    })
    return c.json({ data: guides })
  } catch (error) {
    console.error('Error fetching guides:', error)
    throw new HTTPException(500, { message: 'Failed to fetch guides', cause: error })
  }
})

/**
 * 公开 API：获取单个攻略详情（无需登录）
 */
app.get('/guides/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const guide = await db.guides.findUnique({
      where: {
        id,
        del: 0,
        show: 1,
      },
      include: {
        components: true,
        albums: {
          include: {
            album: true,
          },
        },
        modules: {
          where: {
            is_hidden: false,
          },
          include: {
            contents: {
              orderBy: { sort: 'asc' },
            },
          },
          orderBy: { sort: 'asc' },
        },
      },
    })
    if (!guide) {
      throw new HTTPException(404, { message: 'Guide not found' })
    }
    
    const modulesWithData = await Promise.all(
      (guide.modules || []).map(async (mod: any) => {
        const specialTemplates = ['itinerary', 'expense', 'checklist', 'transport', 'photo', 'tips']
        if (specialTemplates.includes(mod.template)) {
          const moduleData = await db.guideModuleContents.findFirst({
            where: {
              module_id: mod.id,
              type: 'module_data',
            },
          })
          return { ...mod, moduleData: moduleData?.content || [] }
        }
        return mod
      })
    )
    
    return c.json({ data: { ...guide, modules: modulesWithData } })
  } catch (error) {
    console.error('Error fetching guide:', error)
    if (error instanceof HTTPException) {
      throw error
    }
    throw new HTTPException(500, { message: 'Failed to fetch guide', cause: error })
  }
})

function inferPageType(path: string): string {
  if (path === '/' || path.startsWith('/home')) return 'home'
  if (path.startsWith('/albums') || path.startsWith('/covers')) return 'gallery'
  if (path.startsWith('/preview') || path.startsWith('/theme')) return 'album'
  if (path.startsWith('/admin')) return 'admin'
  return 'other'
}

function inferSource(referrer: string | null): string {
  if (!referrer) return 'direct'
  const lower = referrer.toLowerCase()
  if (lower.includes('google.') || lower.includes('bing.') || lower.includes('baidu.')) {
    return 'search'
  }
  return 'referer'
}

/**
 * 公开 API：记录访问日志（前台页面挂载时上报）
 * 仅记录基础信息，不包含敏感数据
 */
app.post('/visit-log', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({} as any))
    const rawPath = typeof body?.path === 'string' ? body.path : '/'
    const pageType = typeof body?.pageType === 'string' ? body.pageType : inferPageType(rawPath)

    const ipHeader = c.req.header('x-forwarded-for') || c.req.header('x-real-ip')
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : undefined
    const userAgent = c.req.header('user-agent') || undefined
    const referrer = c.req.header('referer') || undefined
    const source = inferSource(referrer ?? null)

    await db.visitLog.create({
      data: {
        path: rawPath,
        pageType,
        ip,
        userAgent,
        referrer,
        source,
      },
    })

    return c.json({ ok: true })
  } catch (error) {
    console.error('Error writing visit log:', error)
    // 不把错误暴露给前端，只返回 204，避免影响前台体验
    return c.json({ ok: false }, 204)
  }
})

export default app
