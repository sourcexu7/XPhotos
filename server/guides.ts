import { Hono } from 'hono'
import { jwtAuth } from './middleware/auth'
import { db } from '@/lib/db'

const app = new Hono()

// 获取所有攻略（公开）
app.get('/public/list', async (c) => {
  try {
    const guides = await db.guides.findMany({
      where: {
        del: 0,
        show: 1,
      },
      include: {
        components: true,
      },
      orderBy: [
        { sort: 'asc' },
        { createdAt: 'desc' },
      ],
    })
    return c.json({ data: guides })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch guides' }, 500)
  }
})

// 获取单个攻略（公开）
app.get('/public/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const guide = await db.guides.findUnique({
      where: {
        id,
        del: 0,
        show: 1,
      },
      include: {
        components: true,
        albums: {
          include: {
            album: true,
          },
        },
        modules: {
          include: {
            contents: true,
          },
        },
      },
    })
    if (!guide) {
      return c.json({ error: 'Guide not found' }, 404)
    }
    
    // 处理 modules，添加 moduleData
    const guideWithModuleData = {
      ...guide,
      modules: guide.modules?.map(module => {
        const moduleDataContent = module.contents?.find(content => content.type === 'module_data')
        return {
          ...module,
          moduleData: moduleDataContent?.content
        }
      })
    }
    
    return c.json({ data: guideWithModuleData })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch guide' }, 500)
  }
})

// 获取所有攻略（管理）
app.get('/list', jwtAuth, async (c) => {
  try {
    const guides = await db.guides.findMany({
      where: {
        del: 0,
      },
      include: {
        components: true,
        albums: true,
      },
      orderBy: [
        { sort: 'asc' },
        { createdAt: 'desc' },
      ],
    })
    return c.json({ data: guides })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch guides' }, 500)
  }
})

// 获取单个攻略详情（管理）
app.get('/:id', jwtAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const guide = await db.guides.findUnique({
      where: { id },
      include: {
        components: {
          orderBy: { sort: 'asc' },
        },
        albums: {
          include: {
            album: true,
          },
        },
      },
    })
    if (!guide) {
      return c.json({ error: 'Guide not found' }, 404)
    }
    return c.json({ data: guide })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch guide' }, 500)
  }
})

// 创建攻略
app.post('/', jwtAuth, async (c) => {
  try {
    const body = await c.req.json()
    const guide = await db.guides.create({
      data: {
        title: body.title,
        country: body.country,
        city: body.city,
        days: body.days,
        start_date: body.start_date ? new Date(body.start_date) : null,
        end_date: body.end_date ? new Date(body.end_date) : null,
        cover_image: body.cover_image,
        content: body.content,
        show: body.show ?? 1,
        sort: body.sort ?? 0,
      },
    })
    return c.json({ data: guide })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to create guide' }, 500)
  }
})

// 删除攻略
app.delete('/:id', jwtAuth, async (c) => {
  try {
    const id = c.req.param('id')
    await db.guides.update({
      where: { id },
      data: {
        del: 1,
      },
    })
    return c.json({ message: 'Guide deleted successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to delete guide' }, 500)
  }
})

// 添加组件
app.post('/:id/components', jwtAuth, async (c) => {
  try {
    const guideId = c.req.param('id')
    const body = await c.req.json()
    const component = await db.guideComponents.create({
      data: {
        guide_id: guideId,
        type: body.type,
        content: body.content,
        sort: body.sort ?? 0,
      },
    })
    return c.json({ data: component })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to add component' }, 500)
  }
})

// 更新组件
app.put('/:guideId/components/:componentId', jwtAuth, async (c) => {
  try {
    const componentId = c.req.param('componentId')
    const body = await c.req.json()
    const component = await db.guideComponents.update({
      where: { id: componentId },
      data: {
        type: body.type,
        content: body.content,
        sort: body.sort,
      },
    })
    return c.json({ data: component })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to update component' }, 500)
  }
})

// 删除组件
app.delete('/:guideId/components/:componentId', jwtAuth, async (c) => {
  try {
    const componentId = c.req.param('componentId')
    await db.guideComponents.delete({
      where: { id: componentId },
    })
    return c.json({ message: 'Component deleted successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to delete component' }, 500)
  }
})

// 关联相册
app.post('/:id/albums', jwtAuth, async (c) => {
  try {
    const guideId = c.req.param('id')
    const body = await c.req.json()
    const relation = await db.guideAlbumsRelation.create({
      data: {
        guide_id: guideId,
        album_id: body.album_id,
      },
    })
    return c.json({ data: relation })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to associate album' }, 500)
  }
})

// 批量更新关联相册
app.put('/:id/albums', jwtAuth, async (c) => {
  try {
    const guideId = c.req.param('id')
    const body = await c.req.json()
    const albumIds: string[] = body.album_ids || []
    
    // 删除现有关联
    await db.guideAlbumsRelation.deleteMany({
      where: { guide_id: guideId },
    })
    
    // 创建新关联
    if (albumIds.length > 0) {
      await db.guideAlbumsRelation.createMany({
        data: albumIds.map(album_id => ({
          guide_id: guideId,
          album_id,
        })),
      })
    }
    
    return c.json({ message: 'Albums updated successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to update albums' }, 500)
  }
})

// 取消关联相册
app.delete('/:id/albums/:albumId', jwtAuth, async (c) => {
  try {
    const guideId = c.req.param('id')
    const albumId = c.req.param('albumId')
    await db.guideAlbumsRelation.delete({
      where: {
        guide_id_album_id: {
          guide_id: guideId,
          album_id: albumId,
        },
      },
    })
    return c.json({ message: 'Album association removed successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to remove album association' }, 500)
  }
})

// 批量更新攻略排序（必须在 /:id 路由之前定义）
app.put('/batch-sort', jwtAuth, async (c) => {
  try {
    const body = await c.req.json()
    const { sorts }: { sorts: { id: string; sort: number }[] } = body

    if (!sorts || !Array.isArray(sorts)) {
      return c.json({ error: 'Invalid request body' }, 400)
    }

    // 先获取所有有效的攻略ID
    const validGuides = await db.guides.findMany({
      where: {
        id: { in: sorts.map(s => s.id) },
        del: 0,
      },
      select: { id: true },
    })

    const validIds = new Set(validGuides.map(g => g.id))

    // 过滤出有效的排序数据
    const validSorts = sorts.filter(s => validIds.has(s.id))

    if (validSorts.length === 0) {
      return c.json({ error: 'No valid guides to update' }, 400)
    }

    // 使用事务批量更新（只更新存在的记录）
    await db.$transaction(
      validSorts.map(item =>
        db.guides.update({
          where: { id: item.id },
          data: { sort: item.sort },
        })
      )
    )

    return c.json({ message: 'Sort updated successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to update sort' }, 500)
  }
})

// 重置攻略排序（必须在 /:id 路由之前定义）
app.post('/reset-sort', jwtAuth, async (c) => {
  try {
    const guides = await db.guides.findMany({
      where: { del: 0 },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })

    // 按创建时间重新分配排序值
    await db.$transaction(
      guides.map((guide, index) =>
        db.guides.update({
          where: { id: guide.id },
          data: { sort: index },
        })
      )
    )

    return c.json({ message: 'Sort reset successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to reset sort' }, 500)
  }
})

// 更新攻略（动态路由）
app.put('/:id', jwtAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const guide = await db.guides.update({
      where: { id },
      data: {
        title: body.title,
        country: body.country,
        city: body.city,
        days: body.days,
        start_date: body.start_date ? new Date(body.start_date) : null,
        end_date: body.end_date ? new Date(body.end_date) : null,
        cover_image: body.cover_image,
        content: body.content,
        show: body.show,
        sort: body.sort,
      },
    })
    return c.json({ data: guide })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to update guide' }, 500)
  }
})

export default app