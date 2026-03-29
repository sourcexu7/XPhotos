/**
 * 标签移动服务
 * 负责处理二级标签的移动逻辑，包括升级为一级标签和迁移到其他一级标签
 */

'use server'

import { db } from '~/lib/db'
import type { TagMoveOperation, TagMoveValidationResult } from '~/types/tags'
import type { PrismaClient } from '@prisma/client'

/**
 * 验证标签移动操作的合法性
 * @param tagId 要移动的标签ID
 * @param targetParentId 目标父标签ID（null表示升级为一级标签）
 * @returns 验证结果
 */
export async function validateTagMove(
  tagId: string,
  targetParentId: string | null
): Promise<TagMoveValidationResult> {
  // 1. 检查标签是否存在
  const tag = await db.tags.findUnique({
    where: { id: tagId },
    include: { parent: true }
  })

  if (!tag) {
    return { valid: false, error: '标签不存在' }
  }

  // 2. 如果目标父标签不为null，检查目标父标签是否存在
  if (targetParentId !== null) {
    const targetParent = await db.tags.findUnique({
      where: { id: targetParentId }
    })

    if (!targetParent) {
      return { valid: false, error: '目标父标签不存在' }
    }

    // 3. 检查是否移动到自身（一级标签不能移动到自身）
    if (targetParentId === tagId) {
      return { valid: false, error: '不能将标签移动到自身下' }
    }

    // 4. 检查循环引用：不能移动到自己的子标签下
    const hasCircularReference = await checkCircularReference(
      tagId,
      targetParentId
    )
    if (hasCircularReference) {
      return { valid: false, error: '不能将标签移动到其子标签下，避免循环引用' }
    }

    // 5. 检查目标父标签下是否已存在同名标签
    const existingTag = await db.tags.findFirst({
      where: {
        name: tag.name,
        parentId: targetParentId,
        id: { not: tagId }
      }
    })

    if (existingTag) {
      return { valid: false, error: `目标父标签下已存在同名标签"${tag.name}"` }
    }
  } else {
    // 升级为一级标签：检查是否已存在同名的一级标签
    const existingPrimaryTag = await db.tags.findFirst({
      where: {
        name: tag.name,
        parentId: null,
        id: { not: tagId }
      }
    })

    if (existingPrimaryTag) {
      return { valid: false, error: `已存在同名的一级标签"${tag.name}"` }
    }
  }

  return { valid: true }
}

/**
 * 检查循环引用
 * @param tagId 要移动的标签ID
 * @param targetParentId 目标父标签ID
 * @returns 是否存在循环引用
 */
async function checkCircularReference(
  tagId: string,
  targetParentId: string
): Promise<boolean> {
  const visited = new Set<string>()
  let currentId: string | null = targetParentId

  while (currentId) {
    // 如果遇到要移动的标签或其子标签，说明存在循环引用
    if (currentId === tagId || visited.has(currentId)) {
      return true
    }

    visited.add(currentId)

    // 获取当前标签的父标签
    const currentTag = await db.tags.findUnique({
      where: { id: currentId },
      select: { parentId: true }
    })

    currentId = currentTag?.parentId ?? null
  }

  return false
}

/**
 * 执行标签移动操作
 * @param tagId 要移动的标签ID
 * @param targetParentId 目标父标签ID（null表示升级为一级标签）
 * @returns 更新后的标签
 */
export async function moveTag(
  tagId: string,
  targetParentId: string | null
): Promise<{ success: boolean; tag?: any; error?: string }> {
  // 先验证
  const validation = await validateTagMove(tagId, targetParentId)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  try {
    // 获取要移动的标签
    const tag = await db.tags.findUnique({
      where: { id: tagId }
    })

    if (!tag) {
      return { success: false, error: '标签不存在' }
    }

    // 执行移动操作
    const updateData: {
      parentId: string | null
      category: string
    } = {
      parentId: targetParentId,
      category: ''
    }

    if (targetParentId === null) {
      // 升级为一级标签：category设为标签自己的name
      updateData.category = tag.name
    } else {
      // 移动到其他一级标签下：category设为父标签的name
      const parent = await db.tags.findUnique({
        where: { id: targetParentId }
      })
      if (parent) {
        updateData.category = parent.name
      } else {
        return { success: false, error: '目标父标签不存在' }
      }
    }

    const updatedTag = await db.tags.update({
      where: { id: tagId },
      data: updateData
    })

    return { success: true, tag: updatedTag }
  } catch (error) {
    console.error('标签移动失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '标签移动失败'
    }
  }
}

