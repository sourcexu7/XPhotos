import 'server-only'
import { Hono } from 'hono'
import settings from '~/hono/settings'
import file from '~/hono/file'
import images from '~/hono/images'
import albums from '~/hono/albums'
import alist from '~/hono/storage/alist'
import { HTTPException } from 'hono/http-exception'

const route = new Hono()

route.onError((err, c) => {
  if (err instanceof HTTPException) {
    console.error(err)
    return err.getResponse()
  }
  console.error(err)
  return c.json({ message: 'Internal Server Error' }, 500)
})

route.route('/settings', settings)
route.route('/file', file)
route.route('/images', images)
route.route('/albums', albums)
// tags 路由已挂载到 /settings/tags 下，这里无需再挂载
route.route('/storage/alist', alist)

export default route