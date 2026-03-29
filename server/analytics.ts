import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { getVisitAnalytics } from '~/lib/db/query/analytics'

const app = new Hono()

/**
 * 管理后台访问统计接口
 * 路由前会由 jwtAuth 中间件完成鉴权
 */
app.get('/', async (c) => {
  try {
    const data = await getVisitAnalytics()
    return c.json(data)
  } catch (error) {
    console.error('Error fetching visit analytics:', error)
    throw new HTTPException(500, { message: 'Failed to fetch visit analytics' })
  }
})

export default app




