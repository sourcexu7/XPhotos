# XPhotos API 参考

本文件合并了原有 `docs/api/` 下 11 个子文档的全部接口信息，统一为一份权威 API 参考文档。

---

## 一、总览与约定

### 1.1 路由前缀与入口

| 前缀 | 说明 |
|---|---|
| `/api` | 总前缀 |
| `/api/v1/**` | 版本化主接口（Hono：`server/index.ts`，聚合入口 `app/api/[[...route]]/route.ts`） |
| `/api/v1/public/**` | 版本化下的公开子接口（Hono：`server/public.ts`） |
| `/api/public/**` | 非版本化公开子接口（下载、图片代理） |
| `/admin/analytics/api` | 后台专用（Next Route Handler，不走 `/api`） |
| `/rss.xml` | RSS Feed |

### 1.2 鉴权机制

- **受保护接口范围**：`/api/v1/settings/**`、`/api/v1/file/**`、`/api/v1/images/**`、`/api/v1/albums/**`、`/api/v1/storage/**`、`/api/v1/analytics/**`、`/api/v1/guides/**`、`/api/v1/guide-modules/**`
- **公开接口范围**：`/api/v1/auth/**`、`/api/v1/public/**`、`/api/public/**`、`/rss.xml`
- **Token 来源**（`server/middleware/auth.ts` 的 `jwtAuth`）：
  - Header：`Authorization: Bearer <token>`
  - Cookie：`auth_token=<token>`
- **后台页面访问控制**：`middleware.ts` 对所有 `/admin/**` 页面做 cookie `auth_token` 校验，失败跳转 `/login`。

### 1.3 两种响应形态

项目中同时存在两种常见返回形态（历史兼容 + 新接口混用，本文档对每个接口标明其返回形态：

- **形态 A（Hono + code/data）**：`{ code: 200, data: ... }` 或 `{ code: 200, message: 'Success' }`
- **形态 B（直接 json）**：直接返回对象/数组
- **异常**：通常返回 `{ message: string }`，HTTP 状态码为 4xx/5xx（由 `HTTPException` 或 `server/index.ts` 的 `onError` 统一处理）

---

## 二、公开接口

### 2.1 `/api/v1/public/**`（Hono：`server/public.ts`）

**相关 UI 页面**：前台首页、画廊页、关于页、封面页等

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/v1/public/about-info` | 获取"关于我"页面展示配置 | 否 |
| GET | `/api/v1/public/site-info` | 获取站点基础信息（标题、作者、首页样式等） | 否 |
| GET | `/api/v1/public/covers` | 获取封面页数据（相册 + 公开图片数量） | 否 |
| POST | `/api/v1/public/visit-log` | 记录访问日志 | 否 |
| GET | `/api/v1/public/gallery/images` | 公开画廊图片分页列表 | 否 |

#### 详细说明

**GET `/api/v1/public/about-info`**

- 返回：配置数组（`fetchConfigsByKeys([...])`），包含 `about_intro`、社交链接、`about_gallery_images_full` 等。
- 形态 B：直接返回数组。

**GET `/api/v1/public/site-info`

- 返回：配置数组，包含 `custom_title`、`custom_author`、`custom_index_style`、下载/原图开关等。
- 形态 B：直接返回数组。

**GET `/api/v1/public/covers`

- 返回：`fetchAlbumsShowWithCounts()` 的结果。
- 形态 B。

**POST `/api/v1/public/visit-log`

- 请求体（JSON）：`{ path?: string, pageType?: string }`（可空；服务端会 infer）。
- 成功响应（200）：`{ ok: true }`。
- 失败响应：HTTP 204 + body `{ ok: false }`（避免影响前台体验）。

**GET `/api/v1/public/gallery/images`

- Query：
  - `page`: number（默认 1）
  - `album`: string（默认 `'/'`）
  - `cameras`: string（CSV，例如 `Sony,A7M4`）
  - `lenses`: string（CSV）
  - `tags`: string（CSV）
  - `tagsOperator`: `'and' | 'or'`
  - `sortByShootTime`: `'asc' | 'desc'`
- 成功响应（200）：`{ page, pageSize: 16, pageTotal, items }`

---

### 2.2 `/api/public/download/**`（Hono：`server/open/download.ts`）

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/public/download/:id?storage=s3\|r2` | 获取下载链接或直接返回附件流 | 否 |

#### 详细说明

**GET `/api/public/download/:id`

- Query：`storage=s3|r2`（必填）
- 行为：
  - 当未开启 direct_download（例如 `s3_direct_download=false`：服务端抓取原 `imageUrl` 并以附件流返回（带 `Content-Disposition`）
  - 开启 direct_download：返回预签名 url 与 filename（JSON）

---

### 2.3 `/api/public/images/**`（Hono：`server/open/images.ts`）

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/public/images/get-image-blob?imageUrl=...` | 代理获取图片 blob | 否 |
| GET | `/api/public/images/get-image-by-id?id=...` | 按图片 ID 获取公开图片信息 | 否 |

#### 详细说明

**GET `/api/public/images/get-image-blob`**

- Query：`imageUrl`（必填）
- 返回：`Response(blob)`

**GET `/api/public/images/get-image-by-id`**

- Query：`id`（必填）
- 成功响应（200）：`{ code: 200, message, data }`（形态 A）
- 失败：500（图片不存在或未公开展示）

---

### 2.4 RSS

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/rss.xml` | RSS feed（`app/rss.xml/route.ts`） | 否 |

---

## 三、受保护接口（按资源分组）

### 3.1 auth（认证相关）

**路由实现**：`server/auth.ts`（挂载到 `/api/v1/auth`
**相关 UI 页面**：`/login`、`/admin/settings` 后台设置页

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/api/v1/auth/login` | 用户登录（邮箱或用户名 + 密码），设置 cookie `auth_token` | 否 |
| POST | `/api/v1/auth/logout` | 退出登录（清除 cookie `auth_token`） | 否 |
| GET | `/api/v1/auth/me` | 获取当前用户信息 | 是 |
| POST | `/api/v1/auth/change-password` | 修改密码 | 是 |
| POST | `/api/v1/auth/update-user` | 更新用户信息（当前仅头像 `image`） | 是 |

#### 详细说明

**POST `/api/v1/auth/login`**

- 请求体（JSON）：
  - `email?: string`
  - `username?: string`
  - `password: string`
- 行为：
  - 支持用 `email` 或 `username` 登录（服务端先按 email 查，找不到再按 name 查）
  - 登录成功会 `Set-Cookie: auth_token=<jwt>`（httpOnly、sameSite=Lax、maxAge=7d、path=/）
- 成功响应（200）：`{ user: { id, email, name, image }, token: string }`
- 失败响应：
  - 400：缺少 identifier 或 password
  - 401：用户不存在 / 密码错误 / 用户不支持密码登录

**POST `/api/v1/auth/logout`**

- 行为：清除 cookie `auth_token`
- 成功响应（200）：`{ message: "Logged out successfully" }`

**GET `/api/v1/auth/me`**

- 成功响应（200）：`{ user: <jwtPayload> }`

**POST `/api/v1/auth/change-password`**

- 请求体（JSON）：`{ currentPassword: string, newPassword: string }`
- 校验：`newPassword.length >= 8`
- 成功响应（200）：`{ message: "Password updated successfully" }`
- 失败响应：
  - 400：参数缺失 / 新密码过短 / 找不到密码账号
  - 401：当前密码不正确
  - 404：用户不存在

**POST `/api/v1/auth/update-user`**

- 请求体（JSON）：`{ image?: string }`
- 成功响应（200）：`{ message: "User updated successfully" }`

---

### 3.2 albums（相册管理）

**路由实现**：`server/albums.ts`（挂载到 `/api/v1/albums`）
**相关 UI 页面**：`/admin/album`、`/admin/list`

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/v1/albums/get` | 获取相册列表 | 是 |
| POST | `/api/v1/albums/add` | 新增相册（校验路由必须以 `/` 开头） | 是 |
| PUT | `/api/v1/albums/update` | 更新相册 | 是 |
| DELETE | `/api/v1/albums/delete/:id` | 删除相册 | 是 |
| PUT | `/api/v1/albums/update-show` | 更新相册展示状态 | 是 |
| PUT | `/api/v1/albums/update-sort` | 更新相册排序 | 是 |

#### 详细说明

**GET `/api/v1/albums/get`**

- 成功响应：直接 `return c.json(data)`（形态 B，结构取决于 `fetchAlbumsList()`

**POST `/api/v1/albums/add`**

- 请求体（JSON）：相册对象（至少包含 `album_value`）
- 校验：`album_value` 必须以 `/` 开头
- 成功响应（200）：`{ code: 200, message: "Success" }`（形态 A）

**PUT `/api/v1/albums/update`**

- 请求体（JSON）：相册对象（至少包含 `album_value`）
- 校验：`album_value` 必须以 `/` 开头
- 成功响应（200）：`{ code: 200, message: "Success" }`

**DELETE `/api/v1/albums/delete/:id`**

- 路径参数：`id: string`
- 成功响应：直接 `return c.json(data)`（形态 B）

**PUT `/api/v1/albums/update-show`**

- 请求体（JSON）：至少包含 `id` 与 `show`
- 成功响应：直接 `return c.json(data)`（形态 B）

**PUT `/api/v1/albums/update-sort`**

- 请求体（JSON）：`{ orderedIds: string[] }`
- 成功响应（200）：`{ code: 200, message: "Success" }`
- 失败响应：400：`orderedIds` 不是字符串数组

---

### 3.3 analytics（统计）

**路由实现**：`server/analytics.ts`（挂载到 `/api/v1/analytics`）
**相关 UI 页面**：`/admin/analytics`

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/v1/analytics/` | 获取访问统计汇总 | 是 |

另有一个 Next Route Handler（不经 `/api`）：`GET /admin/analytics/api`（`app/admin/analytics/api/route.ts`），返回同一份 `getVisitAnalytics()` 数据。

#### 详细说明

**GET `/api/v1/analytics/`**

- 成功响应：直接 `return c.json(data)`（形态 B）
- 失败响应：500 `{ message: "Failed to fetch visit analytics" }`

---

### 3.4 file（文件/上传）

**路由实现**：`server/file.ts`（挂载到 `/api/v1/file`）
**相关 UI 页面**：`/admin/upload`、图片批量上传页

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/api/v1/file/presigned-url` | 获取对象存储预签名上传 URL（支持 r2/s3/cos） | 是 |
| POST | `/api/v1/file/upload` | 服务端代传（multipart formData，支持 alist/s3/cos） | 是 |
| POST | `/api/v1/file/getObjectUrl` | 获取对象访问 URL（直链或预签名 GET） | 是 |
| POST | `/api/v1/file/delete` | 删除对象存储中的对象（s3/r2/cos） | 是 |

#### 详细说明

**POST `/api/v1/file/presigned-url`**

- 请求体（JSON）：
  - `filename: string`
  - `contentType?: string`
  - `type?: string`（默认 `'/'`，用于拼接路径前缀）
  - `storage: 'r2' | 's3' | 'cos'`
- 成功响应（200）：`{ code: 200, data: { presignedUrl: string, key: string } }`（形态 A）
- 特殊响应：当 `storage='s3'` 且配置 `s3_force_server_upload=true`：返回 `{ code: 286, data: { serverUpload: true } }`，提示前端走服务端代传 `/upload`
- 失败响应：
  - 400：缺参数 / 配置缺失 / 不支持的 storage
  - 500：生成预签名失败

**POST `/api/v1/file/upload`**

- 请求体：`multipart/form-data`
  - `file: Blob`
  - `storage: 'alist' | 's3' | 'cos'`
  - `type?: string`
  - `mountPath?: string`（alist 使用）
- 成功响应（200）：
  - alist：`{ code: 200, data: <alistUploadResult> }`
  - s3/cos：`{ code: 200, data: { url: string, imageId: string, fileName: string, key: string } }`
- 失败响应：
  - 400：storage 缺失 / s3\|cos 缺 file / 配置缺失
  - 500：上传失败

**POST `/api/v1/file/getObjectUrl`**

- 请求体（JSON）：`{ storage: 's3' | 'cos' | 'r2', key: string }`
- 成功响应（200）：`{ code: 200, data: string }`（直链或预签名 GET URL
- 行为：
  - s3/cos 会根据 `*_direct_download` 决定返回"直链"还是"预签名 GET"
  - r2 直接用 `r2_public_domain` 拼接 `domain/key`

**POST `/api/v1/file/delete`**

- 请求体（JSON）：`{ storage: 's3' | 'r2' | 'cos', key: string }`
- 成功响应（200）：`{ code: 200, message: "deleted" }`
- 失败响应：
  - 400：缺参数 / bucket 未配置 / 不支持的 storage
  - 500：删除失败

---

### 3.5 guides（攻略系统：顶层攻略 + 模块/内容/目录）

> 本章节合并了 `v1-guides` 与 `v1-guide-modules` 两套前缀。
**路由实现**：
- 顶层攻略：`server/guides.ts`（挂载到 `/api/v1/guides`）
- 模块/内容/目录：`server/guide-modules.ts`（挂载到 `/api/v1/guide-modules`）
**相关 UI 页面**：`/admin/guides`（攻略管理页

#### 3.5.1 顶层攻略 CRUD 与关联

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/v1/guides/list` | 获取所有攻略列表（含组件信息） | 是 |
| GET | `/api/v1/guides/:id` | 获取单篇攻略详情（含组件、关联相册） | 是 |
| POST | `/api/v1/guides/` | 创建攻略 | 是 |
| DELETE | `/api/v1/guides/:id` | 删除攻略（软删除 `del=1`） | 是 |
| PUT | `/api/v1/guides/:id` | 更新攻略 | 是 |
| POST | `/api/v1/guides/:id/components` | 为攻略新增组件 | 是 |
| PUT | `/api/v1/guides/:guideId/components/:componentId` | 更新组件 | 是 |
| DELETE | `/api/v1/guides/:guideId/components/:componentId` | 删除组件 | 是 |
| POST | `/api/v1/guides/:id/albums` | 为攻略关联相册 | 是 |
| PUT | `/api/v1/guides/:id/albums` | 批量替换关联相册 | 是 |
| DELETE | `/api/v1/guides/:id/albums/:albumId` | 取消某本相册的关联 | 是 |
| PUT | `/api/v1/guides/batch-sort` | 批量更新攻略排序 | 是 |
| POST | `/api/v1/guides/reset-sort` | 重置攻略排序 | 是 |
| GET | `/api/v1/guides/public/list` | 获取公开（`show=1`）攻略列表 | 否 |
| GET | `/api/v1/guides/public/:id` | 获取单篇公开攻略详情 | 否 |

#### 详细说明（顶层攻略）

**GET `/api/v1/guides/list`**

- 成功响应（200）：`{ data: Guide[] }`
- 组件封面中的原图 URL 会被替换为预览图 URL

**GET `/api/v1/guides/:id`**

- 成功响应（200）：`{ data: <guide> }`
- 失败响应：404（未找到），其他错误 500

**POST `/api/v1/guides/`**

- 请求体（JSON）：
  - `title: string`
  - `country?: string`
  - `city?: string`
  - `days?: number`
  - `start_date?: string` (ISO)
  - `end_date?: string` (ISO)
  - `cover_image?: string`
  - `content?: string`
  - `show?: number`（默认 1）
  - `sort?: number`
- 成功响应（200）：`{ data: guide }`
- 失败响应：500 `{ error }`

**DELETE `/api/v1/guides/:id`**

- 行为：`del = 1`（软删除）
- 成功响应（200）：`{ message: 'Guide deleted successfully' }`

**PUT `/api/v1/guides/:id`**

- 请求体（JSON）：同 POST 创建
- 成功响应（200）：`{ data: <guide> }`

**POST `/api/v1/guides/:id/components`**

- 请求体（JSON）：`{ type: string, content: any, sort?: number }`
- 成功响应（200）：`{ data: component }`

**PUT `/api/v1/guides/:guideId/components/:componentId`**

- 请求体（JSON）：`{ type, content, sort }`
- 成功响应（200）：`{ data: component }`

**DELETE `/api/v1/guides/:guideId/components/:componentId`**

- 成功响应（200）：`{ message: 'Component deleted successfully' }`

**POST `/api/v1/guides/:id/albums`**

- 请求体（JSON）：`{ album_id: string }`
- 成功响应（200）：`{ data: <relation> }`

**PUT `/api/v1/guides/:id/albums`**

- 请求体（JSON）：`{ album_ids: string[] }`
- 行为：删除原有全部关联后重建
- 成功响应（200）：`{ message: 'Albums updated successfully' }`

**DELETE `/api/v1/guides/:id/albums/:albumId`**

- 成功响应（200）：`{ message: 'Album association removed successfully' }`

**PUT `/api/v1/guides/batch-sort`**

- 请求体（JSON）：`{ sorts: Array<{ id: string, sort: number }> }`
- 行为：过滤出合法的 id 后事务性更新 sort
- 成功响应（200）：`{ message: 'Sort updated successfully' }`
- 失败响应：400 `{ error: 'Invalid request body' }`，500 其它错误

**POST `/api/v1/guides/reset-sort`**

- 行为：按创建时间（desc）重新分配连续 sort 值
- 成功响应（200）：`{ message: 'Sort reset successfully' }`

**GET `/api/v1/guides/public/list`**

- 返回：仅 `del=0 && show=1` 的攻略
- 成功响应（200）：`{ data: Guide[] }`（替换封面为预览图 URL）

**GET `/api/v1/guides/public/:id`**

- 返回：含 `components / modules / albums`；封面与相册封面替换为预览图 URL
- 失败响应：404

---

#### 3.5.2 模块 CRUD

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/v1/guide-modules/module/:guideId` | 获取某篇攻略的所有模块（含 contents） | 是 |
| POST | `/api/v1/guide-modules/module` | 创建模块 | 是 |
| PUT | `/api/v1/guide-modules/module/sort` | 调整模块顺序（批量重排） | 是 |
| PUT | `/api/v1/guide-modules/module/:id` | 更新模块（名称、模板、显隐） | 是 |
| DELETE | `/api/v1/guide-modules/module/:id` | 删除模块 | 是 |

#### 详细说明（模块）

**GET `/api/v1/guide-modules/module/:guideId`**

- 成功响应（200）：`{ data: Module[] }`
- 特殊模板：`itinerary`、`expense`、`checklist`、`transport`、`photo`、`tips` 等会额外从 contents 中读取 `type='module_data'` 的内容，注入 `moduleData`

**POST `/api/v1/guide-modules/module`**

- 请求体（JSON）：`{ guide_id, name, template?, is_hidden? }`
- 行为：自动取当前最大 sort 值 + 1
- 成功响应（200）：`{ data: module }`

**PUT `/api/v1/guide-modules/module/sort`**

- 请求体（JSON）：`{ module_ids: string[] }`
- 行为：按数组顺序从 0 起重新排序

**PUT `/api/v1/guide-modules/module/:id`**

- 请求体（JSON）：`{ name, template, is_hidden }`

**DELETE `/api/v1/guide-modules/module/:id`**

- 成功响应（200）：`{ message: 'Module deleted successfully' }`

---

#### 3.5.3 内容 CRUD

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/v1/guide-modules/content/:moduleId` | 获取模块的全部内容 | 是 |
| GET | `/api/v1/guide-modules/module-data/:moduleId` | 获取模块专用数据（type=module_data） | 是 |
| PUT | `/api/v1/guide-modules/module-data/:moduleId` | 保存模块专用数据（存在则更新，不存在则创建） | 是 |
| POST | `/api/v1/guide-modules/content` | 新增模块内容 | 是 |
| PUT | `/api/v1/guide-modules/content/:id` | 更新模块内容 | 是 |
| DELETE | `/api/v1/guide-modules/content/:id` | 删除模块内容 | 是 |
| PUT | `/api/v1/guide-modules/content/sort` | 调整内容顺序（批量重排） | 是 |

#### 详细说明（内容）

**GET `/api/v1/guide-modules/content/:moduleId`**

- 成功响应（200）：`{ data: GuideModuleContent[] }`

**GET `/api/v1/guide-modules/module-data/:moduleId`**

- 成功响应（200）：`{ data: content | null }`
- 行为：返回 `type='module_data'` 的内容（特殊模板数据载体）

**PUT `/api/v1/guide-modules/module-data/:moduleId`**

- 请求体（JSON）：`{ data: any }`
- 行为：若已存在同 module_id 且 type = module_data 的内容则更新，否则创建新记录

**POST `/api/v1/guide-modules/content`**

- 请求体（JSON）：`{ module_id, type, content?, sort? }`

**PUT `/api/v1/guide-modules/content/:id`**

- 请求体（JSON）：`{ type, content }`

**DELETE `/api/v1/guide-modules/content/:id`**

- 成功响应（200）：`{ message: 'Content deleted successfully' }`

**PUT `/api/v1/guide-modules/content/sort`**

- 请求体（JSON）：`{ content_ids: string[] }`

---

#### 3.5.4 目录 CRUD（Table of Contents）

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/v1/guide-modules/toc/:guideId` | 获取攻略的目录 | 是 |
| POST | `/api/v1/guide-modules/toc` | 新增目录项 | 是 |
| PUT | `/api/v1/guide-modules/toc/:id` | 更新目录项 | 是 |
| DELETE | `/api/v1/guide-modules/toc/:id` | 删除目录项 | 是 |
| PUT | `/api/v1/guide-modules/toc/sort` | 调整目录顺序 | 是 |
| POST | `/api/v1/guide-modules/toc/auto-generate` | 根据模块自动生成目录 | 是 |

#### 详细说明（目录）

**GET `/api/v1/guide-modules/toc/:guideId`**

- 成功响应（200）：`{ data: TocItem[] }`

**POST `/api/v1/guide-modules/toc`**

- 请求体（JSON）：`{ guide_id, title, level?, target_id?, target_type?, is_hidden? }`

**PUT `/api/v1/guide-modules/toc/:id`**

- 请求体（JSON）：`{ title, level, target_id, target_type, is_hidden }`

**DELETE `/api/v1/guide-modules/toc/:id`**

- 成功响应（200）：`{ message: 'TOC item deleted successfully' }`

**PUT `/api/v1/guide-modules/toc/sort`**

- 请求体（JSON）：`{ toc_ids: string[] }`

**POST `/api/v1/guide-modules/toc/auto-generate`**

- 请求体（JSON）：`{ guide_id: string }`
- 行为：删除旧目录，根据 guide 的模块（is_hidden=false）按 sort 顺序自动生成 title=module.name、level=1、target_id=module.id、target_type='module' 的目录项

---

### 3.6 images（图片管理）

**路由实现**：`server/images.ts`（挂载到 `/api/v1/images`）
**相关 UI 页面**：`/admin/gallery`、`/admin/images`、`/admin/upload`

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/api/v1/images/add` | 新增图片（入库前校验对象存储是否存在） | 是 |
| POST | `/api/v1/images/check-duplicate` | 检测重复图片（blurhash 或 url） | 是 |
| DELETE | `/api/v1/images/batch-delete` | 批量删除图片 | 是 |
| DELETE | `/api/v1/images/delete/:id` | 删除单张图片 | 是 |
| PUT | `/api/v1/images/update` | 更新图片（全量/部分字段） | 是 |
| PUT | `/api/v1/images/update-show` | 更新展示状态（公开/隐藏） | 是 |
| PUT | `/api/v1/images/update-featured` | 更新精选状态 | 是 |
| PUT | `/api/v1/images/update-Album` | 修改图片所属相册（注意路径大小写 `update-Album`） | 是 |
| PUT | `/api/v1/images/update-sort` | 批量更新排序 | 是 |
| GET | `/api/v1/images/camera-lens-list` | 返回相机/镜头列表（Next Route Handler） | 视部署而定 |

#### 详细说明

**POST `/api/v1/images/add`**

- 请求体（JSON）：`ImageType`（以 `~/types` 为准），并支持 `client_image_id?: string`
- 关键校验：
  - `url` 必填
  - `width`/`height` 必须大于 0
  - `album` 必填
  - `client_image_id` 必填（作为图片 id）
  - `image_name` 必填
  - 入库前会对 `url/preview_url/video_url` 做对象存在性校验（S3/COS HeadObject，带重试）
- 成功响应（200）：`{ code: 200, data: <insertImage返回> }`
- 失败响应：
  - 400：参数不合法 / 对象不存在
  - 500：入库失败

**POST `/api/v1/images/check-duplicate`**

- 请求体（JSON）：`{ blurhash?: string, url?: string }`
- 成功响应（200）：`{ code: 200, data: { duplicate: boolean, id?: string } }`

**DELETE `/api/v1/images/batch-delete`**

- 请求体（JSON）：两种形态二选一
  - 直接数组：`["id1","id2"]`
  - 对象：`{ ids: ["id1","id2"] }`
- 成功响应（200）：`{ code: 200, message: "Success" }`

**DELETE `/api/v1/images/delete/:id`**

- 路径参数：`id: string`
- 成功响应（200）：`{ code: 200, message: "Success" }`

**PUT `/api/v1/images/update`**

- 请求体（JSON）：`ImageType`
- 成功响应（200）：`{ code: 200, message: "Success" }`

**PUT `/api/v1/images/update-show`**

- 请求体（JSON）：`{ id: string, show: number }`
- 成功响应：直接 `return c.json(data)`（形态 B，取决于 `updateImageShow` 返回）

**PUT `/api/v1/images/update-featured`**

- 请求体（JSON）：`{ id?: string, imageId?: string, featured: number }`
- 成功响应（200）：`{ code: 200, data: <updateImageFeatured返回> }`

**PUT `/api/v1/images/update-Album`**

- 请求体（JSON）：`{ imageId: string, albumId: string }`
- 成功响应（200）：`{ code: 200, message: "Success" }`

**PUT `/api/v1/images/update-sort`**

- 请求体（JSON）：`{ orders: Array<{ id: string, sort: number }> }`
- 成功响应（200）：`{ code: 200, message: "Success" }`
- 失败响应：400：`orders` 结构不合法

**GET `/api/v1/images/camera-lens-list`**

- 实现：`app/api/v1/images/camera-lens-list/route.ts`（Next Route Handler）
- 返回：`{ cameras: string[], lenses: string[] }`

---

### 3.7 settings + storage（系统设置与存储）

> 本章节合并了 `v1-settings` 与 `v1-storage` 两套前缀。
**路由实现**：
- settings：`server/settings.ts`（挂载到 `/api/v1/settings`）
- storage：`server/storage/alist.ts`（挂载到 `/api/v1/storage/alist`）
**相关 UI 页面**：`/admin/settings`（设置页面）

#### 3.7.1 Tags（标签）

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/v1/settings/tags/get` | 获取标签列表/树 | 是 |
| POST | `/api/v1/settings/tags/add` | 新增标签 | 是 |
| PUT | `/api/v1/settings/tags/update/:id` | 更新标签 | 是 |
| POST | `/api/v1/settings/tags/move` | 移动标签（带合法性校验 + 同步图片标签） | 是 |
| POST | `/api/v1/settings/tags/check-completeness` | 历史图片标签补全检查/修复 | 是 |
| DELETE | `/api/v1/settings/tags/delete/:id` | 删除标签 | 是 |
| DELETE | `/api/v1/settings/tags/delete-with-children/:id` | 事务删除父标签及其子标签 | 是 |

**GET `/api/v1/settings/tags/get`**

- Query：
  - `tree=true`：返回树结构（`fetchTagsTree()`）
  - `parent=<string>`：按分类/父级返回（`fetchTagsByCategory()`）
  - 无参数：返回列表（`fetchTagsList()`）
- 成功响应（200）：`{ code: 200, data: ... }`

**POST `/api/v1/settings/tags/add`**

- 请求体（JSON）：由 `createTag(payload)` 决定（payload 可能包含 `parentName` 等兼容字段）
- 成功响应（200）：`{ code: 200, data: <createTag返回> }`

**PUT `/api/v1/settings/tags/update/:id`**

- 路径参数：`id: string`
- 请求体（JSON）：更新字段集合（由 `updateTag(id,payload)` 决定）
- 成功响应（200）：`{ code: 200, data: <updateTag返回> }`

**POST `/api/v1/settings/tags/move`**

- 请求体（JSON）：`{ tagId: string, targetParentId?: string | null }`
- 成功响应（200）：`{ code: 200, data: <tag>, message: "移动成功" }`
- 失败响应：400：`tagId` 缺失 / 移动验证失败

**POST `/api/v1/settings/tags/check-completeness`**

- 请求体（JSON）：`{ batchSize?: number }`（默认 100）
- 成功响应（200）：`{ code: 200, data: <result> }`

**DELETE `/api/v1/settings/tags/delete/:id`**

- 路径参数：`id: string`
- 成功响应（200）：`{ code: 200, message: "Success" }`

**DELETE `/api/v1/settings/tags/delete-with-children/:id`**

- 路径参数：`id: string`
- 成功响应（200）：`{ code: 200, message: "Success" }`

---

#### 3.7.2 站点自定义信息

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/v1/settings/get-custom-info` | 获取后台设置所需的自定义配置（含关于我等） | 是 |
| PUT | `/api/v1/settings/update-custom-info` | 更新自定义配置（标题、作者、RSS、首页样式、关于我等） | 是 |
| GET | `/api/v1/settings/get-admin-config` | 获取后台配置（如每页图片数） | 是 |

**GET `/api/v1/settings/get-custom-info`**

- 成功响应（200）：直接返回配置数组（`fetchConfigsByKeys([...])`），无 `{code,data}` 包装（形态 B）

**PUT `/api/v1/settings/update-custom-info`**

- 请求体（JSON）：`server/settings.ts` 中 `satisfies { ... }` 的字段集合（标题/作者/RSS/首页开关/关于我等）
- 成功响应（200）：`{ code: 200, message: "Success" }`

---

#### 3.7.3 存储配置读取

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/v1/settings/alist-info` | 读取 AList 配置（url/token） | 是 |
| GET | `/api/v1/settings/r2-info` | 读取 R2 配置 | 是 |
| GET | `/api/v1/settings/s3-info` | 读取 S3 配置 | 是 |
| GET | `/api/v1/settings/cos-info` | 读取 COS 配置 | 是 |
| GET | `/api/v1/storage/alist/info` | 获取 AList 配置（url/token）— storage 前缀别名 | 是 |

---

#### 3.7.4 存储配置写入

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| PUT | `/api/v1/settings/update-alist-info` | 更新 AList 配置 | 是 |
| PUT | `/api/v1/settings/update-r2-info` | 更新 R2 配置 | 是 |
| PUT | `/api/v1/settings/update-s3-info` | 更新 S3 配置 | 是 |
| PUT | `/api/v1/settings/update-cos-info` | 更新 COS 配置 | 是 |

**PUT `/api/v1/settings/update-*-info`**

- 请求体（JSON）：当前实现期望 **Config 数组**（形如 `[{ config_key, config_value }, ...]`），服务端通过 `find(...).config_value` 取值
- 成功响应：直接 `return c.json(data)`（由 `update*Config(...)` 的实现决定，形态 B）

---

#### 3.7.5 存储连通性验证

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/v1/settings/validate-s3` | 轻量验证 S3 桶可读写删（Head/Put/Get/Delete） | 是 |
| GET | `/api/v1/settings/validate-cos` | 轻量验证 COS 桶可读写删 | 是 |

- 行为：对桶做 `HeadBucket`、`PutObject`、`GetObject`、`DeleteObject` 轻量校验，返回每一步 `checks`
- 成功响应（200）：`{ code: 200, data: { bucket, endpoint, testKey, checks } }`

---

#### 3.7.6 AList 存储转发

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| GET | `/api/v1/storage/alist/storages` | 请求 AList 管理 API 获取存储列表（转发） | 是 |

**GET `/api/v1/storage/alist/storages`**

- 行为：读取 `alist_url`/`alist_token` 后，请求 `${alistUrl}/api/admin/storage/list` 并原样 `return c.json(data)`
- 注意：该接口等同于一个"后端转发"，AList 的返回结构不由本项目控制

---

## 四、特殊说明与注意事项

### 4.1 分页

- 画廊列表：`page`（默认 1），`pageSize`（画廊固定 16），返回 `{ page, pageSize, pageTotal, items }`
- 其他列表接口通常不使用分页，直接返回完整数组。

### 4.2 排序

#### albums 排序

- `PUT /api/v1/albums/update-sort`：body `{ orderedIds: string[] }`，按数组顺序重新排序

#### images 排序

- `PUT /api/v1/images/update-sort`：body `{ orders: [{ id, sort }]`，批量指定每张图片的 sort 值

#### guides 排序

- `PUT /api/v1/guides/batch-sort`：body `{ sorts: [{ id, sort }]`
- `POST /api/v1/guides/reset-sort`：按创建时间 desc 重新连续编号
- `PUT /api/v1/guide-modules/module/sort`：body `{ module_ids: string[] }`
- `PUT /api/v1/guide-modules/content/sort`：body `{ content_ids: string[] }`
- `PUT /api/v1/guide-modules/toc/sort`：body `{ toc_ids: string[] }`

#### 画廊公开接口排序

- `GET /api/v1/public/gallery/images`：`sortByShootTime=asc|desc`（按拍摄时间）

### 4.3 缓存

- 封面页数据（`/api/v1/public/covers`）依赖 `fetchAlbumsShowWithCounts()`，通常配合服务端缓存策略

### 4.4 错误码清单

| HTTP 状态码 | 常见场景 |
|---|---|
| 200 | 成功 |
| 204 | 记录访问日志失败（不影响前台） |
| 286 | S3 预签名接口提示前端走服务端代传 |
| 400 | 参数缺失 / 参数不合法 / 结构不合法 |
| 401 | 鉴权失败 / 当前密码不正确 |
| 404 | 资源未找到 / 用户不存在 |
| 500 | 服务端内部错误（入库失败、上传失败、删除失败、查询失败等） |

---

## 来源文档清单

本文件合并了以下 11 份原始 API 子文档的信息：

1. `docs/api/README.md`
2. `docs/api/public.md`
3. `docs/api/v1-albums.md`
4. `docs/api/v1-analytics.md`
5. `docs/api/v1-auth.md`
6. `docs/api/v1-file.md`
7. `docs/api/v1-guides.md`
8. `docs/api/v1-guide-modules.md`
9. `docs/api/v1-images.md`
10. `docs/api/v1-settings.md`
11. `docs/api/v1-storage.md`
