// 相册表

'use server'

import { db } from '~/lib/db'
import type { AlbumType } from '~/types'

const DEFAULT_ORDER_BY = [
  { sort: 'desc' as const },
  { createdAt: 'desc' as const },
  { updatedAt: 'desc' as const },
]

/**
 * 获取所有相册列表
 * @returns {Promise<AlbumType[]>} 相册列表
 */
export async function fetchAlbumsList(): Promise<AlbumType[]> {
  return await db.albums.findMany({
    where: { del: 0 },
    orderBy: DEFAULT_ORDER_BY,
  })
}

/**
 * 获取所有能显示的相册列表（除了首页路由外，且 show 为 0）
 * @returns {Promise<AlbumType[]>} 相册列表
 */
export async function fetchAlbumsShow(): Promise<AlbumType[]> {
  return await db.albums.findMany({
    where: {
      del: 0,
      show: 0,
      album_value: { not: '/' },
    },
    orderBy: [{ sort: 'desc' }],
  })
}

/**
 * 获取对应路由的相册信息
 * @param router 相册路由
 */
export async function fetchAlbumByRouter(router: string): Promise<AlbumType | null> {
  return await db.albums.findFirst({
    where: {
      del: 0,
      show: 0,
      album_value: router,
    },
  })
}
