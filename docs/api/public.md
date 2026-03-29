# 公开接口（`/api/v1/public/**` 与 `/api/public/**`）

本项目公开接口存在两套前缀：

- **`/api/v1/public/**`**：由 Hono `server/public.ts` 挂载（`server/index.ts` → `/v1/public`）
- **`/api/public/**`**：由 Hono 聚合入口 `app/api/[[...route]]/route.ts` 直接挂载（`/public/download`、`/public/images`）

## `/api/v1/public/**`（Hono：`server/public.ts`）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/v1/public/about-info` | 获取“关于我”页面展示配置 |
| GET | `/api/v1/public/site-info` | 获取站点基础信息（标题、作者、首页样式开关等） |
| GET | `/api/v1/public/covers` | 获取封面页数据（相册 + 公开图片数量） |
| POST | `/api/v1/public/visit-log` | 记录访问日志（失败返回 204，不影响前台体验） |
| GET | `/api/v1/public/gallery/images` | 公开画廊图片分页列表（支持相机/镜头/标签筛选与按拍摄时间排序） |

## `/api/public/download/**`（Hono：`server/open/download.ts`）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/public/download/:id?storage=s3|r2` | 获取下载链接或直接返回附件流（受 direct_download 配置影响） |

## `/api/public/images/**`（Hono：`server/open/images.ts`）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/public/images/get-image-blob?imageUrl=...` | 代理获取图片 blob |
| GET | `/api/public/images/get-image-by-id?id=...` | 按图片 ID 获取公开图片信息 |

## RSS

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/rss.xml` | RSS feed（`app/rss.xml/route.ts`） |

## 详细说明（选摘）

### GET `/api/v1/public/about-info`

- **返回**：配置数组（`fetchConfigsByKeys([...])`），包含 `about_intro`、社交链接、`about_gallery_images_full` 等

### GET `/api/v1/public/site-info`

- **返回**：配置数组，包含 `custom_title`、`custom_author`、`custom_index_style`、下载/原图开关等

### GET `/api/v1/public/covers`

- **返回**：`fetchAlbumsShowWithCounts()` 的结果（用于封面页/列表页缓存）

### POST `/api/v1/public/visit-log`

- **请求体（JSON）**：`{ path?: string, pageType?: string }`（可空；服务端会 infer）
- **成功响应**：`{ ok: true }`
- **失败响应**：返回 HTTP 204 且 body `{ ok: false }`（避免影响前台体验）

### GET `/api/v1/public/gallery/images`

- **Query**：
  - `page`: number（默认 1）
  - `album`: string（默认 `'/'`）
  - `cameras`: string（CSV，例如 `Sony,A7M4`）
  - `lenses`: string（CSV）
  - `tags`: string（CSV）
  - `tagsOperator`: `'and' | 'or'`
  - `sortByShootTime`: `'asc' | 'desc'`
- **成功响应（200）**：
  - `{ page, pageSize: 16, pageTotal, items }`

### GET `/api/public/download/:id`

- **Query**：`storage=s3|r2`（必填）
- **行为**：
  - 当未开启 direct_download（例如 `s3_direct_download=false`）：服务端会抓取原 `imageUrl` 并以附件流返回（带 `Content-Disposition`）
  - 开启 direct_download：返回预签名 url 与 filename（JSON）

### GET `/api/public/images/get-image-blob`

- **Query**：`imageUrl`（必填）
- **返回**：`Response(blob)`

### GET `/api/public/images/get-image-by-id`

- **Query**：`id`（必填）
- **成功响应（200）**：`{ code: 200, message, data }`
- **失败**：500（图片不存在或未公开展示）

