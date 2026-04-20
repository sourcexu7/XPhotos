import { Hono } from 'hono'
import { jwtAuth } from './middleware/auth'
import { db } from '@/lib/db'

const app = new Hono()

// ========== 模块管理 ==========

// 获取攻略的所有模块
app.get('/module/:guideId', jwtAuth, async (c) => {
  try {
    const guideId = c.req.param('guideId')
    const modules = await db.guideModules.findMany({
      where: { guide_id: guideId },
      include: {
        contents: {
          orderBy: { sort: 'asc' },
        },
      },
      orderBy: { sort: 'asc' },
    })

    const specialTemplates = ['itinerary', 'expense', 'checklist', 'transport', 'photo', 'tips']
    const specialModuleIds = modules
      .filter(mod => specialTemplates.includes(mod.template || ''))
      .map(mod => mod.id)

    let moduleDataMap: Record<string, any> = {}
    if (specialModuleIds.length > 0) {
      const allModuleData = await db.guideModuleContents.findMany({
        where: {
          module_id: { in: specialModuleIds },
          type: 'module_data',
        },
      })

      moduleDataMap = allModuleData.reduce((acc, data) => {
        acc[data.module_id] = data.content || []
        return acc
      }, {} as Record<string, any>)
    }

    const modulesWithData = modules.map(mod => ({
      ...mod,
      moduleData: specialTemplates.includes(mod.template || '') ? (moduleDataMap[mod.id] || []) : undefined,
    }))

    return c.json({ data: modulesWithData })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch modules' }, 500)
  }
})

// 创建模块
app.post('/module', jwtAuth, async (c) => {
  try {
    const body = await c.req.json()
    const { guide_id, name, template, is_hidden } = body
    
    // 获取当前最大sort值
    const maxSort = await db.guideModules.aggregate({
      where: { guide_id: guide_id },
      _max: { sort: true },
    })
    
    const module = await db.guideModules.create({
      data: {
        guide_id: guide_id,
        name: name,
        template: template || null,
        sort: (maxSort._max.sort || 0) + 1,
        is_hidden: is_hidden || false,
      },
    })
    
    return c.json({ data: module })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to create module' }, 500 )
  }
})

// 调整模块顺序（必须在 /module/:id 路由之前定义）
app.put('/module/sort', jwtAuth, async (c) => {
  try {
    const body = await c.req.json()
    const { module_ids } = body
    
    // 批量更新
    const updates = module_ids.map((id: string, index: number) =>
      db.guideModules.update({
        where: { id: id },
        data: { sort: index },
      })
    )
    
    await Promise.all(updates)
    
    return c.json({ message: 'Modules sorted successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to sort modules' }, 500)
  }
})

// 更新模块（动态路由）
app.put('/module/:id', jwtAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    const module = await db.guideModules.update({
      where: { id: id },
      data: {
        name: body.name,
        template: body.template,
        is_hidden: body.is_hidden,
      },
    })
    
    return c.json({ data: module })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to update module' }, 500)
  }
})

// 删除模块
app.delete('/module/:id', jwtAuth, async (c) => {
  try {
    const id = c.req.param('id')
    
    await db.guideModules.delete({
      where: { id: id },
    })
    
    return c.json({ message: 'Module deleted successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to delete module' }, 500)
  }
})

// ========== 内容管理 ==========

// 获取模块内容列表
app.get('/content/:moduleId', jwtAuth, async (c) => {
  try {
    const moduleId = c.req.param('moduleId')
    const contents = await db.guideModuleContents.findMany({
      where: { module_id: moduleId },
      orderBy: { sort: 'asc' },
    })
    return c.json({ data: contents })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch contents' }, 500)
  }
})

// 获取专用模块数据
app.get('/module-data/:moduleId', jwtAuth, async (c) => {
  try {
    const moduleId = c.req.param('moduleId')
    const content = await db.guideModuleContents.findFirst({
      where: { 
        module_id: moduleId,
        type: 'module_data',
      },
    })
    return c.json({ data: content?.content || null })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch module data' }, 500)
  }
})

// 保存专用模块数据
app.put('/module-data/:moduleId', jwtAuth, async (c) => {
  try {
    const moduleId = c.req.param('moduleId')
    const body = await c.req.json()
    const { data } = body
    
    const existing = await db.guideModuleContents.findFirst({
      where: { 
        module_id: moduleId,
        type: 'module_data',
      },
    })
    
    if (existing) {
      await db.guideModuleContents.update({
        where: { id: existing.id },
        data: { content: data },
      })
    } else {
      await db.guideModuleContents.create({
        data: {
          module_id: moduleId,
          type: 'module_data',
          content: data,
          sort: 0,
        },
      })
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to save module data' }, 500)
  }
})

// 添加模块内容
app.post('/content', jwtAuth, async (c) => {
  try {
    const body = await c.req.json()
    const { module_id, type, content } = body
    
    // 获取当前最大sort值
    const maxSort = await db.guideModuleContents.aggregate({
      where: { module_id: module_id },
      _max: { sort: true },
    })
    
    const newContent = await db.guideModuleContents.create({
      data: {
        module_id: module_id,
        type: type,
        content: content || {},
        sort: (maxSort._max.sort || 0) + 1,
      },
    })
    
    return c.json({ data: newContent })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to create content' }, 500)
  }
})

// 更新模块内容
app.put('/content/:id', jwtAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    const updatedContent = await db.guideModuleContents.update({
      where: { id: id },
      data: {
        type: body.type,
        content: body.content,
      },
    })
    
    return c.json({ data: updatedContent })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to update content' }, 500)
  }
})

// 删除模块内容
app.delete('/content/:id', jwtAuth, async (c) => {
  try {
    const id = c.req.param('id')
    
    await db.guideModuleContents.delete({
      where: { id: id },
    })
    
    return c.json({ message: 'Content deleted successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to delete content' }, 500)
  }
})

// 调整内容顺序
app.put('/content/sort', jwtAuth, async (c) => {
  try {
    const body = await c.req.json()
    const { content_ids } = body
    
    // 批量更新
    const updates = content_ids.map((id: string, index: number) =>
      db.guideModuleContents.update({
        where: { id: id },
        data: { sort: index },
      })
    )
    
    await Promise.all(updates)
    
    return c.json({ message: 'Contents sorted successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to sort contents' }, 500)
  }
})

// ========== 目录管理 ==========

// 获取攻略目录
app.get('/toc/:guideId', jwtAuth, async (c) => {
  try {
    const guideId = c.req.param('guideId')
    const toc = await db.guideTableOfContents.findMany({
      where: { guide_id: guideId },
      orderBy: { sort: 'asc' },
    })
    return c.json({ data: toc })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch TOC' }, 500)
  }
})

// 创建目录项
app.post('/toc', jwtAuth, async (c) => {
  try {
    const body = await c.req.json()
    const { guide_id, title, level, target_id, target_type, is_hidden } = body
    
    // 获取当前最大sort值
    const maxSort = await db.guideTableOfContents.aggregate({
      where: { guide_id: guide_id },
      _max: { sort: true },
    })
    
    const tocItem = await db.guideTableOfContents.create({
      data: {
        guide_id: guide_id,
        title: title,
        level: level || 1,
        target_id: target_id || null,
        target_type: target_type || null,
        sort: (maxSort._max.sort || 0) + 1,
        is_hidden: is_hidden || false,
      },
    })
    
    return c.json({ data: tocItem })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to create TOC item' }, 500)
  }
})

// 更新目录项
app.put('/toc/:id', jwtAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    const tocItem = await db.guideTableOfContents.update({
      where: { id: id },
      data: {
        title: body.title,
        level: body.level,
        target_id: body.target_id,
        target_type: body.target_type,
        is_hidden: body.is_hidden,
      },
    })
    
    return c.json({ data: tocItem })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to update TOC item' }, 500)
  }
})

// 删除目录项
app.delete('/toc/:id', jwtAuth, async (c) => {
  try {
    const id = c.req.param('id')
    
    await db.guideTableOfContents.delete({
      where: { id: id },
    })
    
    return c.json({ message: 'TOC item deleted successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to delete TOC item' }, 500)
  }
})

// 调整目录顺序
app.put('/toc/sort', jwtAuth, async (c) => {
  try {
    const body = await c.req.json()
    const { toc_ids } = body
    
    // 批量更新
    const updates = toc_ids.map((id: string, index: number) =>
      db.guideTableOfContents.update({
        where: { id: id },
        data: { sort: index },
      })
    )
    
    await Promise.all(updates)
    
    return c.json({ message: 'TOC sorted successfully' })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to sort TOC' }, 500)
  }
})

// 自动生成目录
app.post('/toc/auto-generate', jwtAuth, async (c) => {
  try {
    const body = await c.req.json()
    const { guide_id } = body
    
    // 获取所有模块
    const modules = await db.guideModules.findMany({
      where: { 
        guide_id: guide_id,
        is_hidden: false,
      },
      orderBy: { sort: 'asc' },
    })
    
    // 删除旧目录
    await db.guideTableOfContents.deleteMany({
      where: { guide_id: guide_id },
    })
    
    // 创建新目录
    const tocItems = await Promise.all(
      modules.map((module, index) =>
        db.guideTableOfContents.create({
          data: {
            guide_id: guide_id,
            title: module.name,
            level: 1,
            target_id: module.id,
            target_type: 'module',
            sort: index + 1,
            is_hidden: false,
          },
        })
      )
    )
    
    return c.json({ data: tocItems })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to auto-generate TOC' }, 500)
  }
})

export default app