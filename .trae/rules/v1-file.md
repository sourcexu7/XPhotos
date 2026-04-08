# `/api/v1/file/**`（文件/上传，受保护）

路由实现：`server/file.ts`（通过 `server/index.ts` 挂载到 `/api/v1/file`，并对 `/file/*` 使用 `jwtAuth`）

## 接口列表

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/v1/file/presigned-url` | 是 | 获取对象存储预签名上传 URL（支持 r2/s3/cos） |
| POST | `/api/v1/file/upload` | 是 | 服务端代传（multipart formData，支持 alist/s3/cos） |
| POST | `/api/v1/file/getObjectUrl` | 是 | 获取对象访问 URL（直链或预签名 GET） |
| POST | `/api/v1/file/delete` | 是 | 删除对象存储中的对象（s3/r2/cos） |

## 详细说明

### POST `/api/v1/file/presigned-url`

- **鉴权**：是（`jwtAuth`）
- **请求体（JSON）**：
  - `filename: string`
  - `contentType?: string`
  - `type?: string`（默认 `'/'`，用于拼接路径前缀）
  - `storage: 'r2' | 's3' | 'cos'`
- **成功响应（200）**（R2/S3/COS 常见返回）：
  - `{ code: 200, data: { presignedUrl: string, key: string } }`
- **特殊响应**：
  - 当 `storage='s3'` 且配置 `s3_force_server_upload=true`：返回 `{ code: 286, data: { serverUpload: true } }`，提示前端走服务端代传 `/upload`
- **失败响应**：
  - 400：缺参数 / 配置缺失 / 不支持的 storage
  - 500：生成预签名失败（实际错误会被包装为 `HTTPException`）

### POST `/api/v1/file/upload`

- **鉴权**：是（`jwtAuth`）
- **请求体**：`multipart/form-data`
  - `file: Blob`
  - `storage: 'alist' | 's3' | 'cos'`
  - `type?: string`
  - `mountPath?: string`（alist 使用）
- **成功响应（200）**：
  - alist：`{ code: 200, data: <alistUploadResult> }`
  - s3/cos：`{ code: 200, data: { url: string, imageId: string, fileName: string, key: string } }`
- **失败响应**：
  - 400：storage 缺失 / s3|cos 缺 file / 配置缺失
  - 500：上传失败

### POST `/api/v1/file/getObjectUrl`

- **鉴权**：是（`jwtAuth`）
- **请求体（JSON）**：`{ storage: 's3' | 'cos' | 'r2', key: string }`
- **成功响应（200）**：
  - `{ code: 200, data: string }`（直链或预签名 GET URL）
- **行为**：
  - s3/cos 会根据 `*_direct_download` 决定返回“直链”还是“预签名 GET”
  - r2 直接用 `r2_public_domain` 拼接 `domain/key`

### POST `/api/v1/file/delete`

- **鉴权**：是（`jwtAuth`）
- **请求体（JSON）**：`{ storage: 's3' | 'r2' | 'cos', key: string }`
- **成功响应（200）**：`{ code: 200, message: "deleted" }`
- **失败响应**：
  - 400：缺参数 / bucket 未配置 / 不支持的 storage
  - 500：删除失败

