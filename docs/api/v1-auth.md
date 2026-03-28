# `/api/v1/auth/**`（认证相关，公开）

路由实现：`server/auth.ts`（通过 `server/index.ts` 挂载到 `/api/v1/auth`）

## 接口列表

| 方法 | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| POST | `/api/v1/auth/login` | 否 | 用户登录（邮箱或用户名 + 密码），设置 cookie `auth_token` |
| POST | `/api/v1/auth/logout` | 否 | 退出登录（清除 cookie `auth_token`） |
| GET | `/api/v1/auth/me` | 是 | 获取当前用户信息（JWT 校验） |
| POST | `/api/v1/auth/change-password` | 是 | 修改密码 |
| POST | `/api/v1/auth/update-user` | 是 | 更新用户信息（当前仅头像 `image`） |

## 详细说明

### POST `/api/v1/auth/login`

- **鉴权**：否
- **请求体（JSON）**：
  - `email?: string`
  - `username?: string`
  - `password: string`
- **行为**：
  - 支持用 `email` 或 `username` 登录（服务端会先按 email 查用户，找不到再按 name 查）
  - 登录成功会 `Set-Cookie: auth_token=<jwt>`（httpOnly、sameSite=Lax、maxAge=7d、path=/）
- **成功响应（200）**：
  - `user: { id, email, name, image }`
  - `token: string`
- **失败响应**：
  - 400：缺少 identifier 或 password
  - 401：用户不存在 / 密码错误 / 用户不支持密码登录

### POST `/api/v1/auth/logout`

- **鉴权**：否
- **行为**：清除 cookie `auth_token`
- **成功响应（200）**：`{ message: "Logged out successfully" }`

### GET `/api/v1/auth/me`

- **鉴权**：是（`jwtAuth`）
- **成功响应（200）**：`{ user: <jwtPayload> }`

### POST `/api/v1/auth/change-password`

- **鉴权**：是（`jwtAuth`）
- **请求体（JSON）**：`{ currentPassword: string, newPassword: string }`
- **校验**：
  - `newPassword.length >= 8`
- **成功响应（200）**：`{ message: "Password updated successfully" }`
- **失败响应**：
  - 400：参数缺失 / 新密码过短 / 找不到密码账号
  - 401：当前密码不正确
  - 404：用户不存在

### POST `/api/v1/auth/update-user`

- **鉴权**：是（`jwtAuth`）
- **请求体（JSON）**：`{ image?: string }`
- **成功响应（200）**：`{ message: "User updated successfully" }`

