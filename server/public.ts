import 'server-only'

import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

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
    throw new HTTPException(500, { message: 'Failed to fetch site info', cause: error })
  }
})

export default app

