// 图片表

'use server'

import { db } from '~/lib/db'
import type { ImageType } from '~/types'
import type { Prisma, Tag } from '@prisma/client'
import { upsertTagsByName } from '~/lib/db/operate/tags'

/**
 * 恢复已删除的图片
 */
import type { PrismaClient } from '@prisma/client'
async function reviveDeletedImage(tx: PrismaClient, imageId: string, image: ImageType) {
  const revived = await tx.images.update({
    where: { id: imageId },
    data: {
      url: image.url,
      title: image.title,
      preview_url: image.preview_url,
      video_url: image.video_url,
      original_key: (image as ImageType & { original_key?: string | null }).original_key ?? null,
      preview_key: (image as ImageType & { preview_key?: string | null }).preview_key ?? null,
      video_key: (image as ImageType & { video_key?: string | null }).video_key ?? null,
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
 * 优化：使用批量查询减少数据库往返，避免事务超时
 */
async function syncImageTags(tx: PrismaClient, imageId: string, image: ImageType) {
  if (!image.labels || !Array.isArray(image.labels) || image.labels.length === 0) {
    return
  }

  // 去重，防止输入中包含重复标签
  const uniqueLabels = Array.from(new Set(image.labels))

  const categoryMap = (image as ImageType & { tagCategoryMap?: Record<string, string> }).tagCategoryMap as Record<string, string> | undefined

  let tags: Tag[] = []
  if (categoryMap && typeof categoryMap === 'object') {
    tags = await upsertTagsByName(tx, uniqueLabels, categoryMap)
  } else {
    // 批量查询已存在的标签
    const existingTags = await tx.tags.findMany({
      where: { name: { in: uniqueLabels } }
    })
    const existingTagMap = new Map(existingTags.map(tag => [tag.name, tag]))
    
    // 找出需要创建的标签
    const tagsToCreate = uniqueLabels.filter(label => !existingTagMap.has(label))
    
    // 批量创建新标签
    if (tagsToCreate.length > 0) {
      await tx.tags.createMany({
        data: tagsToCreate.map(name => ({ name })),
        skipDuplicates: true
      })
      // 重新查询获取所有标签（包括刚创建的）
      const allTags = await tx.tags.findMany({
        where: { name: { in: uniqueLabels } }
      })
      tags = allTags
    } else {
      tags = existingTags
    }
  }
  
  const relations = tags.map((tag: Tag) => ({ imageId, tagId: tag.id }))
  if (relations.length > 0) {
    await tx.imagesTagsRelation.createMany({ data: relations, skipDuplicates: true })
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
    if (existingImage && (existingImage as ImageType & { del?: number }).del === 1) {
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
        original_key: (image as ImageType & { original_key?: string | null }).original_key ?? null,
        preview_key: (image as ImageType & { preview_key?: string | null }).preview_key ?? null,
        video_key: (image as ImageType & { video_key?: string | null }).video_key ?? null,
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

    // 检查相册是否有封面，如果没有则设置当前图片为封面
    const album = await tx.albums.findUnique({
      where: { album_value: image.album },
    })

    if (album && !album.cover) {
      await tx.albums.update({
        where: { id: album.id },
        data: { cover: resultRow.preview_url || resultRow.url },
      })
    }

    await syncImageTags(tx, resultRow.id, image)

    return resultRow
  }, {
    maxWait: 10000, // 等待事务锁的最大时间（10秒）
    timeout: 30000, // 事务超时时间（30秒）
  })
}

/**
 * 逻辑删除图片
 * @param id 图片 ID
 */
export async function deleteImage(id: string) {
  await db.$transaction(async (tx) => {
    // 尝试删除存储对象（尽力而为，失败不阻断）
    try {
      const img = await tx.images.findUnique({ where: { id } })
      const originalKey = (img as ImageType & { original_key?: string | null })?.original_key as string | undefined
      const previewKey = (img as ImageType & { preview_key?: string | null })?.preview_key as string | undefined
      const videoKey = (img as ImageType & { video_key?: string | null })?.video_key as string | undefined
      const keys = [originalKey, previewKey, videoKey].filter(Boolean) as string[]
      if (keys.length) {
        // 删除 S3
        try {
          const { fetchConfigsByKeys } = await import('~/lib/db/query/configs')
          const s3Configs = await fetchConfigsByKeys(['accesskey_id','accesskey_secret','region','endpoint','bucket'])
          const s3Bucket = s3Configs.find((i: { config_key: string; config_value: string }) => i.config_key === 'bucket')?.config_value || ''
          if (s3Bucket) {
            const { getClient } = await import('~/lib/s3')
            const client = getClient(s3Configs)
            const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
            for (const k of keys) {
              await client.send(new DeleteObjectCommand({ Bucket: s3Bucket, Key: k }))
            }
          }
        } catch {}
        // 删除 R2（与 S3 兼容协议）
        try {
          const { fetchConfigsByKeys } = await import('~/lib/db/query/configs')
          const r2Configs = await fetchConfigsByKeys(['r2_account_id','r2_accesskey_id','r2_accesskey_secret','r2_bucket'])
          const { getR2Client } = await import('~/lib/r2')
          const r2Bucket = r2Configs.find((i: { config_key: string; config_value: string }) => i.config_key === 'r2_bucket')?.config_value || ''
          if (r2Bucket) {
            const r2Client = getR2Client(r2Configs)
            const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
            for (const k of keys) {
              await r2Client.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: k }))
            }
          }
        } catch {}
      }
    } catch {}

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
  }, {
    maxWait: 10000, // 等待事务锁的最大时间（10秒）
    timeout: 30000, // 事务超时时间（30秒）
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
 * 更新图片的精选状态
 * @param id 图片 ID
 * @param featured 精选状态：0=非精选，1=精选
 */
export async function updateImageFeatured(id: string, featured: number) {
  return await db.images.update({
    where: { id },
    data: {
      featured,
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
