import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

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

// 由 tags_rows.json 导出的真实标签体系
const PRESET_TAGS = [
  {"id":"cmir3ih650001l40460t2zuyb","name":"自然景观","detail":"","created_at":"2025-12-04 07:09:39.821","updated_at":"2025-12-04 07:09:39.821","category":"自然景观","parentId":null},
  {"id":"cmir3iq8u0003l404t9nklwob","name":"自然现象","detail":"","created_at":"2025-12-04 07:09:51.367","updated_at":"2025-12-04 07:09:51.367","category":"自然现象","parentId":null},
  {"id":"cmir3itv70005l404pewnowfj","name":"拍摄时刻","detail":"","created_at":"2025-12-04 07:09:56.275","updated_at":"2025-12-04 07:10:06.728","category":"拍摄时刻","parentId":null},
  {"id":"cmir3j7dj0007l404081nvsqn","name":"人文摄影","detail":"","created_at":"2025-12-04 07:10:13.783","updated_at":"2025-12-04 07:10:13.783","category":"人文摄影","parentId":null},
  {"id":"cmir3jf9q0009l404px8y45d0","name":"演唱会","detail":"","created_at":"2025-12-04 07:10:23.8","updated_at":"2025-12-04 07:10:23.8","category":"演唱会","parentId":"cmir3j7dj0007l404081nvsqn"},
  {"id":"cmir3jijc000bl404iokrsv5y","name":"扫街","detail":"","created_at":"2025-12-04 07:10:28.249","updated_at":"2025-12-04 07:10:28.249","category":"扫街","parentId":"cmir3j7dj0007l404081nvsqn"},
  {"id":"cmir3jn5x000dl404yw4if4n8","name":"日出","detail":"","created_at":"2025-12-04 07:10:34.245","updated_at":"2025-12-04 07:10:34.245","category":"日出","parentId":"cmir3itv70005l404pewnowfj"},
  {"id":"cmir3jqnz000fl404v0js88ke","name":"日落","detail":"","created_at":"2025-12-04 07:10:38.783","updated_at":"2025-12-04 07:10:38.783","category":"日落","parentId":"cmir3itv70005l404pewnowfj"},
  {"id":"cmir3jtzc000hl40428f354zu","name":"蓝调","detail":"","created_at":"2025-12-04 07:10:43.081","updated_at":"2025-12-04 07:10:43.081","category":"蓝调","parentId":"cmir3itv70005l404pewnowfj"},
  {"id":"cmir3qams000ll4043u7xarl8","name":"城市风光","detail":"","created_at":"2025-12-04 07:15:43.229","updated_at":"2025-12-04 07:15:43.229","category":"城市风光","parentId":null},
  {"id":"cmir3qpkk000nl4045jbiolki","name":"星空摄影","detail":"","created_at":"2025-12-04 07:16:03.735","updated_at":"2025-12-04 07:16:03.735","category":"星空摄影","parentId":null},
  {"id":"cmir3r3ht000pl404xba5c5q3","name":"车轨","detail":"","created_at":"2025-12-04 07:16:21.78","updated_at":"2025-12-04 07:16:21.78","category":"车轨","parentId":"cmir3qams000ll4043u7xarl8"},
  {"id":"cmir3r7ck000rl404f9tjfyui","name":"夜景","detail":"","created_at":"2025-12-04 07:16:26.996","updated_at":"2025-12-04 07:16:26.996","category":"夜景","parentId":"cmir3qams000ll4043u7xarl8"},
  {"id":"cmir3rhku000tl4044gnnx6b4","name":"银河","detail":"","created_at":"2025-12-04 07:16:40.033","updated_at":"2025-12-04 07:16:40.033","category":"银河","parentId":"cmir3qpkk000nl4045jbiolki"},
  {"id":"cmir3rp9p000vl404an8mqvjd","name":"极光","detail":"","created_at":"2025-12-04 07:16:50.221","updated_at":"2025-12-04 07:16:50.221","category":"极光","parentId":"cmir3qpkk000nl4045jbiolki"},
  {"id":"cmir3s6qw000xl4041dhvhs9q","name":"风暴","detail":"","created_at":"2025-12-04 07:17:12.651","updated_at":"2025-12-04 07:17:12.651","category":"风暴","parentId":"cmir3iq8u0003l404t9nklwob"},
  {"id":"cmir3skr3000zl404amj55crb","name":"草原","detail":"","created_at":"2025-12-04 07:17:30.802","updated_at":"2025-12-04 07:17:30.802","category":"草原","parentId":"cmir3ih650001l40460t2zuyb"},
  {"id":"cmir3snws0011l4043wglgug1","name":"湖泊","detail":"","created_at":"2025-12-04 07:17:35.116","updated_at":"2025-12-04 07:17:35.116","category":"湖泊","parentId":"cmir3ih650001l40460t2zuyb"},
  {"id":"cmir3sqpf0013l404wva0ymr8","name":"沙漠","detail":"","created_at":"2025-12-04 07:17:38.739","updated_at":"2025-12-04 07:17:38.739","category":"沙漠","parentId":"cmir3ih650001l40460t2zuyb"},
  {"id":"cmir3stht0015l4049kgjw8e6","name":"雪山","detail":"","created_at":"2025-12-04 07:17:42.354","updated_at":"2025-12-04 07:17:42.354","category":"雪山","parentId":"cmir3ih650001l40460t2zuyb"},
  {"id":"cmir3t82r0017l404fx6lzwpr","name":"海洋","detail":"","created_at":"2025-12-04 07:18:01.028","updated_at":"2025-12-04 07:18:01.028","category":"海洋","parentId":"cmir3ih650001l40460t2zuyb"},
  {"id":"cmisyweni000aic043zfvi6r5","name":"建筑类型","detail":"","created_at":"2025-12-05 14:36:03.795","updated_at":"2025-12-05 14:36:03.795","category":"建筑类型","parentId":null},
  {"id":"cmisywir9000cic04894exoiy","name":"古建筑","detail":"","created_at":"2025-12-05 14:36:09.334","updated_at":"2025-12-05 14:36:09.334","category":"古建筑","parentId":"cmisyweni000aic043zfvi6r5"},
  {"id":"cmisywoyy000eic049qenogkl","name":"晚霞","detail":"","created_at":"2025-12-05 14:36:17.387","updated_at":"2025-12-05 14:36:17.387","category":"晚霞","parentId":"cmir3iq8u0003l404t9nklwob"},
  {"id":"cmiwlpf7x0005tpnopg5kco2i","name":"火山","detail":"","created_at":"2025-12-08 03:37:47.853","updated_at":"2025-12-08 03:37:47.853","category":"火山","parentId":"cmir3ih650001l40460t2zuyb"},
  {"id":"cmiwlpidm0007tpno2m9n8roa","name":"瀑布","detail":"","created_at":"2025-12-08 03:37:51.946","updated_at":"2025-12-08 03:37:51.946","category":"瀑布","parentId":"cmir3ih650001l40460t2zuyb"},
  {"id":"cmiwlq3kq0009tpnoea6554bt","name":"植物花卉","detail":"","created_at":"2025-12-08 03:38:19.341","updated_at":"2025-12-08 03:38:19.341","category":"植物花卉","parentId":null},
  {"id":"cmiwlqb4w000btpnoyd6hnazf","name":"樱花","detail":"","created_at":"2025-12-08 03:38:29.216","updated_at":"2025-12-08 03:38:29.216","category":"樱花","parentId":"cmiwlq3kq0009tpnoea6554bt"},
  {"id":"cmiwlqdwi000dtpno7q7fb5pm","name":"树林","detail":"","created_at":"2025-12-08 03:38:32.802","updated_at":"2025-12-08 03:38:32.802","category":"树林","parentId":"cmiwlq3kq0009tpnoea6554bt"},
  {"id":"cmiwlqjq7000ftpnohre1vd7l","name":"小镇","detail":"","created_at":"2025-12-08 03:38:40.351","updated_at":"2025-12-08 03:38:40.351","category":"小镇","parentId":"cmisyweni000aic043zfvi6r5"},
  {"id":"cmiwlqt4q000htpno6st4jn9c","name":"雪景","detail":"","created_at":"2025-12-08 03:38:52.461","updated_at":"2025-12-08 03:38:52.461","category":"雪景","parentId":"cmir3ih650001l40460t2zuyb"},
  {"id":"cmj5ttsad0003jr049ee6siwx","name":"海浪","detail":"","created_at":"2025-12-14 14:35:03.926","updated_at":"2025-12-14 14:35:03.926","category":"海浪","parentId":"cmir3ih650001l40460t2zuyb"},
  {"id":"cmj5tu0gc0005jr041fxi3ren","name":"悬崖","detail":"","created_at":"2025-12-14 14:35:14.293","updated_at":"2025-12-14 14:35:14.293","category":"悬崖","parentId":"cmir3ih650001l40460t2zuyb"}
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
  
  // 初始化管理员账号（如果不存在）
  // 支持通过环境变量配置：ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@xphotos.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'Xphotos@123'
    const adminName = process.env.ADMIN_NAME || 'admin'

    if (!adminEmail || !adminPassword || !adminName) {
      console.error('Admin credentials are required. Please set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME environment variables.')
      return
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (!existingUser) {
      // 检查用户名是否已存在
      const existingUserByName = await prisma.user.findUnique({
        where: { name: adminName }
      })

      if (existingUserByName) {
        console.error(`Admin user with name "${adminName}" already exists. Please use a different ADMIN_NAME.`)
        return
      }

      const hashedPassword = await bcrypt.hash(adminPassword, 10)
      const userId = crypto.randomUUID()
      
      await prisma.user.create({
        data: {
          id: userId,
          email: adminEmail,
          name: adminName,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          accounts: {
            create: {
              id: crypto.randomUUID(),
              accountId: adminEmail,
              providerId: 'credential',
              password: hashedPassword,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          }
        }
      })
      console.log(`Admin user created successfully:`)
      console.log(`  Email: ${adminEmail}`)
      console.log(`  Username: ${adminName}`)
      console.log(`  Password: ${adminPassword}`)
    } else {
      console.log(`Admin user already exists: ${adminEmail}`)
    }
  } catch (e) {
    console.error('Failed to initialize admin user:', e)
  }

  // insert preset tags if not exists
  for (const tag of PRESET_TAGS) {
    try {
      await prisma.tags.upsert({
        where: { name: tag.name },
        update: {},
        create: {
          name: tag.name,
          category: tag.category,
          detail: tag.detail || '',
          parentId: tag.parentId ?? null,
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