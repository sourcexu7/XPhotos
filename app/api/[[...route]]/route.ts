import 'server-only'
import { handle } from 'hono/vercel'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import route from '~/server'
import download from '~/server/open/download'
import images from '~/server/open/images'

const app = new Hono().basePath('/api')

// 添加 CORS 支持
app.use('/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 600,
  credentials: true,
}))

app.route('/v1', route)
// 注意只有 /v1 开头是需要鉴权的
app.route('/public/download', download)
app.route('/public/images', images)
app.notFound((c) => {
  return c.text('not found', 404)
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// No default export: Next.js App Router expects named exports per HTTP method
