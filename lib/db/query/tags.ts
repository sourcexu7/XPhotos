// ...existing code...
import { db } from '~/lib/db'

export async function fetchTagsList(): Promise<{ id: string; name: string; category?: string }[]> {
  const tags = await db.tags.findMany({ orderBy: { name: 'asc' } })
  return tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    category: tag.category ?? undefined,
  }))
}

/**
 * 返回按 category 分组的树形结构（临时兼容逻辑，使用现有 `category` 字段表示一级）
 */
export async function fetchTagsTree(): Promise<Array<{ id?: string; category: string | null; children: { id: string; name: string }[] }>> {
  const tags = await db.tags.findMany({ orderBy: [{ parentId: 'asc' }, { name: 'asc' }] })
  type TagWithParent = { id: string; name: string; category?: string; parentId?: string | null };
  const hasParentField = tags.some((t: TagWithParent) => t.parentId !== undefined)
  if (hasParentField) {
    const parentsMap: Record<string, { id: string; category: string | null; children: { id: string; name: string }[] }> = {}
    const orphans: { id: string; name: string }[] = []
    for (const t of tags as TagWithParent[]) {
      const pid = t.parentId
      if (!pid) {
        // parent node
        const key = t.category ?? t.name
        parentsMap[t.id] = { id: t.id, category: t.category ?? t.name, children: [] }
      }
    }
    for (const t of tags as TagWithParent[]) {
      const pid = t.parentId
      if (pid) {
        if (parentsMap[pid]) parentsMap[pid].children.push({ id: t.id, name: t.name })
        else orphans.push({ id: t.id, name: t.name })
      }
    }
    const result: Array<{ category: string | null; children: { id: string; name: string }[] }> = []
    for (const k of Object.keys(parentsMap)) {
      const v = parentsMap[k]
      result.push({ id: v.id, category: v.category, children: v.children })
    }
    // attach orphans as unnamed category if any
    if (orphans.length > 0) result.push({ category: null, children: orphans })
    return result
  }
  // fallback: use category grouping
  const map: Record<string, { children: { id: string; name: string }[] }> = {}
  for (const t of tags) {
    const cat = t.category || ''
    if (!map[cat]) map[cat] = { children: [] }
    map[cat].children.push({ id: t.id, name: t.name })
  }
  const result: Array<{ category: string | null; children: { id: string; name: string }[] }> = []
  for (const k of Object.keys(map)) {
    result.push({ category: k === '' ? null : k, children: map[k].children })
  }
  return result
}

export async function fetchTagsByCategory(category: string) {
  return await db.tags.findMany({ where: { category }, orderBy: { name: 'asc' } })
}