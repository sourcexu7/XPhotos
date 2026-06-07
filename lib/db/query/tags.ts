'use server'

import { db } from '~/lib/db'
import { cacheWrap, cacheInvalidate } from '~/lib/redis'

const CACHE_KEY_TAGS_LIST = 'tags:list'
const CACHE_KEY_TAGS_TREE = 'tags:tree'

export async function invalidateTagsCache(): Promise<void> {
  await cacheInvalidate(CACHE_KEY_TAGS_LIST, CACHE_KEY_TAGS_TREE)
}

export async function fetchTagsList(): Promise<{ id: string; name: string; category?: string }[]> {
  return cacheWrap(CACHE_KEY_TAGS_LIST, async () => {
    const tags = await db.tags.findMany({ orderBy: { name: 'asc' } })
    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      category: tag.category ?? undefined,
    }))
  })
}

/**
 * 返回按 category 分组的树形结构
 */
export async function fetchTagsTree(): Promise<Array<{ id?: string; category: string | null; children: { id: string; name: string }[] }>> {
  return cacheWrap(CACHE_KEY_TAGS_TREE, async () => {
    const tags = await db.tags.findMany({ orderBy: [{ parentId: 'asc' }, { name: 'asc' }] })
    const hasParentField = tags.some((t) => t.parentId !== null)

    if (hasParentField) {
      const parentsMap: Record<string, { id: string; category: string | null; children: { id: string; name: string }[] }> = {}
      const orphans: { id: string; name: string }[] = []

      for (const t of tags) {
        if (!t.parentId) {
          parentsMap[t.id] = { id: t.id, category: t.category ?? t.name, children: [] }
        }
      }
      for (const t of tags) {
        if (t.parentId) {
          if (parentsMap[t.parentId]) parentsMap[t.parentId].children.push({ id: t.id, name: t.name })
          else orphans.push({ id: t.id, name: t.name })
        }
      }

      const result = Object.values(parentsMap).map((v) => ({
        id: v.id,
        category: v.category,
        children: v.children,
      }))
      if (orphans.length > 0) result.push({ id: '', category: null, children: orphans })
      return result
    }

    // fallback: category grouping
    const map: Record<string, { children: { id: string; name: string }[] }> = {}
    for (const t of tags) {
      const cat = t.category || ''
      if (!map[cat]) map[cat] = { children: [] }
      map[cat].children.push({ id: t.id, name: t.name })
    }
    return Object.entries(map).map(([k, v]) => ({
      category: k === '' ? null : k,
      children: v.children,
    }))
  })
}

export async function fetchTagsByCategory(category: string) {
  return await db.tags.findMany({ where: { category }, orderBy: { name: 'asc' } })
}
