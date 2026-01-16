import 'server-only';
import { db } from '~/lib/db';
import { getClient } from '~/lib/s3';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { fetchConfigsByKeys } from '~/lib/db/query/configs';
import type { Config } from '~/types';
import { Prisma } from '@prisma/client';

// --- 配置 ---
// 是否真的执行删除操作。false = 只检查并报告 (安全模式), true = 检查并删除
const DRY_RUN = process.env.DRY_RUN !== 'false'; // 默认为 true (安全模式)
// 每次从数据库获取的图片数量
const BATCH_SIZE = 100;
// S3 API 并发检查数量
const CONCURRENCY = 10;

// --- 辅助函数 ---
function toConfigMap(configs: Config[]): Record<string, string> {
  return configs.reduce((map, c) => {
    if (c.config_key) map[c.config_key] = c.config_value || '';
    return map;
  }, {} as Record<string, string>);
}

// 从图片URL或original_key中解析出S3的key
function getKeyFromImage(image: { url: string; original_key: string | null }, s3StorageFolder: string): string | null {
  if (image.original_key) {
    return image.original_key.startsWith('/') ? image.original_key.slice(1) : image.original_key;
  }
  try {
    const url = new URL(image.url);
    // 移除开头的 '/' 得到 key
    let key = decodeURIComponent(url.pathname.slice(1));

    // 兼容旧数据，如果 key 包含了 storage folder，则移除它
    const normalizedFolder = s3StorageFolder.startsWith('/') ? s3StorageFolder.slice(1) : s3StorageFolder;
    if (normalizedFolder && key.startsWith(normalizedFolder + '/')) {
        // This is incorrect logic for some cases, but we keep it for compatibility if needed
        // A better approach is to assume the full path from the URL is the key.
    }
    return key;
  } catch (e) {
    console.error(`Invalid URL for image ID ${image.id}: ${image.url}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting orphan image cleanup script...');
  console.log(`- Dry Run Mode: ${DRY_RUN ? '✅ ON (read-only)' : '❌ OFF (will delete from DB)'}`);
  console.log(`- Batch Size: ${BATCH_SIZE}`);
  console.log(`- Concurrency: ${CONCURRENCY}`);
  console.log('------------------------------------\n');

  const s3Configs = await fetchConfigsByKeys(['accesskey_id', 'accesskey_secret', 'region', 'endpoint', 'bucket', 'storage_folder']);
  const configMap = toConfigMap(s3Configs);
  const bucket = configMap['bucket'];
  const s3StorageFolder = configMap['storage_folder'] || '';

  if (!bucket) {
    console.error('❌ S3 bucket is not configured. Aborting.');
    return;
  }

  const s3 = getClient(s3Configs);
  let cursor: string | undefined = undefined;
  let totalChecked = 0;
  const orphanIds: string[] = [];

  while (true) {
    const images = await db.image.findMany({
      take: BATCH_SIZE,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: {
        id: 'asc',
      },
      select: { id: true, url: true, original_key: true },
    });

    if (images.length === 0) {
      console.log('\n🏁 No more images to check.');
      break;
    }

    const checkPromises = images.map(async (image) => {
      const key = getKeyFromImage(image as any, s3StorageFolder);
      if (!key) {
        orphanIds.push(image.id);
        console.warn(`- ⚠️ Image ID ${image.id} has an invalid URL or key.`);
        return;
      }

      try {
        await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      } catch (error: any) {
        if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
          console.log(`- ❌ Found orphan: ID ${image.id}, Key: ${key}`);
          orphanIds.push(image.id);
        } else {
          console.error(`- 🛑 Error checking ID ${image.id} (Key: ${key}):`, error.name);
        }
      }
    });

    // 并发执行检查
    await Promise.all(checkPromises);

    totalChecked += images.length;
    cursor = images[images.length - 1].id;
    console.log(`- Processed ${totalChecked} images...`);
  }

  console.log('\n--- Cleanup Summary ---');
  console.log(`- Total images checked: ${totalChecked}`);
  console.log(`- Total orphan images found: ${orphanIds.length}`);

  if (orphanIds.length > 0) {
    console.log('\nOrphan Image IDs:');
    console.log(orphanIds.join(', '));

    if (!DRY_RUN) {
      console.log('\n- Deleting orphan records from the database...');
      try {
        const { count } = await db.image.deleteMany({
          where: {
            id: { in: orphanIds },
          },
        });
        console.log(`- ✅ Successfully deleted ${count} orphan records.`);
      } catch (dbError) {
        console.error('- ❌ Failed to delete orphan records:', dbError);
      }
    } else {
      console.log('\n- Dry run is ON. No records were deleted.');
      console.log('- To delete these records, run with DRY_RUN=false env variable.');
    }
  }

  console.log('\n✅ Cleanup script finished.');
}

main().catch((e) => {
  console.error('An unexpected error occurred:', e);
  process.exit(1);
});

