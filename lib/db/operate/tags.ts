//标签表

'use server'

import { db } from '~/lib/db'
import type { Config } from '~/types'
import type { PrismaClient, Tag } from '@prisma/client'

/**
 * 获取全部标签
 */
export async function fetchAllTags() {
  return await db.tags.findMany({
    orderBy: { createdAt: 'asc' }
  })
}

/**
 * 创建标签
 */
export async function createTag(payload: { name: string; category?: string; parentName?: string; detail?: string }) {
  // If parentId provided, use it. If parentName provided, ensure parent exists and set parentId.
  let parentId: string | undefined = undefined
  if ((payload as any).parentId) {
    parentId = (payload as any).parentId
  } else if (payload.parentName) {
    // ensure parent exists; when creating parent here, set its category to the parentName
    const parent = await db.tags.upsert({ where: { name: payload.parentName }, update: {}, create: { name: payload.parentName, category: payload.parentName } })
    parentId = parent.id
  }
  // If no explicit category provided, default category to parentName (for children) or the tag's own name (for top-level).
  const category = payload.parentName ?? payload.category ?? payload.name ?? ''
  return await db.tags.create({
    data: {
      name: payload.name,
      category: category,
      detail: payload.detail || '',
      parentId: parentId ?? null,
    }
  })
}

/**
 * 更新标签
 * 支持标签移动，并自动同步图片标签关联
 */
export async function updateTag(id: string, payload: { name?: string; category?: string; parentName?: string; parentId?: string | null; detail?: string }) {
  // 如果涉及标签移动（parentId变化），需要先获取原父标签ID
  let oldParentId: string | null = null
  let shouldSyncImages = false

  if ('parentId' in payload && payload.parentId !== undefined) {
    const currentTag = await db.tags.findUnique({
      where: { id },
      select: { parentId: true }
    })
    
    if (currentTag) {
      oldParentId = currentTag.parentId
      // 如果父标签ID发生变化，需要同步图片标签
      if (oldParentId !== payload.parentId) {
        shouldSyncImages = true
      }
    }
  }

  const updateData: { name?: string; category?: string; parentId?: string | null; detail?: string } = {}
  
  // 复制其他字段
  if (payload.name !== undefined) updateData.name = payload.name
  if (payload.detail !== undefined) updateData.detail = payload.detail
  
  // 优先使用 parentId（直接指定父标签 ID）
  if ('parentId' in payload && payload.parentId !== undefined) {
    updateData.parentId = payload.parentId
    // 如果指定了 parentId，需要更新 category 为父标签的 name
    if (payload.parentId) {
      const parent = await db.tags.findUnique({ where: { id: payload.parentId } })
      if (parent) {
        updateData.category = parent.name
      }
    } else {
      // parentId 为 null，表示移动到顶级，category 设为标签自己的 name
      const tag = await db.tags.findUnique({ where: { id } })
      if (tag) {
        updateData.category = tag.name
      }
    }
  } else if (payload.parentName) {
    // 向后兼容：使用 parentName 解析 parentId
    const parent = await db.tags.upsert({ where: { name: payload.parentName }, update: {}, create: { name: payload.parentName, category: '' } })
    updateData.parentId = parent.id
    updateData.category = payload.parentName
  } else if (payload.category !== undefined) {
    // 如果只更新 category（不改变 parentId）
    updateData.category = payload.category
  }
  
  const updatedTag = await db.tags.update({
    where: { id },
    data: updateData
  })

  // 如果标签移动了，同步图片标签关联
  if (shouldSyncImages && 'parentId' in payload && payload.parentId !== undefined) {
    try {
      const { syncImageTagsAfterTagMove } = await import('~/lib/services/image-tag-sync-service')
      await syncImageTagsAfterTagMove(id, oldParentId, payload.parentId)
    } catch (error) {
      console.error('同步图片标签关联失败:', error)
      // 不抛出错误，因为标签移动已经成功，图片标签同步失败可以后续修复
    }
  }
  
  return updatedTag
}

/**
 * 删除标签
 */
export async function deleteTag(id: string) {
  return await db.tags.delete({
    where: { id }
  })
}

/**
 * 原子性：删除父标签及其所有子标签（数据库事务）
 */
export async function deleteTagAndChildren(id: string) {
  return await db.$transaction(async (tx) => {
    // 删除所有以 parentId 指向该 id 的子标签
    await tx.tags.deleteMany({ where: { parentId: id } })
    // 删除父标签本身
    return await tx.tags.delete({ where: { id } })
  })
}

/**
 * 确保一组标签存在（upsert），返回 tags 对象数组
 * 优化：使用批量查询减少数据库往返，避免事务超时
 */
export async function upsertTagsByName(tx: PrismaClient, names: string[], categoryMap?: Record<string, string>) {
  if (names.length === 0) {
    return []
  }

  const results: Tag[] = []
  const parentIdMap: Record<string, string> = {}
  
  // 批量查询已存在的标签
  const existingTags = await tx.tags.findMany({
    where: { name: { in: names } }
  })
  const existingTagMap = new Map(existingTags.map(tag => [tag.name, tag]))
  
  // 处理父标签（如果有分类映射）
  if (categoryMap) {
    const parentNames = Array.from(new Set(Object.values(categoryMap).filter(Boolean)))
    if (parentNames.length > 0) {
      // 批量查询已存在的父标签
      const existingParents = await tx.tags.findMany({
        where: { name: { in: parentNames } }
      })
      const existingParentMap = new Map(existingParents.map(tag => [tag.name, tag]))
      
      // 只创建不存在的父标签
      const parentsToCreate = parentNames.filter(pn => !existingParentMap.has(pn))
      if (parentsToCreate.length > 0) {
        // 批量创建父标签
        await tx.tags.createMany({
          data: parentsToCreate.map(pn => ({ name: pn, category: '' })),
          skipDuplicates: true
        })
        // 重新查询获取创建的父标签 ID
        const createdParents = await tx.tags.findMany({
          where: { name: { in: parentsToCreate } }
        })
        createdParents.forEach(p => {
          parentIdMap[p.name] = p.id
          existingParentMap.set(p.name, p)
        })
      }
      
      // 填充已存在的父标签 ID
      existingParents.forEach(p => {
        parentIdMap[p.name] = p.id
      })
    }
  }
  
  // 处理标签：更新已存在的，创建不存在的
  const tagsToCreate: Array<{ name: string; category?: string; parentId?: string }> = []
  const tagsToUpdate: Array<{ name: string; category?: string; parentId?: string }> = []
  
  for (const name of names) {
    const existingTag = existingTagMap.get(name)
    const createData: any = { name }
    if (categoryMap && categoryMap[name]) {
      createData.category = categoryMap[name]
      if (parentIdMap[categoryMap[name]]) {
        createData.parentId = parentIdMap[categoryMap[name]]
      }
    }
    
    if (existingTag) {
      // 如果标签已存在但需要更新分类或父标签
      if (categoryMap && categoryMap[name] && (
        existingTag.category !== categoryMap[name] ||
        existingTag.parentId !== parentIdMap[categoryMap[name]]
      )) {
        tagsToUpdate.push(createData)
      } else {
        results.push(existingTag)
      }
    } else {
      tagsToCreate.push(createData)
    }
  }
  
  // 批量创建新标签
  if (tagsToCreate.length > 0) {
    await tx.tags.createMany({
      data: tagsToCreate,
      skipDuplicates: true
    })
    // 重新查询获取创建的标签
    const createdTags = await tx.tags.findMany({
      where: { name: { in: tagsToCreate.map(t => t.name) } }
    })
    results.push(...createdTags)
  }
  
  // 批量更新需要更新的标签
  if (tagsToUpdate.length > 0) {
    for (const updateData of tagsToUpdate) {
      const updated = await tx.tags.update({
        where: { name: updateData.name },
        data: {
          category: updateData.category,
          parentId: updateData.parentId,
        }
      })
      results.push(updated)
    }
  }
  
  // 确保返回顺序与输入顺序一致
  const resultMap = new Map(results.map(tag => [tag.name, tag]))
  return names.map(name => resultMap.get(name)!).filter(Boolean)
}

export async function findTagsByCategory(category: string) {
  return await db.tags.findMany({ where: { category }, orderBy: { name: 'asc' } })
}
