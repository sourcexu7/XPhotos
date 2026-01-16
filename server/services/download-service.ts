import 'server-only'

import archiver from 'archiver'
import { PassThrough, type Stream } from 'stream'
import type { Image } from '@prisma/client'
import { streamImage } from '~/lib/storage'
import { fetchImageMetadataByIds } from '~/lib/db/query/images'

// --- 类型定义 ---
type ImageProcessResult = 
  | { status: 'success'; stream: Stream; meta: Image }
  | { status: 'error'; message: string };

// --- 配置项 ---
const ZIP_COMPRESSION_LEVEL = 9;

/**
 * 处理单张图片：获取流、检查EXIF
 */
async function processImage(imageMeta: Image, keepExif: boolean): Promise<ImageProcessResult> {
  try {
    const { stream, exif } = await streamImage(imageMeta);

    if (!keepExif && (exif?.GPSLatitude || exif?.GPSLongitude)) {
      return { status: 'error', message: `Image ${imageMeta.name}: Skipped due to GPS data.` };
    }

    return { status: 'success', stream, meta: imageMeta };
  } catch (error) {
    console.error(`Failed to process image ${imageMeta.id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { status: 'error', message: `Image ${imageMeta.name || imageMeta.id}: Failed to process (${errorMessage}).` };
  }
}

/**
 * 创建一个包含指定图片的 zip 压缩文件流
 * @param userId 请求下载的用户 ID
 * @param imageIds 要包含在压缩文件中的图片 ID 数组
 * @param keepExif 是否保留 EXIF 数据的布尔值
 * @returns 一个将包含 zip 压缩文件数据的 PassThrough 流
 */
export async function createImageArchiveStream(userId: string, imageIds: string[], keepExif: boolean): Promise<PassThrough> {
  const imageMap = await fetchImageMetadataByIds(userId, imageIds);

  const passThrough = new PassThrough();
  const archive = archiver('zip', {
    zlib: { level: ZIP_COMPRESSION_LEVEL },
  });

  archive.on('error', (err) => {
    console.error('Archiver error:', err);
    passThrough.end(); // 发生错误时结束流
  });

  archive.pipe(passThrough);

  const imageProcessingPromises = imageIds.map(id => {
    const imageMeta = imageMap.get(id);
    if (!imageMeta) {
      return Promise.resolve({ status: 'error', message: `Image ID ${id}: Not found or you do not have permission.` } as ImageProcessResult);
    }
    return processImage(imageMeta, keepExif);
  });

  const results = await Promise.all(imageProcessingPromises);
  const errorSummary: string[] = [];

  for (const result of results) {
    if (result.status === 'success') {
      archive.append(result.stream, { name: result.meta.name || `${result.meta.id}.jpg` });
    } else {
      errorSummary.push(result.message);
    }
  }

  if (errorSummary.length > 0) {
    archive.append(errorSummary.join('\n'), { name: 'download_summary.txt' });
  }

  archive.finalize();

  return passThrough;
}

