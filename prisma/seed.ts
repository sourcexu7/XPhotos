import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const INITIAL_CONFIGS = [
  { config_key: 'accesskey_id', config_value: '', detail: '阿里 OSS / AWS S3 AccessKey_ID' },
  { config_key: 'accesskey_secret', config_value: '', detail: '阿里 OSS / AWS S3 AccessKey_Secret' },
  { config_key: 'region', config_value: '', detail: '阿里 OSS / AWS S3 Region 地域，如：oss-cn-hongkong' },
  { config_key: 'endpoint', config_value: '', detail: '阿里 OSS / AWS S3 Endpoint 地域节点，如：oss-cn-hongkong.aliyuncs.com' },
  { config_key: 'bucket', config_value: '', detail: '阿里 OSS / AWS S3 Bucket 存储桶名称，如：xphotos' },
  { config_key: 'storage_folder', config_value: '', detail: '存储文件夹(S3)，严格格式，如：xphotos 或 xphotos/images ，填 / 或者不填表示根路径' },
  { config_key: 'force_path_style', config_value: 'false', detail: '是否强制客户端对桶使用路径式寻址，默认 false。' },
  { config_key: 's3_cdn', config_value: 'false', detail: '是否启用 S3 CDN 模式，路径将返回 cdn 地址，默认 false。' },
  { config_key: 's3_cdn_url', config_value: '', detail: 'cdn 地址，如：https://cdn.example.com' },
  { config_key: 's3_direct_download', config_value: 'false', detail: '是否启用 S3 直接下载模式，默认 false。' },
  { config_key: 'alist_token', config_value: '', detail: 'alist 令牌' },
  { config_key: 'alist_url', config_value: '', detail: 'AList 地址，如：https://alist.besscroft.com' },
  { config_key: 'secret_key', config_value: 'pic-impact', detail: 'SECRET_KEY' },
  { config_key: 'r2_accesskey_id', config_value: '', detail: 'Cloudflare AccessKey_ID' },
  { config_key: 'r2_accesskey_secret', config_value: '', detail: 'Cloudflare AccessKey_Secret' },
  { config_key: 'r2_account_id', config_value: '', detail: 'Cloudflare ACCOUNT_ID' },
  { config_key: 'r2_bucket', config_value: '', detail: 'Cloudflare Bucket 存储桶名称，如：xphotos' },
  { config_key: 'r2_storage_folder', config_value: '', detail: '存储文件夹(Cloudflare R2)，严格格式，如：xphotos 或 xphotos/images ，填 / 或者不填表示根路径' },
  { config_key: 'r2_public_domain', config_value: '', detail: 'Cloudflare R2 自定义域（公开访问）' },
  { config_key: 'r2_direct_download', config_value: 'false', detail: '是否启用 R2 直链下载模式，默认 false。' },
  { config_key: 'custom_title', config_value: 'XPhotos', detail: '网站标题' },
  { config_key: 'custom_favicon_url', config_value: '', detail: '用户自定义的 favicon 地址' },
  { config_key: 'custom_author', config_value: '', detail: '网站归属者名称' },
  { config_key: 'rss_feed_id', config_value: '', detail: 'Follow feedId' },
  { config_key: 'rss_user_id', config_value: '', detail: 'Follow userId' },
  { config_key: 'preview_max_width_limit', config_value: '0', detail: '预览图最大宽度限制' },
  { config_key: 'preview_max_width_limit_switch', config_value: '0', detail: '预览图最大宽度限制开关' },
  { config_key: 'preview_quality', config_value: '0.2', detail: '预览图压缩质量' },
  { config_key: 'custom_index_style', config_value: '0', detail: '首页风格：0->默认模式；1->简单模式；2->瀑布流模式' },
  { config_key: 'custom_index_download_enable', config_value: 'false', detail: '是否启用图片下载' },
  { config_key: 'custom_index_origin_enable', config_value: 'false', detail: '首页是否显示原图(精选图片模式)' },
  { config_key: 'max_upload_files', config_value: '5', detail: '最大上传文件数量' },
  { config_key: 'umami_analytics', config_value: '', detail: 'Umami Website ID.' },
  { config_key: 'umami_host', config_value: '', detail: 'Umami Cloud Analytics' },
  { config_key: 'admin_images_per_page', config_value: '8', detail: '管理界面每页显示的图片数量' },
]

const PRESET_TAGS = [
  // 省略：这里放入你给出的“风光摄影标签体系”的条目
  // 示例结构（category 可作为一级/二级分类）
  { name: '自然景观/山地/雪山', category: '风光题材/自然景观', detail: '' },
  { name: '自然景观/山地/丘陵', category: '风光题材/自然景观', detail: '' },
  { name: '自然景观/水域/湖泊', category: '风光题材/自然景观', detail: '' },
  { name: '自然现象/天文/星空', category: '风光题材/自然现象', detail: '' },
  { name: '人文风光/城市/天际线', category: '风光题材/人文风光', detail: '' },
  // ...推荐把你提供的标签体系逐条转换为 name/category 项...
]

export async function main() {
  try {
    if (prisma) {
      await prisma.$transaction(async (tx) => {
        await tx.configs.createMany({
          data: INITIAL_CONFIGS,
          skipDuplicates: true,
        })
      })
      console.log('action boot completed.')
    } else {
      console.error('Database initialization failed, please check your connection information.')
    }
  } catch (e) {
    console.error('Initialization failed. Please try to troubleshoot the issue first. If you cannot resolve it, please carry the logs and submit feedback at: https://github.com/besscroft/XPhotos/issues.', e)
  }
  // insert preset tags if not exists
  for (const tag of PRESET_TAGS) {
    try {
      // Ensure parent (category) exists, then create child with parentId
      let parentId: string | undefined = undefined
      if (tag.category) {
        const parent = await prisma.tags.upsert({ where: { name: tag.category }, update: {}, create: { name: tag.category, category: '' } })
        parentId = parent.id
      }
      await prisma.tags.upsert({
        where: { name: tag.name },
        update: {},
        create: {
          name: tag.name,
          category: tag.category,
          detail: tag.detail || '',
          parentId: parentId ?? null,
        }
      })
    } catch (e) {
      console.error('seed tag failed', tag, e)
    }
  }

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })