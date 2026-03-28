# `/api/v1/settings/**`（站点配置、标签、存储配置，受保护）

路由实现：`server/settings.ts`（通过 `server/index.ts` 挂载到 `/api/v1/settings`，并对 `/settings/*` 使用 `jwtAuth`）

## Tags（标签）

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/v1/settings/tags/get` | 是 | 获取标签列表/树（query: `tree=true`）或按分类（query: `parent=...`） |
| POST | `/api/v1/settings/tags/add` | 是 | 新增标签 |
| PUT | `/api/v1/settings/tags/update/:id` | 是 | 更新标签 |
| POST | `/api/v1/settings/tags/move` | 是 | 移动标签（带合法性校验 + 同步图片标签） |
| POST | `/api/v1/settings/tags/check-completeness` | 是 | 历史图片标签补全检查/修复（body: `batchSize`） |
| DELETE | `/api/v1/settings/tags/delete/:id` | 是 | 删除标签 |
| DELETE | `/api/v1/settings/tags/delete-with-children/:id` | 是 | 事务删除父标签及其子标签 |

## 站点自定义信息（前台展示/后台设置）

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/v1/settings/get-custom-info` | 是 | 获取后台设置所需的自定义配置（含关于我等） |
| PUT | `/api/v1/settings/update-custom-info` | 是 | 更新自定义配置（标题、作者、RSS、首页样式、关于我等） |
| GET | `/api/v1/settings/get-admin-config` | 是 | 获取后台配置（如每页图片数） |

## 存储配置读取

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/v1/settings/alist-info` | 是 | 读取 AList 配置（url/token） |
| GET | `/api/v1/settings/r2-info` | 是 | 读取 R2 配置 |
| GET | `/api/v1/settings/s3-info` | 是 | 读取 S3 配置 |
| GET | `/api/v1/settings/cos-info` | 是 | 读取 COS 配置 |

## 存储配置写入

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| PUT | `/api/v1/settings/update-alist-info` | 是 | 更新 AList 配置 |
| PUT | `/api/v1/settings/update-r2-info` | 是 | 更新 R2 配置 |
| PUT | `/api/v1/settings/update-s3-info` | 是 | 更新 S3 配置 |
| PUT | `/api/v1/settings/update-cos-info` | 是 | 更新 COS 配置 |

## 存储连通性验证

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/v1/settings/validate-s3` | 是 | 轻量验证 S3 桶可读写删（Head/Put/Get/Delete） |
| GET | `/api/v1/settings/validate-cos` | 是 | 轻量验证 COS 桶可读写删（Head/Put/Get/Delete） |

## 详细说明（选摘）

### GET `/api/v1/settings/tags/get`

- **鉴权**：是
- **Query**：
  - `tree=true`：返回树结构（`fetchTagsTree()`）
  - `parent=<string>`：按分类/父级返回（`fetchTagsByCategory()`）
  - 无参数：返回列表（`fetchTagsList()`）
- **成功响应（200）**：`{ code: 200, data: ... }`

### POST `/api/v1/settings/tags/add`

- **鉴权**：是
- **请求体（JSON）**：由 `createTag(payload)` 决定（payload 可能包含 `parentName` 等兼容字段）
- **成功响应（200）**：`{ code: 200, data: <createTag返回> }`

### PUT `/api/v1/settings/tags/update/:id`

- **鉴权**：是
- **路径参数**：`id: string`
- **请求体（JSON）**：更新字段集合（由 `updateTag(id,payload)` 决定）
- **成功响应（200）**：`{ code: 200, data: <updateTag返回> }`

### POST `/api/v1/settings/tags/move`

- **鉴权**：是
- **请求体（JSON）**：`{ tagId: string, targetParentId?: string | null }`
- **成功响应（200）**：`{ code: 200, data: <tag>, message: "移动成功" }`
- **失败响应**：
  - 400：`tagId` 缺失 / 移动验证失败

### POST `/api/v1/settings/tags/check-completeness`

- **鉴权**：是
- **请求体（JSON）**：`{ batchSize?: number }`（默认 100）
- **成功响应（200）**：`{ code: 200, data: <result> }`

### DELETE `/api/v1/settings/tags/delete/:id`

- **鉴权**：是
- **路径参数**：`id: string`
- **成功响应（200）**：`{ code: 200, message: "Success" }`

### DELETE `/api/v1/settings/tags/delete-with-children/:id`

- **鉴权**：是
- **路径参数**：`id: string`
- **成功响应（200）**：`{ code: 200, message: "Success" }`

### GET `/api/v1/settings/get-custom-info`

- **鉴权**：是
- **成功响应（200）**：直接返回配置数组（`fetchConfigsByKeys([...])`），无 `{code,data}` 包装

### PUT `/api/v1/settings/update-custom-info`

- **鉴权**：是
- **请求体（JSON）**：`server/settings.ts` 中 `satisfies { ... }` 的字段集合（标题/作者/RSS/首页开关/关于我等）
- **成功响应（200）**：`{ code: 200, message: "Success" }`

### PUT `/api/v1/settings/update-*-info`

- **鉴权**：是
- **请求体（JSON）**：
  - `update-alist-info` / `update-r2-info` / `update-s3-info` / `update-cos-info`：当前实现期望 **Config 数组**（形如 `[{ config_key, config_value }, ...]`），服务端通过 `find(...).config_value` 取值
- **成功响应**：直接 `return c.json(data)`（由 `update*Config(...)` 的实现决定）

### GET `/api/v1/settings/validate-s3` 与 `/validate-cos`

- **鉴权**：是
- **行为**：对桶做 `HeadBucket`、`PutObject`、`GetObject`、`DeleteObject` 轻量校验，返回每一步 `checks`
- **成功响应（200）**：`{ code: 200, data: { bucket, endpoint, testKey, checks } }`

