# `/api/v1/storage/**`（存储相关，受保护）

当前实现主要为 AList（通过 `server/index.ts` 挂载到 `/api/v1/storage/alist`，并对 `/storage/*` 使用 `jwtAuth`）。

路由实现：`server/storage/alist.ts`

## `/api/v1/storage/alist/**`

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/v1/storage/alist/info` | 是 | 获取 AList 配置（url/token） |
| GET | `/api/v1/storage/alist/storages` | 是 | 请求 AList 管理 API 获取存储列表（转发） |

## 详细说明

### GET `/api/v1/storage/alist/info`

- **鉴权**：是
- **返回**：配置数组（`alist_url`、`alist_token`）

### GET `/api/v1/storage/alist/storages`

- **鉴权**：是
- **行为**：读取 `alist_url`/`alist_token` 后，请求 `${alistUrl}/api/admin/storage/list` 并原样 `return c.json(data)`
- **注意**：该接口等同于一个“后端转发”，AList 的返回结构不由本项目控制

