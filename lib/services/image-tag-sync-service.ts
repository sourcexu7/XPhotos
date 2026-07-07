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
import type { Prisma } from '@prisma/client'

/**
 * 同步单个图片的标签关联（确保二级标签对应的一级标签也被关联）
 * @param tx 数据库事务客户端
 * @param imageId 图片ID
 * @returns 同步结果
 */
export async function syncImageTagsForImage(
  tx: Prisma.TransactionClient,
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
 * 检查并创建 images.labels 中存在但 tags 表中不存在的标签
 * @param tx 数据库事务客户端
 * @param imageId 图片ID
 * @returns 创建的标签列表
 */
async function ensureLabelsExistInTags(
  tx: Prisma.TransactionClient,
  imageId: string
): Promise<{ createdTags: string[]; createdRelations: number }> {
  const image = await tx.images.findUnique({
    where: { id: imageId },
    select: { labels: true }
  })

  if (!image || !image.labels || !Array.isArray(image.labels)) {
    return { createdTags: [], createdRelations: 0 }
  }

  const labelNames = image.labels
    .filter((l): l is string => typeof l === 'string' && l !== null && l.trim() !== '')
    .map(l => l.trim())

  if (labelNames.length === 0) {
    return { createdTags: [], createdRelations: 0 }
  }

  const existingTags = await tx.tags.findMany({
    where: { name: { in: labelNames } },
    select: { name: true, id: true }
  })

  const existingTagMap = new Map(existingTags.map(t => [t.name.toLowerCase(), t]))
  const tagsToCreate: string[] = []

  for (const name of labelNames) {
    if (!existingTagMap.has(name.toLowerCase())) {
      tagsToCreate.push(name)
    }
  }

  if (tagsToCreate.length === 0) {
    return { createdTags: [], createdRelations: 0 }
  }

  await tx.tags.createMany({
    data: tagsToCreate.map(name => ({ name, category: '' })),
    skipDuplicates: true
  })

  const createdTags = await tx.tags.findMany({
    where: { name: { in: tagsToCreate } },
    select: { id: true, name: true }
  })

  const relations = createdTags.map(tag => ({
    imageId,
    tagId: tag.id
  }))

  await tx.imagesTagsRelation.createMany({
    data: relations,
    skipDuplicates: true
  })

  return { 
    createdTags: createdTags.map(t => t.name), 
    createdRelations: createdTags.length 
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
  newParentId: string | null,
  tx?: Prisma.TransactionClient
): Promise<BatchImageTagSyncResult> {
  const results: ImageTagSyncResult[] = []
  const errors: Array<{ imageId: string; error: string }> = []
  const useExternalTx = !!tx
  const dbClient = tx || db

  try {
    const imageRelations = await dbClient.imagesTagsRelation.findMany({
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

    if (useExternalTx) {
      for (const imageId of imageIds) {
        try {
          if (oldParentId !== null && newParentId === null) {
            if (oldParentId) {
              await dbClient.imagesTagsRelation.deleteMany({
                where: { imageId, tagId: oldParentId }
              })
            }
          }

          if (oldParentId !== null && newParentId !== null && oldParentId !== newParentId) {
            await dbClient.imagesTagsRelation.deleteMany({
              where: { imageId, tagId: oldParentId }
            })

            await dbClient.imagesTagsRelation.createMany({
              data: [{ imageId, tagId: newParentId }],
              skipDuplicates: true
            })
          }

          if (oldParentId === null && newParentId !== null) {
            await dbClient.imagesTagsRelation.createMany({
              data: [{ imageId, tagId: newParentId }],
              skipDuplicates: true
            })
          }

          const syncResult = await syncImageTagsForImage(dbClient, imageId)
          results.push(syncResult)
        } catch (error) {
          errors.push({
            imageId,
            error: error instanceof Error ? error.message : '未知错误'
          })
        }
      }
    } else {
      await db.$transaction(async (internalTx) => {
        for (const imageId of imageIds) {
          try {
            if (oldParentId !== null && newParentId === null) {
              if (oldParentId) {
                await internalTx.imagesTagsRelation.deleteMany({
                  where: { imageId, tagId: oldParentId }
                })
              }
            }

            if (oldParentId !== null && newParentId !== null && oldParentId !== newParentId) {
              await internalTx.imagesTagsRelation.deleteMany({
                where: { imageId, tagId: oldParentId }
              })

              await internalTx.imagesTagsRelation.createMany({
                data: [{ imageId, tagId: newParentId }],
                skipDuplicates: true
              })
            }

            if (oldParentId === null && newParentId !== null) {
              await internalTx.imagesTagsRelation.createMany({
                data: [{ imageId, tagId: newParentId }],
                skipDuplicates: true
              })
            }

            const syncResult = await syncImageTagsForImage(internalTx, imageId)
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
    }

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
 * @param options.ensureLabelsExist 是否检查并创建 images.labels 中存在但 tags 表中不存在的标签（默认 true）
 * @returns 补全检查结果
 */
export async function checkAndFixImageTagCompleteness(
  batchSize: number = 20,
  options: { ensureLabelsExist?: boolean } = {}
): Promise<TagCompletenessCheckResult & { createdTags?: string[]; totalCreatedTags?: number }> {
  const details: TagCompletenessCheckResult['details'] = []
  const errors: Array<{ imageId: string; error: string }> = []
  const createdTags: string[] = []

  try {
    const ensureLabels = options.ensureLabelsExist !== false

    // 获取所有有标签关联或有 labels 字段的图片（避免处理无标签图片）
    const imagesWithRelations = await db.imagesTagsRelation.findMany({
      select: { imageId: true }
    })
    const imageIdsWithRelations = new Set(imagesWithRelations.map(r => r.imageId))

    const imagesWithLabels = await db.images.findMany({
      where: { 
        del: 0,
        labels: { not: { equals: null } }
      },
      select: { id: true }
    })
    const imageIdsWithLabels = new Set(imagesWithLabels.map(img => img.id))

    const allImageIds = Array.from(new Set([...imageIdsWithRelations, ...imageIdsWithLabels]))
    const totalImages = allImageIds.length

    let fixedImages = 0
    let invalidRelations = 0
    let totalCreatedTags = 0

    // 分批处理
    let offset = 0
    while (offset < totalImages) {
      const imageIds = allImageIds.slice(offset, offset + batchSize)

      for (const imageId of imageIds) {
        try {
          await db.$transaction(async (tx) => {
            let hasChanges = false
            const tagsToAdd = new Set<string>()
            const tagsToRemove = new Set<string>()
            const newlyCreatedTags: string[] = []

            if (ensureLabels) {
              const result = await ensureLabelsExistInTags(tx, imageId)
              if (result.createdTags.length > 0) {
                newlyCreatedTags.push(...result.createdTags)
                createdTags.push(...result.createdTags)
                totalCreatedTags += result.createdTags.length
                hasChanges = true
              }
            }

            const relations = await tx.imagesTagsRelation.findMany({
              where: { imageId },
              include: { tag: { include: { parent: true } } }
            })

            const currentTagIds = new Set(relations.map(r => r.tagId))

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

            for (const relation of relations) {
              const tag = relation.tag

              if (tag.parentId) {
                const parentExists = parentTagsMap.has(tag.parentId)

                if (parentExists && !currentTagIds.has(tag.parentId)) {
                  tagsToAdd.add(tag.parentId)
                } else if (!parentExists) {
                  tagsToRemove.add(relation.tagId)
                  invalidRelations++
                }
              }
            }

            if (tagsToAdd.size > 0) {
              await tx.imagesTagsRelation.createMany({
                data: Array.from(tagsToAdd).map(tagId => ({
                  imageId,
                  tagId
                })),
                skipDuplicates: true
              })
              hasChanges = true
            }

            if (tagsToRemove.size > 0) {
              await tx.imagesTagsRelation.deleteMany({
                where: {
                  imageId,
                  tagId: { in: Array.from(tagsToRemove) }
                }
              })
              hasChanges = true
            }

            const updatedRelations = await tx.imagesTagsRelation.findMany({
              where: { imageId },
              include: { tag: true }
            })

            const allTagNames = updatedRelations.map(r => r.tag.name)

            await tx.images.update({
              where: { id: imageId },
              data: {
                labels: allTagNames
              }
            })

            if (hasChanges) {
              fixedImages++
              details.push({
                imageId,
                action: 'added',
                tags: {
                  added: [...newlyCreatedTags, ...Array.from(tagsToAdd)],
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
            maxWait: 10000,
            timeout: 30000
          })
        } catch (error) {
          errors.push({
            imageId,
            error: error instanceof Error ? error.message : '未知错误'
          })
        }
      }

      offset += batchSize
      
      if (offset < totalImages) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return {
      totalImages,
      fixedImages,
      invalidRelations,
      details,
      errors,
      createdTags: [...new Set(createdTags)],
      totalCreatedTags
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
      }],
      createdTags: [],
      totalCreatedTags: 0
    }
  }
}

