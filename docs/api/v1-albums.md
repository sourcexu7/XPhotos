# `/api/v1/albums/**`（相册管理，受保护）

路由实现：`server/albums.ts`（通过 `server/index.ts` 挂载到 `/api/v1/albums`，并对 `/albums/*` 使用 `jwtAuth`）

## 接口列表

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/v1/albums/get` | 是 | 获取相册列表 |
| POST | `/api/v1/albums/add` | 是 | 新增相册（校验路由必须以 `/` 开头） |
| PUT | `/api/v1/albums/update` | 是 | 更新相册 |
| DELETE | `/api/v1/albums/delete/:id` | 是 | 删除相册 |
| PUT | `/api/v1/albums/update-show` | 是 | 更新相册展示状态 |
| PUT | `/api/v1/albums/update-sort` | 是 | 更新相册排序（body: `orderedIds: string[]`） |

## 详细说明

### GET `/api/v1/albums/get`

- **鉴权**：是
- **成功响应**：实现直接 `return c.json(data)`（返回结构取决于 `fetchAlbumsList()`）

### POST `/api/v1/albums/add`

- **鉴权**：是
- **请求体（JSON）**：相册对象（至少包含 `album_value`）
- **校验**：`album_value` 必须以 `/` 开头
- **成功响应（200）**：`{ code: 200, message: "Success" }`

### PUT `/api/v1/albums/update`

- **鉴权**：是
- **请求体（JSON）**：相册对象（至少包含 `album_value`）
- **校验**：`album_value` 必须以 `/` 开头
- **成功响应（200）**：`{ code: 200, message: "Success" }`

### DELETE `/api/v1/albums/delete/:id`

- **鉴权**：是
- **路径参数**：`id: string`
- **成功响应**：实现直接 `return c.json(data)`（返回结构取决于 `deleteAlbum()`）

### PUT `/api/v1/albums/update-show`

- **鉴权**：是
- **请求体（JSON）**：至少包含 `id` 与 `show`
- **成功响应**：实现直接 `return c.json(data)`（返回结构取决于 `updateAlbumShow()`）

### PUT `/api/v1/albums/update-sort`

- **鉴权**：是
- **请求体（JSON）**：`{ orderedIds: string[] }`
- **成功响应（200）**：`{ code: 200, message: "Success" }`
- **失败响应**：
  - 400：`orderedIds` 不是字符串数组

