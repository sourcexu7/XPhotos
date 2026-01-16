import 'server-only'
import { Hono } from 'hono'
import settings from './settings'
import file from './file'
import images from './open/images'
import albums from './albums'
import alist from './storage/alist'
import auth from './auth'
import publicApi from './public'
import analytics from './analytics'
import { jwtAuth } from './middleware/auth'
import { HTTPException } from 'hono/http-exception'

const route = new Hono()

route.onError((err, c) => {
  if (err instanceof HTTPException) {
    console.error(err)
    return c.json({ message: err.message }, err.status)
  }
  console.error(err)
  return c.json({ message: 'Internal Server Error' }, 500)
})

// Public routes (no authentication required)
route.route('/auth', auth)
route.route('/public', publicApi)

// Protected routes middleware
route.use('/settings/*', jwtAuth)
route.use('/file/*', jwtAuth)
route.use('/images/*', jwtAuth)
route.use('/albums/*', jwtAuth)
route.use('/storage/*', jwtAuth)
route.use('/analytics/*', jwtAuth)

route.route('/settings', settings)
route.route('/file', file)
route.route('/images', images)
route.route('/albums', albums)
route.route('/storage/alist', alist)
route.route('/analytics', analytics)

export default route
