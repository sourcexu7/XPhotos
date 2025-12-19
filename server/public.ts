import 'server-only'

import { fetchConfigsByKeys } from '~/lib/db/query/configs'
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
      'about_photo_original_url',
      'about_photo_preview_url',
      'about_ins_url',
      'about_xhs_url',
      'about_weibo_url',
      'about_github_url',
      'about_gallery_images',
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

