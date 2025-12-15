//标签表

'use server'

import { db } from '~/lib/db'
import type { Config } from '~/types'

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
 */
export async function updateTag(id: string, payload: { name?: string; category?: string; parentName?: string; detail?: string }) {
  const data: any = { ...(payload as any) }
  if (payload.parentName) {
    // resolve parentName to parentId
    const parent = await db.tags.upsert({ where: { name: payload.parentName }, update: {}, create: { name: payload.parentName, category: '' } })
    data.parentId = parent.id
    data.category = payload.parentName
  }
  return await db.tags.update({
    where: { id },
    data
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
 * 确保一组标签存在（upsert），返回 tags 对象数组
 */
import type { PrismaClient } from '@prisma/client'
export async function upsertTagsByName(tx: PrismaClient, names: string[], categoryMap?: Record<string, string>) {
  const results = []
  const parentIdMap: Record<string, string> = {}
  if (categoryMap) {
    // ensure parents exist
    const parentNames = Array.from(new Set(Object.values(categoryMap).filter(Boolean)))
    for (const pn of parentNames) {
      const p = await tx.tags.upsert({ where: { name: pn }, update: {}, create: { name: pn, category: '' } })
      parentIdMap[pn] = p.id
    }
  }
  for (const name of names) {
    const createData: any = { name }
    if (categoryMap && categoryMap[name]) {
      createData.category = categoryMap[name]
      if (parentIdMap[categoryMap[name]]) createData.parentId = parentIdMap[categoryMap[name]]
    }
    const tag = await tx.tags.upsert({
      where: { name },
      update: {},
      create: createData
    })
    results.push(tag)
  }
  return results
}

export async function findTagsByCategory(category: string) {
  return await db.tags.findMany({ where: { category }, orderBy: { name: 'asc' } })
}
