import 'server-only'
import { Hono } from 'hono'
import settings from './settings'
import file from './file'
import images from './images'
import albums from './albums'
import alist from './storage/alist'
import auth from './auth'
import captcha from './captcha'
import publicApi from './public'
import analytics from './analytics'
import guides from './guides'
import guideModules from './guide-modules'
import { jwtAuth } from './middleware/auth'
import { HTTPException } from 'hono/http-exception'

const route = new Hono()

route.onError((err, c) => {
  if (err instanceof HTTPException) {
    console.error(`[HTTP ${err.status}] ${err.message}`)
    return c.json(
      {
        code: httpStatusToCode(err.status),
        message: err.message || defaultMessageFor(err.status),
      },
      err.status,
    )
  }
  console.error(err)
  return c.json(
    { code: 'INTERNAL_ERROR', message: '服务开小差了，请稍后再试' },
    500,
  )
})

function httpStatusToCode(status: number): string {
  switch (status) {
    case 400: return 'BAD_REQUEST'
    case 401: return 'UNAUTHORIZED'
    case 403: return 'FORBIDDEN'
    case 404: return 'NOT_FOUND'
    case 409: return 'CONFLICT'
    case 422: return 'UNPROCESSABLE_ENTITY'
    default: return `HTTP_${status}`
  }
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400: return '请求参数有误'
    case 401: return '未授权，请先登录'
    case 403: return '没有权限执行此操作'
    case 404: return '资源不存在'
    default: return '请求失败'
  }
}

// Public routes (no authentication required)
route.route('/auth', auth)
route.route('/captcha', captcha)
route.route('/public', publicApi)

// Protected routes middleware
route.use('/settings/*', jwtAuth)
route.use('/file/*', jwtAuth)
route.use('/images/*', jwtAuth)
route.use('/albums/*', jwtAuth)
route.use('/storage/*', jwtAuth)
route.use('/analytics/*', jwtAuth)
route.use('/guides/*', jwtAuth)
route.use('/guide-modules/*', jwtAuth)

route.route('/settings', settings)
route.route('/file', file)
route.route('/images', images)
route.route('/albums', albums)
route.route('/storage/alist', alist)
route.route('/analytics', analytics)
route.route('/guides', guides)
route.route('/guide-modules', guideModules)

export default route
