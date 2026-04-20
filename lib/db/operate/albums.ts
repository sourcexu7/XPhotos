// 相册表

'use server'

import { db } from '~/lib/db'
import type { AlbumType } from '~/types'
import { invalidateAlbumsListCache } from '~/lib/db/query/albums'

function normalizeSortValue(sort: number | undefined): number {
  return !sort || sort < 0 ? 0 : sort
}

/**
 * 新增相册
 * @param album 相册数据
 */
export async function insertAlbums(album: AlbumType) {
  return await db.albums.create({
    data: {
      name: album.name,
      album_value: album.album_value,
      detail: album.detail,
      sort: normalizeSortValue(album.sort),
      theme: album.theme,
      show: album.show,
      license: album.license,
      del: 0,
      image_sorting: album.image_sorting,
      random_show: album.random_show,
      cover: album.cover,
    },
  })
}

/**
 * 逻辑删除相册
 * @param id 相册 ID
 */
export async function deleteAlbum(id: string) {
  const result = await db.albums.update({
    where: { id },
    data: {
      del: 1,
      updatedAt: new Date(),
    },
  })

  // 删除相册后，立即失效缓存
  invalidateAlbumsListCache()

  return result
}

/**
 * 更新相册
 * @param album 相册数据
 */
export async function updateAlbum(album: Partial<AlbumType> & { id: string }) {
  await db.$transaction(async (tx) => {
    const existingAlbum = await tx.albums.findFirst({
      where: { id: album.id },
    })
    
    if (!existingAlbum) {
      throw new Error('相册不存在！')
    }

    const updateData: any = { updatedAt: new Date() }
    
    if (album.name !== undefined) updateData.name = album.name
    if (album.album_value !== undefined) updateData.album_value = album.album_value
    if (album.detail !== undefined) updateData.detail = album.detail
    if (album.sort !== undefined) updateData.sort = normalizeSortValue(album.sort)
    if (album.theme !== undefined) updateData.theme = album.theme
    if (album.show !== undefined) updateData.show = album.show
    if (album.license !== undefined) updateData.license = album.license
    if (album.image_sorting !== undefined) updateData.image_sorting = album.image_sorting
    if (album.random_show !== undefined) updateData.random_show = album.random_show
    if (album.cover !== undefined) updateData.cover = album.cover

    await tx.albums.update({
      where: { id: album.id },
      data: updateData,
    })

    // 如果相册路由发生变化，更新关联表
    if (album.album_value && existingAlbum.album_value !== album.album_value) {
      await tx.imagesAlbumsRelation.updateMany({
        where: { album_value: existingAlbum.album_value },
        data: { album_value: album.album_value },
      })
    }
  })
}

/**
 * 更新相册是否显示
 * @param id 相册 ID
 * @param show 显示状态：0=显示，1=隐藏
 */
export async function updateAlbumShow(id: string, show: number) {
  return await db.albums.update({
    where: { id },
    data: {
      show,
      updatedAt: new Date(),
    },
  })
}

/**
 * 批量更新相册排序（权重）
 * @param orderedIds 相册 ID 按新顺序排列的数组
 * 规则：索引越小 sort 越小，保证 sort 唯一且连续
 */
export async function updateAlbumsSort(orderedIds: string[]) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return
  }

  // 这里不使用交互式事务，避免在部分环境下出现事务超时问题
  const updates = orderedIds.map((id, index) =>
    db.albums.update({
      where: { id },
      data: {
        sort: index,
        updatedAt: new Date(),
      },
    }),
  )

  await Promise.all(updates)

  // 排序更新后，失效后台列表缓存
  invalidateAlbumsListCache()
}
