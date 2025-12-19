import 'server-only'
import { fetchAlbumsList } from '~/lib/db/query/albums'
import { deleteAlbum, insertAlbums, updateAlbum, updateAlbumShow, updateAlbumsSort } from '~/lib/db/operate/albums'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

function validateAlbumRoute(albumValue: string) {
  if (albumValue && !albumValue.startsWith('/')) {
    throw new HTTPException(400, { message: 'The route must start with /' })
  }
}

app.get('/get', async (c) => {
  try {
    const data = await fetchAlbumsList()
    return c.json(data)
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to fetch albums', cause: e })
  }
})

app.post('/add', async (c) => {
  try {
    const album = await c.req.json()
    validateAlbumRoute(album.album_value)
    await insertAlbums(album)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to add album', cause: e })
  }
})

app.put('/update', async (c) => {
  try {
    const album = await c.req.json()
    validateAlbumRoute(album.album_value)
    await updateAlbum(album)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to update album', cause: e })
  }
})

app.delete('/delete/:id', async (c) => {
  try {
    const { id } = c.req.param()
    const data = await deleteAlbum(id)
    return c.json(data)
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to delete album', cause: e })
  }
})

app.put('/update-show', async (c) => {
  try {
    const album = await c.req.json()
    const data = await updateAlbumShow(album.id, album.show)
    return c.json(data)
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to update album show status', cause: e })
  }
})

app.put('/update-sort', async (c) => {
  try {
    const body = await c.req.json()
    const orderedIds: unknown = body?.orderedIds

    if (!Array.isArray(orderedIds) || !orderedIds.every((id) => typeof id === 'string')) {
      throw new HTTPException(400, { message: 'Invalid payload for update-sort' })
    }

    await updateAlbumsSort(orderedIds as string[])
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to update album sort', cause: e })
  }
})

export default app