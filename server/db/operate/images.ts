// 图片表

'use server'

import { db } from '~/server/lib/db'
import type { ImageType } from '~/types'
import { upsertTagsByName } from '~/server/db/operate/tags'

/**
 * 恢复已删除的图片
 */
async function reviveDeletedImage(tx: any, imageId: string, image: ImageType) {
  const revived = await tx.images.update({
    where: { id: imageId },
    data: {
      url: image.url,
      title: image.title,
      preview_url: image.preview_url,
      video_url: image.video_url,
      blurhash: image.blurhash,
      exif: image.exif,
      labels: image.labels,
      width: image.width,
      height: image.height,
      detail: image.detail,
      lat: String(image.lat),
      lon: String(image.lon),
      type: image.type,
      show: 0,
      show_on_mainpage: 0,
      del: 0,
      updatedAt: new Date(),
    },
  })

  await tx.imagesAlbumsRelation.create({
    data: { imageId: revived.id, album_value: image.album },
  })

  await syncImageTags(tx, revived.id, image)
  return revived
}

/**
 * 同步图片标签
 */
async function syncImageTags(tx: any, imageId: string, image: ImageType) {
  if (!image.labels || !Array.isArray(image.labels) || image.labels.length === 0) {
    return
  }

  const categoryMap = (image as any).tagCategoryMap as Record<string, string> | undefined

  if (categoryMap && typeof categoryMap === 'object') {
    const tags = await upsertTagsByName(image.labels, categoryMap)
    await Promise.all(
      tags.map((tag) =>
        tx.imagesTagsRelation.create({ data: { imageId, tagId: tag.id } })
      )
    )
  } else {
    await Promise.all(
      image.labels.map(async (label) => {
        const tag = await tx.tags.upsert({
          where: { name: label },
          update: {},
          create: { name: label },
        })
        await tx.imagesTagsRelation.create({
          data: { imageId, tagId: tag.id },
        })
      })
    )
  }
}

/**
 * 新增图片
 * @param image 图片数据
 */
export async function insertImage(image: ImageType) {
  if (!image.sort || image.sort < 0) {
    image.sort = 0
  }

  return await db.$transaction(async (tx) => {
    // 幂等检查: 优先按 blurhash 检查(如果提供), 其次按 url 检查
    const existingImage = image.blurhash
      ? await tx.images.findFirst({ where: { blurhash: image.blurhash } })
      : image.url
        ? await tx.images.findFirst({ where: { url: image.url } })
        : null

    // 如果存在且被逻辑删除, 恢复并更新元数据
    if (existingImage && (existingImage as any).del === 1) {
      return await reviveDeletedImage(tx, existingImage.id, image)
    }

    // 如果存在且未删除, 直接返回
    if (existingImage) {
      return existingImage
    }

    // 创建新图片
    const resultRow = await tx.images.create({
      data: {
        id: image.id,
        image_name: image.image_name,
        url: image.url,
        title: image.title,
        blurhash: image.blurhash,
        preview_url: image.preview_url,
        video_url: image.video_url,
        exif: image.exif,
        labels: image.labels,
        width: image.width,
        height: image.height,
        detail: image.detail,
        lat: String(image.lat),
        lon: String(image.lon),
        type: image.type,
        show: 0,
        show_on_mainpage: 0,
        sort: image.sort,
        del: 0,
      },
    })

    await tx.imagesAlbumsRelation.create({
      data: {
        imageId: resultRow.id,
        album_value: image.album,
      },
    })

    await syncImageTags(tx, resultRow.id, image)

    return resultRow
  })
}

/**
 * 逻辑删除图片
 * @param id 图片 ID
 */
export async function deleteImage(id: string) {
  await db.$transaction(async (tx) => {
    await tx.imagesAlbumsRelation.deleteMany({ where: { imageId: id } })
    await tx.images.update({
      where: { id },
      data: {
        del: 1,
        updatedAt: new Date(),
      },
    })
  })
}

/**
 * 批量逻辑删除图片
 * @param ids 图片 ID 数组
 */
export async function deleteBatchImage(ids: string[]) {
  await db.$transaction(async (tx) => {
    await tx.imagesAlbumsRelation.deleteMany({ where: { imageId: { in: ids } } })
    await tx.images.updateMany({
      where: { id: { in: ids } },
      data: {
        del: 1,
        updatedAt: new Date(),
      },
    })
  })
}

/**
 * 更新图片
 * @param image 图片数据
 */
export async function updateImage(image: ImageType) {
  if (!image.sort || image.sort < 0) {
    image.sort = 0
  }

  await db.$transaction(async (tx) => {
    await tx.images.update({
      where: { id: image.id },
      data: {
        url: image.url,
        title: image.title,
        preview_url: image.preview_url,
        video_url: image.video_url,
        blurhash: image.blurhash,
        exif: image.exif,
        labels: image.labels,
        detail: image.detail,
        sort: image.sort,
        show: image.show,
        show_on_mainpage: image.show_on_mainpage,
        width: image.width,
        height: image.height,
        lat: image.lat,
        lon: image.lon,
        updatedAt: new Date(),
      },
    })

    // 删除旧的标签关系并重新写入
    await tx.imagesTagsRelation.deleteMany({
      where: { imageId: image.id },
    })

    await syncImageTags(tx, image.id, image)
  })
}

/**
 * 更新图片的显示状态
 * @param id 图片 ID
 * @param show 显示状态：0=显示，1=隐藏
 */
export async function updateImageShow(id: string, show: number) {
  return await db.images.update({
    where: { id },
    data: {
      show,
      updatedAt: new Date(),
    },
  })
}

/**
 * 更新图片的相册
 * @param imageId 图片 ID
 * @param albumId 相册 ID
 */
export async function updateImageAlbum(imageId: string, albumId: string) {
  await db.$transaction(async (tx) => {
    const album = await tx.albums.findUnique({
      where: { id: albumId },
    })
    if (!album) {
      throw new Error('相册不存在！')
    }

    await tx.imagesAlbumsRelation.deleteMany({
      where: { imageId },
    })
    await tx.imagesAlbumsRelation.create({
      data: {
        imageId,
        album_value: album.album_value,
      },
    })
  })
}
