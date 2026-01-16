import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { rateLimiter } from 'hono-rate-limiter'
import { fetchImageIdsByAlbum } from '~/lib/db/query/images'
import { createImageArchiveStream } from '~/server/services/download-service'

const app = new Hono()

// --- 配置项 ---
const MAX_IMAGES_PER_DOWNLOAD = 100;

// --- 中间件 ---
const limiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  standardHeaders: 'draft-6',
  keyGenerator: (c) => c.get('user')?.id || c.req.header('x-forwarded-for') || 'anonymous',
});
app.use('*', limiter)

app.onError((err, c) => {
  console.error(`[Download API Error]: ${err}`);
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  return c.json({ message: 'An internal server error occurred.' }, 500);
});

// --- 辅助函数 ---
const validateImageIds = (imageIds: unknown): string[] => {
  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw new HTTPException(400, { message: 'Image IDs are required and must be an array.' });
  }
  if (imageIds.length > MAX_IMAGES_PER_DOWNLOAD) {
    throw new HTTPException(400, { message: `Maximum of ${MAX_IMAGES_PER_DOWNLOAD} images can be downloaded at once` });
  }
  return imageIds as string[];
}

// --- 路由定义 ---

// 路由1: 根据图片ID多选下载
app.post('/images', async (c) => {
  const userId = c.get('user')?.id;
  if (!userId) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const { imageIds: rawImageIds } = await c.req.json();
  const imageIds = validateImageIds(rawImageIds);
  const keepExif = c.req.query('keepExif') === 'true';

  const archiveStream = await createImageArchiveStream(userId, imageIds, keepExif);

  c.header('Content-Type', 'application/zip');
  c.header('Content-Disposition', `attachment; filename="xphotos_download.zip"`);
  
  return c.stream(async (stream) => {
    await stream.pipe(archiveStream);
  });
});

// 路由2: 下载相册全部原图
app.get('/album/:albumValue{.+}', async (c) => {
  const userId = c.get('user')?.id;
  if (!userId) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const albumValue = c.req.param('albumValue');
  const imageIds = await fetchImageIdsByAlbum(userId, albumValue);
  const validatedImageIds = validateImageIds(imageIds);
  const keepExif = c.req.query('keepExif') === 'true';

  const archiveStream = await createImageArchiveStream(userId, validatedImageIds, keepExif);

  c.header('Content-Type', 'application/zip');
  c.header('Content-Disposition', `attachment; filename="xphotos_download.zip"`);

  return c.stream(async (stream) => {
    await stream.pipe(archiveStream);
  });
});

export default app;
