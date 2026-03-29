# `/api/v1/analytics/**`（统计，受保护）

路由实现：`server/analytics.ts`（通过 `server/index.ts` 挂载到 `/api/v1/analytics`，并对 `/analytics/*` 使用 `jwtAuth`）

## 接口列表

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET | `/api/v1/analytics/` | 是 | 获取访问统计汇总 |

## 详细说明

### GET `/api/v1/analytics/`

- **鉴权**：是
- **成功响应**：实现直接 `return c.json(data)`（返回结构取决于 `getVisitAnalytics()`）
- **失败响应**：500 `{ message: "Failed to fetch visit analytics" }`

## 备注：后台页面内专用接口

另有一个 Next Route Handler（不经 `/api`）：`GET /admin/analytics/api`（`app/admin/analytics/api/route.ts`），返回同一份 `getVisitAnalytics()` 数据。

