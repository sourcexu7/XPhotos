import 'server-only'
import {
  deleteBatchImage,
  deleteImage,
  insertImage,
  updateImage,
  updateImageShow,
  updateImageAlbum,
} from '~/server/db/operate/images'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import dayjs from 'dayjs'

const app = new Hono()

function validateImageData(data: any) {
  if (!data.url) {
    throw new HTTPException(400, { message: 'Image link cannot be empty' })
  }
  if (!data.height || data.height <= 0) {
    throw new HTTPException(400, { message: 'Image height must be greater than 0' })
  }
  if (!data.width || data.width <= 0) {
    throw new HTTPException(400, { message: 'Image width must be greater than 0' })
  }
}

app.post('/add', async (c) => {
  const body = await c.req.json()
  if (!body) {
    throw new HTTPException(400, { message: 'Missing body' })
  }

  validateImageData(body)

  try {
    // 验证可能存在的时间信息
    if (body?.exif?.data_time && !dayjs(body.exif.data_time).isValid()) {
      body.exif.data_time = ''
    }
    const res = await insertImage(body)
    return c.json({ code: 200, data: res })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to add image', cause: e })
  }
})

app.delete('/batch-delete', async (c) => {
  try {
    const data = await c.req.json()
    await deleteBatchImage(data)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to delete images', cause: e })
  }
})

app.delete('/delete/:id', async (c) => {
  try {
    const { id } = c.req.param()
    await deleteImage(id)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to delete image', cause: e })
  }
})

app.put('/update', async (c) => {
  const image = await c.req.json()
  validateImageData(image)

  try {
    await updateImage(image)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to update image', cause: e })
  }
})

app.put('/update-show', async (c) => {
  try {
    const image = await c.req.json()
    const data = await updateImageShow(image.id, image.show)
    return c.json(data)
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to update image show status', cause: e })
  }
})

app.put('/update-Album', async (c) => {
  try {
    const image = await c.req.json()
    await updateImageAlbum(image.imageId, image.albumId)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to update image album', cause: e })
  }
})

export default app