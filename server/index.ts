import 'server-only'
import { Hono } from 'hono'
import settings from './settings'
import file from './file'
import images from './images'
import albums from './albums'
import alist from './storage/alist'
import auth from './auth'
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

// Auth routes (public)
route.route('/auth', auth)

// Protected routes middleware
route.use('/settings/*', jwtAuth)
route.use('/file/*', jwtAuth)
route.use('/images/*', jwtAuth)
route.use('/albums/*', jwtAuth)
route.use('/storage/*', jwtAuth)

route.route('/settings', settings)
route.route('/file', file)
route.route('/images', images)
route.route('/albums', albums)
route.route('/storage/alist', alist)

export default route
