# `/api/v1/images/**`（图片管理，受保护）

路由实现：`server/images.ts`（通过 `server/index.ts` 挂载到 `/api/v1/images`，并对 `/images/*` 使用 `jwtAuth`）

另有一个 Next Route Handler（不经 Hono 聚合）：

- `GET /api/v1/images/camera-lens-list`（`app/api/v1/images/camera-lens-list/route.ts`）

## 接口列表（Hono）

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/v1/images/add` | 是 | 新增图片（入库前校验对象存储是否存在） |
| POST | `/api/v1/images/check-duplicate` | 是 | 检测重复图片（blurhash 或 url） |
| DELETE | `/api/v1/images/batch-delete` | 是 | 批量删除图片（body: `ids` 或直接数组） |
| DELETE | `/api/v1/images/delete/:id` | 是 | 删除单张图片 |
| PUT | `/api/v1/images/update` | 是 | 更新图片（全量/部分字段，按实现要求） |
| PUT | `/api/v1/images/update-show` | 是 | 更新展示状态（公开/隐藏） |
| PUT | `/api/v1/images/update-featured` | 是 | 更新精选状态 |
| PUT | `/api/v1/images/update-Album` | 是 | 修改图片所属相册（注意路径大小写 `update-Album`） |
| PUT | `/api/v1/images/update-sort` | 是 | 批量更新排序（body: `orders: [{id, sort}]`） |

## 详细说明（Hono）

### POST `/api/v1/images/add`

- **鉴权**：是（`jwtAuth`）
- **请求体（JSON）**：`ImageType`（以 `~/types` 为准），并支持 `client_image_id?: string`
- **关键校验**：
  - `url` 必填
  - `width`/`height` 必须大于 0
  - `album` 必填
  - `client_image_id` 必填（作为图片 id）
  - `image_name` 必填
  - 入库前会对 `url/preview_url/video_url` 做对象存在性校验（S3/COS HeadObject，带重试）
- **成功响应（200）**：`{ code: 200, data: <insertImage返回> }`
- **失败响应**：
  - 400：参数不合法 / 对象不存在
  - 500：入库失败

### POST `/api/v1/images/check-duplicate`

- **鉴权**：是
- **请求体（JSON）**：`{ blurhash?: string, url?: string }`
- **成功响应（200）**：
  - `{ code: 200, data: { duplicate: boolean, id?: string } }`

### DELETE `/api/v1/images/batch-delete`

- **鉴权**：是
- **请求体（JSON）**：两种形态二选一
  - 直接数组：`["id1","id2"]`
  - 对象：`{ ids: ["id1","id2"] }`
- **成功响应（200）**：`{ code: 200, message: "Success" }`

### DELETE `/api/v1/images/delete/:id`

- **鉴权**：是
- **路径参数**：`id: string`
- **成功响应（200）**：`{ code: 200, message: "Success" }`

### PUT `/api/v1/images/update`

- **鉴权**：是
- **请求体（JSON）**：`ImageType`
- **成功响应（200）**：`{ code: 200, message: "Success" }`

### PUT `/api/v1/images/update-show`

- **鉴权**：是
- **请求体（JSON）**：`{ id: string, show: number }`
- **成功响应**：实现直接 `return c.json(data)`（形态取决于 `updateImageShow` 返回）

### PUT `/api/v1/images/update-featured`

- **鉴权**：是
- **请求体（JSON）**：`{ id?: string, imageId?: string, featured: number }`
- **成功响应（200）**：`{ code: 200, data: <updateImageFeatured返回> }`

### PUT `/api/v1/images/update-Album`

- **鉴权**：是
- **请求体（JSON）**：`{ imageId: string, albumId: string }`
- **成功响应（200）**：`{ code: 200, message: "Success" }`

### PUT `/api/v1/images/update-sort`

- **鉴权**：是
- **请求体（JSON）**：`{ orders: Array<{ id: string, sort: number }> }`
- **成功响应（200）**：`{ code: 200, message: "Success" }`
- **失败响应**：
  - 400：`orders` 结构不合法

## `GET /api/v1/images/camera-lens-list`（公开/受保护取决于部署路由匹配）

实现：`app/api/v1/images/camera-lens-list/route.ts`

返回：`{ cameras: string[], lenses: string[] }`

