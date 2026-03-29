# API 文档总览（XPhotos）

## 基础前缀与路由入口

- **API 总前缀**：`/api`
- **Hono 聚合入口**：`app/api/[[...route]]/route.ts`
- **版本化接口**：`/api/v1/**`
- **公开接口（非 v1）**：`/api/public/**`
- **页面内专用接口**：`/admin/analytics/api`（Next Route Handler，不走 `/api`）

## 鉴权与权限

### 受保护接口范围

- **需要鉴权（JWT）**：`/api/v1/settings/**`、`/api/v1/file/**`、`/api/v1/images/**`、`/api/v1/albums/**`、`/api/v1/storage/**`、`/api/v1/analytics/**`
- **公开（无需鉴权）**：`/api/v1/auth/**`、`/api/v1/public/**`、`/api/public/**`、`/rss.xml`

### Token 来源（服务端验证）

`server/middleware/auth.ts` 的 `jwtAuth` 支持两种方式取 token：

- **Header**：`Authorization: Bearer <token>`
- **Cookie**：`auth_token=<token>`

### 后台页面访问控制（路由级）

`middleware.ts` 会对所有 `/admin/**` 页面做 cookie `auth_token` 校验（无 token 或校验失败会跳转 `/login`）。

## 通用响应约定（现状）

本项目接口存在两种常见返回形态（历史兼容 + 新接口混用）：

- **形态 A（Hono + code/data）**：`{ code: 200, data: ... }` 或 `{ code: 200, message: 'Success' }`
- **形态 B（直接 json）**：直接返回对象/数组（例如 `get-custom-info`、`about-info` 等）
- **异常**：通常返回 `{ message: string }` 且 HTTP 状态码为 4xx/5xx（由 `HTTPException` 或 `server/index.ts` 的 `onError` 统一处理）

> 文档中会对每个接口标明其实际返回形态，避免前端对响应结构误判。

## 接口清单（按前缀分组）

> 若要从“某个按钮”追溯到接口，请从 `docs/ui/frontend.md` 与 `docs/ui/admin.md` 进入；本文档侧重 API 约定与接口细节。

### `/api/v1/auth/**`（公开）

详见 `docs/api/v1-auth.md`

### `/api/v1/settings/**`（受保护）

详见 `docs/api/v1-settings.md`

### `/api/v1/file/**`（受保护）

详见 `docs/api/v1-file.md`

### `/api/v1/images/**`（受保护 + 部分公开子接口）

详见 `docs/api/v1-images.md`

### `/api/v1/albums/**`（受保护）

详见 `docs/api/v1-albums.md`

### `/api/v1/storage/**`（受保护）

详见 `docs/api/v1-storage.md`

### `/api/v1/analytics/**`（受保护）

详见 `docs/api/v1-analytics.md`

### `/api/v1/public/**`（公开）

详见 `docs/api/public.md`

### `/api/public/**`（公开）

详见 `docs/api/public.md`

### 其他

- `GET /rss.xml`：RSS 输出（`app/rss.xml/route.ts`）
- `GET /admin/analytics/api`：后台统计（`app/admin/analytics/api/route.ts`）

