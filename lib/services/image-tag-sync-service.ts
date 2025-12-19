/**
 * 图片标签同步服务
 * 负责处理图片与标签的自动关联逻辑，包括：
 * 1. 绑定二级标签时自动添加一级标签
 * 2. 标签移动时自动调整图片标签关联
 * 3. 历史图片标签补全检查
 */

'use server'

import { db } from '~/lib/db'
import type {
  ImageTagSyncResult,
  BatchImageTagSyncResult,
  TagCompletenessCheckResult
} from '~/types/tags'
import type { PrismaClient } from '@prisma/client'

/**
 * 获取标签的父标签（一级标签）
 * @param tx 数据库事务客户端
 * @param tagId 标签ID
 * @returns 父标签，如果不存在则返回null
 */
async function getParentTag(
  tx: PrismaClient,
  tagId: string
): Promise<{ id: string; name: string } | null> {
  const tag = await tx.tags.findUnique({
    where: { id: tagId },
    include: { parent: true }
  })

  if (!tag || !tag.parentId) {
    return null
  }

  return {
    id: tag.parent.id,
    name: tag.parent.name
  }
}

/**
 * 获取标签的所有父标签（递归向上查找，直到一级标签）
 * @param tx 数据库事务客户端
 * @param tagId 标签ID
 * @returns 父标签数组，从直接父标签到一级标签
 */
async function getAllParentTags(
  tx: PrismaClient,
  tagId: string
): Promise<Array<{ id: string; name: string }>> {
  const parents: Array<{ id: string; name: string }> = []
  let currentTagId: string | null = tagId

  while (currentTagId) {
    const tag = await tx.tags.findUnique({
      where: { id: currentTagId },
      include: { parent: true }
    })

    if (!tag || !tag.parentId) {
      break
    }

    parents.push({
      id: tag.parent.id,
      name: tag.parent.name
    })

    currentTagId = tag.parentId
  }

  return parents
}

/**
 * 同步单个图片的标签关联（确保二级标签对应的一级标签也被关联）
 * @param tx 数据库事务客户端
 * @param imageId 图片ID
 * @returns 同步结果
 */
export async function syncImageTagsForImage(
  tx: PrismaClient,
  imageId: string
): Promise<ImageTagSyncResult> {
  // 获取图片当前关联的所有标签
  const relations = await tx.imagesTagsRelation.findMany({
    where: { imageId },
    include: { tag: { include: { parent: true } } }
  })

  const currentTagIds = new Set(relations.map(r => r.tagId))
  const tagsToAdd = new Set<string>()
  const tagsToRemove = new Set<string>()

  // 遍历所有关联的标签，检查是否需要添加父标签
  for (const relation of relations) {
    const tag = relation.tag

    // 如果标签有父标签（是二级标签），确保父标签也被关联
    if (tag.parentId && !currentTagIds.has(tag.parentId)) {
      tagsToAdd.add(tag.parentId)
    }
  }

  // 添加缺失的父标签关联
  if (tagsToAdd.size > 0) {
    await tx.imagesTagsRelation.createMany({
      data: Array.from(tagsToAdd).map(tagId => ({
        imageId,
        tagId
      })),
      skipDuplicates: true
    })
  }

  // 检查并移除无效的关联（关联的标签已不存在或其父标签关系已改变）
  for (const relation of relations) {
    const tag = relation.tag

    // 如果标签是二级标签，检查其父标签是否仍然有效
    if (tag.parentId) {
      const parent = await tx.tags.findUnique({
        where: { id: tag.parentId }
      })

      // 如果父标签不存在，移除该关联
      if (!parent) {
        tagsToRemove.add(relation.tagId)
      }
    }
  }

  // 移除无效关联
  if (tagsToRemove.size > 0) {
    await tx.imagesTagsRelation.deleteMany({
      where: {
        imageId,
        tagId: { in: Array.from(tagsToRemove) }
      }
    })
  }

  // 重新查询更新后的关联
  const updatedRelations = await tx.imagesTagsRelation.findMany({
    where: { imageId },
    include: { tag: true }
  })

  // 获取添加和移除的标签名称
  const addedTagIds = Array.from(tagsToAdd)
  const removedTagIds = Array.from(tagsToRemove)
  
  const addedTags = addedTagIds.length > 0
    ? (await tx.tags.findMany({ where: { id: { in: addedTagIds } } })).map(t => t.name)
    : []
  
  const removedTags = removedTagIds.length > 0
    ? (await tx.tags.findMany({ where: { id: { in: removedTagIds } } })).map(t => t.name)
    : []
  
  const keptTags = updatedRelations
    .map(r => r.tag.name)
    .filter(name => !addedTags.includes(name) && !removedTags.includes(name))

  // 同步更新 images.labels 字段（JSON字段），确保前端显示正确
  if (tagsToAdd.size > 0 || tagsToRemove.size > 0) {
    // 获取所有标签名称（包括一级和二级标签）
    const allTagNames = updatedRelations.map(r => r.tag.name)

    // 更新 images.labels 字段
    await tx.images.update({
      where: { id: imageId },
      data: {
        labels: allTagNames
      }
    })
  }

  return {
    imageId,
    addedTags,
    removedTags,
    keptTags
  }
}

/**
 * 批量调整图片标签关联（标签移动后调用）
 * @param tagId 移动的标签ID
 * @param oldParentId 原父标签ID（null表示原为一级标签）
 * @param newParentId 新父标签ID（null表示升级为一级标签）
 * @returns 批量调整结果
 */
export async function syncImageTagsAfterTagMove(
  tagId: string,
  oldParentId: string | null,
  newParentId: string | null
): Promise<BatchImageTagSyncResult> {
  const results: ImageTagSyncResult[] = []
  const errors: Array<{ imageId: string; error: string }> = []

  try {
    // 查找所有绑定了该标签的图片
    const imageRelations = await db.imagesTagsRelation.findMany({
      where: { tagId },
      include: { image: true }
    })

    const imageIds = imageRelations.map(r => r.imageId)

    if (imageIds.length === 0) {
      return {
        totalImages: 0,
        successCount: 0,
        failedCount: 0,
        results: [],
        errors: []
      }
    }

    // 使用事务批量处理
    await db.$transaction(async (tx) => {
      for (const imageId of imageIds) {
        try {
          // 场景1：二级标签升级为一级标签
          if (oldParentId !== null && newParentId === null) {
            // 移除原一级标签关联
            if (oldParentId) {
              await tx.imagesTagsRelation.deleteMany({
                where: {
                  imageId,
                  tagId: oldParentId
                }
              })
            }
            // 标签本身已升级，无需额外操作
          }

          // 场景2：二级标签迁移到其他一级标签
          if (oldParentId !== null && newParentId !== null && oldParentId !== newParentId) {
            // 移除旧的一级标签关联
            await tx.imagesTagsRelation.deleteMany({
              where: {
                imageId,
                tagId: oldParentId
              }
            })

            // 添加新的一级标签关联
            await tx.imagesTagsRelation.createMany({
              data: [{
                imageId,
                tagId: newParentId
              }],
              skipDuplicates: true
            })
          }

          // 场景3：一级标签降级为二级标签（理论上不应该发生，但处理一下）
          if (oldParentId === null && newParentId !== null) {
            // 添加新的一级标签关联
            await tx.imagesTagsRelation.createMany({
              data: [{
                imageId,
                tagId: newParentId
              }],
              skipDuplicates: true
            })
          }

          // 同步该图片的所有标签关联（会自动更新 images.labels 字段）
          const syncResult = await syncImageTagsForImage(tx, imageId)
          results.push(syncResult)
        } catch (error) {
          errors.push({
            imageId,
            error: error instanceof Error ? error.message : '未知错误'
          })
        }
      }
    }, {
      maxWait: 30000,
      timeout: 60000
    })

    return {
      totalImages: imageIds.length,
      successCount: results.length,
      failedCount: errors.length,
      results,
      errors
    }
  } catch (error) {
    console.error('批量调整图片标签关联失败:', error)
    return {
      totalImages: 0,
      successCount: 0,
      failedCount: 0,
      results: [],
      errors: [{
        imageId: 'batch',
        error: error instanceof Error ? error.message : '批量操作失败'
      }]
    }
  }
}

/**
 * 检查并补全历史图片的标签关联
 * @param batchSize 每批处理的图片数量，默认20（减少以避免事务超时）
 * @returns 补全检查结果
 */
export async function checkAndFixImageTagCompleteness(
  batchSize: number = 20
): Promise<TagCompletenessCheckResult> {
  const details: TagCompletenessCheckResult['details'] = []
  const errors: Array<{ imageId: string; error: string }> = []

  try {
    // 获取所有已绑定标签的图片总数
    const totalCount = await db.imagesTagsRelation.groupBy({
      by: ['imageId'],
      _count: true
    })

    const totalImages = totalCount.length
    let fixedImages = 0
    let invalidRelations = 0

    // 分批处理
    let offset = 0
    while (offset < totalImages) {
      // 获取当前批次的图片ID
      const batch = await db.imagesTagsRelation.findMany({
        select: { imageId: true },
        distinct: ['imageId'],
        skip: offset,
        take: batchSize
      })

      const imageIds = batch.map(b => b.imageId)

      // 优化：每张图片使用独立的事务，避免大事务超时
      for (const imageId of imageIds) {
        try {
          // 使用独立事务处理每张图片
          await db.$transaction(async (tx) => {
            // 获取图片当前关联的所有标签
            const relations = await tx.imagesTagsRelation.findMany({
              where: { imageId },
              include: { tag: { include: { parent: true } } }
            })

            const currentTagIds = new Set(relations.map(r => r.tagId))
            const tagsToAdd = new Set<string>()
            const tagsToRemove = new Set<string>()

            // 批量查询所有父标签，减少数据库查询次数
            const parentTagIds = relations
              .map(r => r.tag.parentId)
              .filter((id): id is string => id !== null)
            
            const parentTagsMap = new Map<string, boolean>()
            if (parentTagIds.length > 0) {
              const uniqueParentIds = Array.from(new Set(parentTagIds))
              const parentTags = await tx.tags.findMany({
                where: { id: { in: uniqueParentIds } },
                select: { id: true }
              })
              parentTags.forEach(tag => parentTagsMap.set(tag.id, true))
            }

            // 检查每个标签，确保其父标签也被关联
            for (const relation of relations) {
              const tag = relation.tag

              // 如果标签有父标签（是二级标签），检查父标签是否已关联
              if (tag.parentId) {
                const parentExists = parentTagsMap.has(tag.parentId)

                if (parentExists && !currentTagIds.has(tag.parentId)) {
                  tagsToAdd.add(tag.parentId)
                } else if (!parentExists) {
                  // 父标签不存在，标记为无效关联
                  tagsToRemove.add(relation.tagId)
                  invalidRelations++
                }
              }
            }

            // 执行添加和移除操作
            if (tagsToAdd.size > 0) {
              await tx.imagesTagsRelation.createMany({
                data: Array.from(tagsToAdd).map(tagId => ({
                  imageId,
                  tagId
                })),
                skipDuplicates: true
              })
            }

            if (tagsToRemove.size > 0) {
              await tx.imagesTagsRelation.deleteMany({
                where: {
                  imageId,
                  tagId: { in: Array.from(tagsToRemove) }
                }
              })
            }

            // 同步更新 images.labels 字段（JSON字段），确保前端显示正确
            // 无论是否有添加/移除操作，都重新同步 labels 字段，确保数据一致性
            const updatedRelations = await tx.imagesTagsRelation.findMany({
              where: { imageId },
              include: { tag: true }
            })

            // 获取所有标签名称（包括一级和二级标签）
            const allTagNames = updatedRelations.map(r => r.tag.name)

            // 更新 images.labels 字段
            await tx.images.update({
              where: { id: imageId },
              data: {
                labels: allTagNames
              }
            })

            // 记录操作结果
            if (tagsToAdd.size > 0 || tagsToRemove.size > 0) {
              fixedImages++
              details.push({
                imageId,
                action: 'added',
                tags: {
                  added: Array.from(tagsToAdd),
                  removed: Array.from(tagsToRemove)
                }
              })
            } else {
              details.push({
                imageId,
                action: 'no_change',
                tags: {
                  added: [],
                  removed: []
                }
              })
            }
          }, {
            maxWait: 10000, // 10秒等待锁
            timeout: 30000   // 30秒超时（单张图片处理）
          })
        } catch (error) {
          errors.push({
            imageId,
            error: error instanceof Error ? error.message : '未知错误'
          })
        }
      }

      offset += batchSize
      
      // 添加短暂延迟，避免数据库压力过大
      if (offset < totalImages) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return {
      totalImages,
      fixedImages,
      invalidRelations,
      details,
      errors
    }
  } catch (error) {
    console.error('历史图片标签补全检查失败:', error)
    return {
      totalImages: 0,
      fixedImages: 0,
      invalidRelations: 0,
      details: [],
      errors: [{
        imageId: 'batch',
        error: error instanceof Error ? error.message : '批量检查失败'
      }]
    }
  }
}

