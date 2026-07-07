//标签表

'use server'

import { db } from '~/lib/db'
import type { PrismaClient, Tags } from '@prisma/client'

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
 * 支持标签移动和重命名，并自动同步图片标签关联和images.labels字段
 */
export async function updateTag(id: string, payload: { name?: string; category?: string; parentName?: string; parentId?: string | null; detail?: string }) {
  return await db.$transaction(async (tx) => {
    const currentTag = await tx.tags.findUnique({
      where: { id },
      select: { parentId: true, name: true }
    })
    
    if (!currentTag) throw new Error('tagNotFound')
    
    const oldParentId = currentTag.parentId
    const oldName = currentTag.name
    let shouldSyncImages = false
    let nameChanged = false

    if (payload.name && payload.name !== oldName) {
      const existing = await tx.tags.findFirst({ where: { name: payload.name, id: { not: id } } })
      if (existing) throw new Error('tagNameExists')
      nameChanged = true
    }

    if ('parentId' in payload && payload.parentId !== undefined) {
      if (oldParentId !== payload.parentId) {
        shouldSyncImages = true
      }
    }

    const updateData: { name?: string; category?: string; parentId?: string | null; detail?: string } = {}
    
    if (payload.name !== undefined) updateData.name = payload.name
    if (payload.detail !== undefined) updateData.detail = payload.detail
    
    if ('parentId' in payload && payload.parentId !== undefined) {
      updateData.parentId = payload.parentId
      if (payload.parentId) {
        const parent = await tx.tags.findUnique({ where: { id: payload.parentId } })
        if (parent) {
          updateData.category = parent.name
        }
      } else {
        updateData.category = payload.name || oldName
      }
    } else if (payload.parentName) {
      const parent = await tx.tags.upsert({ where: { name: payload.parentName }, update: {}, create: { name: payload.parentName, category: '' } })
      updateData.parentId = parent.id
      updateData.category = payload.parentName
    } else if (payload.category !== undefined) {
      updateData.category = payload.category
    }
    
    const updatedTag = await tx.tags.update({
      where: { id },
      data: updateData
    })

    if (shouldSyncImages && 'parentId' in payload && payload.parentId !== undefined) {
      try {
        const { syncImageTagsAfterTagMove } = await import('~/lib/services/image-tag-sync-service')
        await syncImageTagsAfterTagMove(id, oldParentId, payload.parentId, tx)
      } catch (error) {
        console.error('同步图片标签关联失败:', error)
      }
    }

    if (nameChanged && oldName && payload.name) {
      await tx.tags.updateMany({
        where: { category: oldName },
        data: { category: payload.name }
      })
    }
    
    return updatedTag
  })
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
 * 批量删除标签（用于删除未分类下的所有标签）
 * @param ids 标签ID数组
 * @returns 删除结果
 */
export async function batchDeleteTags(ids: string[]): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    if (ids.length === 0) {
      return { success: true, deletedCount: 0 }
    }

    const result = await db.$transaction(async (tx) => {
      const deleteResult = await tx.tags.deleteMany({
        where: { id: { in: ids } }
      })
      return deleteResult.count
    })

    return { success: true, deletedCount: result }
  } catch (error) {
    console.error('批量删除标签失败:', error)
    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : '批量删除失败'
    }
  }
}

/**
 * 确保一组标签存在（upsert），返回 tags 对象数组
 * 优化：使用批量查询减少数据库往返，避免事务超时
 */
export async function upsertTagsByName(tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>, names: string[], categoryMap?: Record<string, string>) {
  if (names.length === 0) {
    return []
  }

  const results: Tags[] = []
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

/**
 * 标签重命名后同步更新所有关联数据
 * 包括：
 * 1. images.labels JSON 字段中的标签名称
 * 2. 子标签的 category 字段
 * @param tagId 标签ID
 * @param oldName 旧名称
 * @param newName 新名称
 * @returns 同步结果
 */
export async function updateTagNameSync(
  tagId: string,
  oldName: string,
  newName: string
): Promise<{ success: boolean; updatedImages: number; updatedTags: number; error?: string }> {
  try {
    const tag = await db.tags.findUnique({ where: { id: tagId } })
    if (!tag) {
      return { success: false, updatedImages: 0, updatedTags: 0, error: '标签不存在' }
    }

    if (oldName === newName) {
      return { success: true, updatedImages: 0, updatedTags: 0 }
    }

    const results = await db.$transaction(async (tx) => {
      let updatedImages = 0
      let updatedTags = 0

      const imageRelations = await tx.imagesTagsRelation.findMany({
        where: { tagId },
        select: { imageId: true }
      })

      if (imageRelations.length > 0) {
        const imageIds = imageRelations.map(r => r.imageId)
        
        const images = await tx.images.findMany({
          where: { id: { in: imageIds } },
          select: { id: true, labels: true }
        })

        for (const image of images) {
          if (image.labels && Array.isArray(image.labels)) {
            const newLabels = image.labels.map(l => 
              typeof l === 'string' && l.trim().toLowerCase() === oldName.trim().toLowerCase() 
                ? newName 
                : l
            )
            if (JSON.stringify(image.labels) !== JSON.stringify(newLabels)) {
              await tx.images.update({
                where: { id: image.id },
                data: { labels: newLabels }
              })
              updatedImages++
            }
          }
        }
      }

      const childTags = await tx.tags.findMany({
        where: { parentId: tagId }
      })

      for (const childTag of childTags) {
        if (childTag.category !== newName) {
          await tx.tags.update({
            where: { id: childTag.id },
            data: { category: newName }
          })
          updatedTags++
        }
      }

      return { updatedImages, updatedTags }
    })

    return { success: true, updatedImages: results.updatedImages, updatedTags: results.updatedTags }
  } catch (error) {
    console.error('标签重命名同步失败:', error)
    return { 
      success: false, 
      updatedImages: 0, 
      updatedTags: 0, 
      error: error instanceof Error ? error.message : '同步失败' 
    }
  }
}

/**
 * 清理孤立标签（没有任何图片关联且没有子标签的标签）
 * @returns 清理结果
 */
export async function cleanupOrphanTags(): Promise<{ success: boolean; cleanedCount: number; cleanedTags: string[]; skippedParentTags: string[]; error?: string }> {
  try {
    const results = await db.$transaction(async (tx) => {
      const allTags = await tx.tags.findMany({
        select: { id: true, name: true, parentId: true }
      })

      const childTagIds = new Set<string>()
      allTags.forEach(tag => {
        if (tag.parentId) {
          childTagIds.add(tag.parentId)
        }
      })

      const orphanTags: { id: string; name: string }[] = []
      const skippedParentTags: string[] = []

      for (const tag of allTags) {
        const hasChildren = childTagIds.has(tag.id)
        if (hasChildren) {
          skippedParentTags.push(tag.name)
          continue
        }

        const relationCount = await tx.imagesTagsRelation.count({
          where: { tagId: tag.id }
        })

        if (relationCount === 0) {
          orphanTags.push({ id: tag.id, name: tag.name })
        }
      }

      if (orphanTags.length === 0) {
        return { cleanedCount: 0, cleanedTags: [], skippedParentTags }
      }

      const idsToDelete = orphanTags.map(t => t.id)
      await tx.tags.deleteMany({
        where: { id: { in: idsToDelete } }
      })

      return { 
        cleanedCount: orphanTags.length, 
        cleanedTags: orphanTags.map(t => t.name),
        skippedParentTags
      }
    })

    return { success: true, cleanedCount: results.cleanedCount, cleanedTags: results.cleanedTags, skippedParentTags: results.skippedParentTags }
  } catch (error) {
    console.error('清理孤立标签失败:', error)
    return { 
      success: false, 
      cleanedCount: 0, 
      cleanedTags: [], 
      skippedParentTags: [],
      error: error instanceof Error ? error.message : '清理失败' 
    }
  }
}

/**
 * 获取孤立标签列表（不删除，仅查询）
 * @returns 孤立标签列表
 */
export async function getOrphanTags(): Promise<{ id: string; name: string; category: string | null; parentId: string | null; hasChildren: boolean }[]> {
  const allTags = await db.tags.findMany({
    select: { id: true, name: true, category: true, parentId: true }
  })

  const childTagIds = new Set<string>()
  allTags.forEach(tag => {
    if (tag.parentId) {
      childTagIds.add(tag.parentId)
    }
  })

  const orphanTags: { id: string; name: string; category: string | null; parentId: string | null; hasChildren: boolean }[] = []

  for (const tag of allTags) {
    const hasChildren = childTagIds.has(tag.id)
    const relationCount = await db.imagesTagsRelation.count({
      where: { tagId: tag.id }
    })

    if (relationCount === 0) {
      orphanTags.push({ ...tag, hasChildren })
    }
  }

  return orphanTags
}
