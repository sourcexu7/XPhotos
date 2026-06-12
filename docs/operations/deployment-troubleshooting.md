# XPhotos 部署与故障排查手册

> **状态**：整合文档（v1）
>
> **适用范围**：生产环境部署、CI/CD 流程、故障回滚
>
> **阅读前提**：已了解项目基于 Next.js 15 + Prisma + PostgreSQL 构建，使用 pnpm 作为包管理器。

---

## 一、部署前检查清单

本清单来源于 `docs/performance/configuration.md`，并与 `lib/db/index.ts`、`middleware.ts`、`next.config.mjs`、`.env.example`、`package.json`、`prisma/schema.prisma` 中的真实实现逐项核对。

### 1.1 环境变量

以下是源码中真实读取到的 key，任何缺失或错误值都会导致部署失败。

| 变量 | 位置 | 作用 | 必需 |
|------|------|------|------|
| `DATABASE_URL` | `lib/db/index.ts`、`prisma/schema.prisma` | PostgreSQL 主连接串（建议包含连接池参数） | ✅ |
| `DIRECT_URL` | `prisma/schema.prisma` | Prisma 迁移直连（非池化） | ✅ |
| `NODE_ENV` | `next.config.mjs` / `lib/db/index.ts` | 控制 console 过滤、日志级别、热重载行为 | 建议 |
| `JWT_SECRET` | `middleware.ts` | 后台页面鉴权的 cookie 签名（`auth_token`） | ✅（生产环境必须替换） |
| `REDIS_URL` / `REDIS_PASSWORD` | `docker-compose.yml` | Redis 连接（如启用缓存层） | 可选 |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `.env.example` / `docker-compose.yml` | Docker Compose 启动 Postgres 用 | Docker 部署必需 |
| `PORT` | `Dockerfile` | 应用监听端口（默认 `3000`） | 可选 |

### 1.2 数据库连接与权限

- Postgres 用户必须具备 `CREATE TABLE`、`ALTER TABLE`、`CREATE INDEX` 等 schema 操作权限（迁移期）。
- 运行期至少需要 `SELECT / INSERT / UPDATE / DELETE`。
- `DATABASE_URL` 中建议携带连接池参数：`?connection_limit=25&pool_timeout=20&connect_timeout=10`（示例值来源于 `.env.example`）。
- `DIRECT_URL` 用于 Prisma CLI（`pnpm prisma:deploy`），不应连接池化，以避免迁移长时间占用连接。

### 1.3 Prisma migrate deploy 是否成功

```bash
pnpm prisma:deploy
```

- 必须在 `pnpm build` 之前完成（或同时由构建脚本处理，如 `build:node` / `build:vercel` / `build:netlify`）。
- 失败表现：应用启动后查不到表、首次请求直接 500。
- 校验：登录数据库后执行 `\dt` 或 `SELECT tablename FROM pg_tables WHERE schemaname='public';`，应能看到 `images`、`albums`、`configs`、`images_albums_relation` 等表。

### 1.4 数据库索引是否全部建立

根据 `prisma/schema.prisma` 中声明的 `@@index`，迁移后应存在以下索引：

| 表 | 字段 | 说明 |
|----|------|------|
| `images` | `(del, show)` | 公开图片筛选 |
| `images` | `(featured)` | 精选查询 |
| `images` | `(createdAt)` | 时间排序 |
| `images` | `(show, show_on_mainpage)` | 首页展示筛选 |
| `images` | `(del, show, featured)` | 多条件筛选联合索引 |
| `images_albums_relation` | `(imageId)`、`(album_value)`、`(imageId, album_value)`、`(album_value, sort)` | 关联查询优化 |
| `albums` | `(del, show)` | 相册筛选 |
| `tags` / `images_tags_relation` / `guides` / `visit_log` 等 | 见 schema 对应 `@@index` | 多对多与统计优化 |

**注意**：`images.labels`（JSONB）字段需要在迁移文件中手动创建 GIN 索引，Prisma schema 暂不直接支持声明。

### 1.5 Next.js Image 配置是否符合存储配置

查看 `next.config.mjs` 的 `images.remotePatterns`：

```js
remotePatterns: [
  { protocol: 'https', hostname: 'xphotos.s3.ap-northeast-1.amazonaws.com', pathname: '/**' },
  { protocol: 'https', hostname: 'xphotos7-1306526302.cos.ap-nanjing.myqcloud.com', pathname: '/**' },
]
```

- 生产环境已限制为 S3 / COS 两个桶域名。
- 若你新增了其他存储后端（例如 Cloudflare R2 / AList），必须把对应的域名加入此白名单，否则图片将被 Next.js 拒绝优化并显示 400 错误。
- `images.formats = ['image/avif', 'image/webp']` 已经开启格式自动转换，可显著降低图片体积。

### 1.6 Redis 连接是否正常（如已启用）

- 在 `docker-compose.yml` 中 Redis 健康检查通过 `redis-cli ping` 验证。
- 构建期（Dockerfile `builder` 阶段）显式写入 `REDIS_DISABLED=true`，避免 `next build` 的静态渲染期触发真实网络请求。
- 生产运行期如需启用 Redis，确保 `REDIS_URL` 可达且密码正确。

---

## 二、构建与启动流程

### 2.1 本地开发

```bash
pnpm dev
# 或携带初始化数据库与种子数据：
pnpm dev:server
# 或使用 turbopack：
pnpm dev:turbopack
```

### 2.2 生产构建

```bash
pnpm prisma:deploy     # 执行迁移
pnpm prisma:generate   # 生成 Prisma Client
pnpm build             # next build（output: standalone）
pnpm start             # 监听 3000
```

- `build:node`、`build:vercel`、`build:netlify` 这三个脚本已经把上面三步合并，CI 中直接调用即可。
- `next.config.mjs` 已设置 `output: 'standalone'`，产物位于 `.next/standalone/`，支持 Docker 部署。

### 2.3 Docker / Docker Compose

项目已提供 `Dockerfile`（多阶段：base → deps → builder → runner）和 `docker-compose.yml`（Caddy + App + Postgres + Redis）。

```bash
# 一键启动全部服务
docker compose up -d

# 查看状态
docker compose ps

# 查看应用日志
docker compose logs -f app
```

要点：

- 构建阶段（`builder`）会写入占位的 `DATABASE_URL` 和 `REDIS_DISABLED=true`，真实连接在 `runner` 阶段由 `.env` 注入。
- 构建期设置 `NODE_OPTIONS="--max-old-space-size=4096"`，防止 Next.js build OOM。
- Caddy 作为反向代理暴露 80/443，如无需自带反代，可只启动 `app` + `db` + `redis`。

### 2.4 首次启动后自检清单

1. **访问首页** `http://<host>:3000`（或 Caddy 代理的 HTTPS 域名）：
   - 页面能正常渲染；控制台（客户端与服务器）无未捕获的红色报错。
2. **访问后台** `/admin`：
   - 未登录应自动重定向到 `/login`；
   - 使用账号登录后，`auth_token` cookie 被写入，跳转回 `callbackUrl`。
3. **验证数据库**：
   - 后台「相册 / 图片 / 统计」任一点进去，能正常拉取数据。
4. **验证图片加载**：
   - 画廊图片能正常显示（非 404 / 500），说明 `remotePatterns` + 对象存储桶访问配置正确。
5. **查看服务端日志**：
   - 不应出现 `PrismaClientInitializationError`、`Server has closed the connection`、`Connection refused` 等字样。

---

## 三、数据库连接与 Prisma

本节核心内容来源于 `docs/fixes/prisma-connection-fix.md`，并以 `lib/db/index.ts` 的真实实现为准。

### 3.1 单例模式：避免连接池耗尽

`lib/db/index.ts` 关键结构：

```ts
const prisma = globalThis.prisma ?? prismaClientSingleton()

// 开发与生产环境都复用，避免 Next.js 热重载反复创建客户端
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
} else {
  globalThis.prisma = prisma
}

export const db = prisma
```

**为什么这样做**：Next.js 在开发期会频繁重建模块，如果每次都 `new PrismaClient()`，Postgres 连接数会线性增长，最终触发 `Server has closed the connection` 或 `too many connections`。

代码中还附带了两个**健康信息工具**，可在运维脚本中直接调用：

- `checkDatabaseHealth()` — `SELECT 1` 往返时间
- `getConnectionPoolInfo()` — 活动连接数、解析自 `DATABASE_URL` 的 `connection_limit`、当前使用率（>80% 标记为 `warning`）

同时注册了 `beforeExit / SIGINT / SIGTERM` 钩子调用 `prisma.$disconnect()`，确保容器或进程优雅退出时释放连接。

### 3.2 连接池参数

推荐在 `DATABASE_URL` 中携带以下参数（值来源于 `.env.example`）：

```
DATABASE_URL="postgresql://user:pwd@host:5432/xphotos?schema=public&connection_limit=25&pool_timeout=20&connect_timeout=10"
DIRECT_URL="postgresql://user:pwd@host:5432/xphotos?schema=public"
```

| 参数 | 含义 | 建议范围 |
|------|------|----------|
| `connection_limit` | 单个 Prisma Client 实例允许打开的最大连接数 | 10 ~ 数据库 `max_connections` 的 50% 以内 |
| `pool_timeout` | 等待可用连接的最长时间（秒），超过将抛出错误 | 10 ~ 30 |
| `connect_timeout` | 新建 TCP 连接的超时（秒） | 5 ~ 15 |

**经验法则**：若应用实例数为 `N`，则 `N × connection_limit` 应远小于 Postgres 的 `max_connections`（默认 100）。

### 3.3 常见报错速查

| 错误 | 典型原因 | 修复方案 |
|------|----------|----------|
| `PrismaClientInitializationError` | 启动期无法建立数据库连接 | 检查 `DATABASE_URL`、防火墙、Postgres 监听地址（`listen_addresses`）、Docker 网络连通性 |
| `Server has closed the connection` | 数据库端主动断开（闲置超时 / 连接池耗尽 / 数据库重启） | 增大 `connection_limit`、检查慢查询、使用单例模式 |
| `Connection refused` | Postgres 未启动 / 端口不通 / 网络策略阻断 | `docker compose ps` 检查 `db` 容器；本地用 `psql` 或 `nc -zv host 5432` 验证 |
| `P1001: Can't reach database server at ...` | Prisma 迁移期网络不可达 | 迁移脚本需在能直连数据库的环境运行；检查 CI runner / 部署机的网络白名单 |
| `User "xxx" does not have permission to create table` | 数据库用户权限不足 | 给迁移用户授予 `CREATEDB` / schema 写权限；生产运行用户可降级为只读 + 写业务表 |
| `pg_stat_statements 扩展不存在` | 慢查询监控需要的扩展未创建 | `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;`（需超级用户） |

### 3.4 服务端查询容错策略

项目多处采用「try-catch + 默认值降级」，避免非关键查询失败导致整页 500：

- **根布局的 metadata**：即使配置读取失败，也会返回默认标题/favicon，保证前台始终可访问。
- **配置查询**（`configs` 表）：如连接异常返回空数组，调用方用默认值替代。
- **其他业务查询**：请保持一致的模式 — 任何在 Server Component 中对数据库的访问，都必须包含异常分支与合理的降级值。

### 3.5 连接健康检查建议

- **容器级**：在 `docker-compose.yml` 中已有 `db` 服务的 `pg_isready` 健康检查；app 容器可增加对应用端口的 `curl` 检查。
- **应用级**：可在运维脚本中定期调用 `lib/db/index.ts` 导出的 `checkDatabaseHealth()` 与 `getConnectionPoolInfo()`，并接入告警（例如：连接池使用率 ≥ 80%、往返时间 ≥ 500ms）。
- **数据库级**：开启 `log_min_duration_statement = 1000`（毫秒），把超过 1 秒的查询落库分析。

---

## 四、常见故障排查手册

本节合并了 `docs/performance/configuration.md`、`docs/performance/summary.md`、`docs/fixes/prisma-connection-fix.md` 的排查内容，并按场景归纳。

### 4.1 数据库慢查询

**症状**：页面首屏 3s+、浏览器 Network 面板看到 API TTFB 长、Postgres 日志中出现长耗时 SQL。

**定位**：

```sql
-- 1) 打开慢查询日志
ALTER DATABASE xphotos SET log_min_duration_statement = 1000;

-- 2) 启用 pg_stat_statements 扩展（一次性）
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 3) 查看最慢的 10 条查询
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- 4) 检查是否有全表扫描
EXPLAIN ANALYZE SELECT * FROM images WHERE del = 0 AND show = 1;
```

**修复**：

- 确认 `prisma/schema.prisma` 中对应的 `@@index` 已经通过 `prisma:deploy` 生效；
- 避免在 React Server Component 里 `Array.map(db.query)`（N+1），尽量用 Prisma 的 `include`；
- 检查 `images.labels` 等 JSONB 字段是否通过 GIN 索引加速；
- 高并发场景把热点结果写入 Redis 缓存。

### 4.2 图片加载慢

**症状**：画廊空白、Lighthouse 报 LCP 长、客户端浏览器 400 / 404。

**排查**：

1. 确认 `next.config.mjs` 的 `images.remotePatterns` 已包含你使用的桶域名。
2. 确认对象存储桶（S3 / COS / R2 / AList）对图片资源的访问策略允许应用主机访问。
3. 检查 `OptimizedImage` 默认 `quality=85` 是否被覆写过低 / 过高。
4. 查看浏览器 DevTools → Network：源图响应头是否带 `Cache-Control`，CDN 回源是否命中。
5. Lighthouse 审计页面，确认 WebP / AVIF 格式转换生效。

### 4.3 API 响应慢

**症状**：`/api/v1/public/gallery/images` 等接口 TTFB > 500ms。

**排查**：

1. 用第 4.1 节确认慢查询来源。
2. 检查是否在接口层做了不必要的序列化（例如大 JSON 字段）。
3. 外部依赖（S3/COS 预签名、AList 转发）的网络延迟是否偏高。
4. 容器内存 / CPU：`docker stats`，必要时升级资源。

### 4.4 性能突然回退

**应急处理顺序**：

1. **重启应用**：清理可能的内存泄漏 / 连接堆积。
2. **增大连接池**：将 `connection_limit` 从 25 调整到 35 并重启，观察是否缓解。
3. **激进缓存**：提高 Next.js Image 的 `minimumCacheTTL`（当前 `next.config.mjs` 已设为 3600s）；对热点 API 启用服务端缓存。
4. **降级非核心功能**：关闭统计聚合、标签过滤的实时计算等，确保核心浏览与上传可用。
5. **回归分析**：对比 `git log`，定位最近的 schema / 查询 / 配置变更；回滚并验证。

### 4.5 鉴权 / 登录失败

**代码依据**：`middleware.ts` 只对 `/admin/**` 做 cookie `auth_token` 校验；登录接口写回同名 cookie，并用 `jose` 的 `jwtVerify` 验证。

**常见问题**：

| 现象 | 可能原因 | 修复 |
|------|----------|------|
| 访问 `/admin` 直接跳回 `/login`，cookie 中无 `auth_token` | 登录接口调用失败；或 cookie `HttpOnly/SameSite` 设置与 HTTPS 不一致 | 检查登录响应头 `Set-Cookie`；生产环境请走 HTTPS |
| 有 `auth_token` 但仍跳回登录页 | `JWT_SECRET` 与签发端不一致 / token 已过期 | 确认部署环境的 `JWT_SECRET`；重启应用 |
| 所有 API 都返回 401 | 前端请求未携带 `Authorization: Bearer <token>` 或 cookie | 检查前端请求拦截器；检查 `auth_token` 的 `path=/` 是否被覆写 |
| `JWT_SECRET` 使用了默认值 `asdfghgfd`（示例中出现的弱值） | 示例值被直接带到生产 | 生产环境必须替换为随机 32+ 字符的密钥 |

### 4.6 上传失败（四后端存储校验）

项目支持 S3 / COS / R2 / AList 四类存储。上传失败通常有三类原因：

1. **桶配置错误**：预签名生成时会校验 Bucket / Region / 访问密钥；错误会以 HTTP 500 或 S3 SDK 异常形式抛出。
2. **权限不足**：上传账号缺少 `s3:PutObject`（或 COS 对应权限）。
3. **CORS 问题**：浏览器直传模式（Client Presigned Upload）需要桶的 CORS 规则允许前端 Origin。

**快速验证**：在后台「系统设置 → 存储」里选择对应的存储后端后保存，观察接口返回；或调用 `/api/v1/settings/validate-s3`（及其 COS 等价）进行连通性自检。

---

## 五、监控与告警

参考 `docs/performance/configuration.md` 的监控章节，结合当前源码实现整理。

### 5.1 数据库慢查询日志（PostgreSQL）

```sql
ALTER DATABASE xphotos SET log_min_duration_statement = 1000;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 定期查看 Top 慢查询
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### 5.2 Lighthouse 与 Web Vitals 快速自检

```bash
npx lighthouse https://your-domain.com --view
```

关注指标：

- **LCP** < 2.5s（优化对象：首屏图 CDN、格式转 WebP/AVIF）
- **CLS** < 0.1（已在瀑布流组件中做尺寸稳定化）
- **INP** < 200ms（关注交互延迟、阻塞长任务）

### 5.3 应用层监控

- `lib/db/index.ts` 已提供 `checkDatabaseHealth()` 与 `getConnectionPoolInfo()`，可在内部运维面板直接渲染。
- 推荐接入错误聚合（如 Sentry）与 APM（如 OpenTelemetry），捕获 `next build` 外所有未处理异常。
- 对 `/api/v1/public/gallery/images`、登录、上传三类接口设置 **P95 响应时间告警**（>1s）。

### 5.4 Redis 内存与 key 数量

```bash
redis-cli -a $REDIS_PASSWORD info memory
redis-cli -a $REDIS_PASSWORD dbsize
```

`docker-compose.yml` 已配置 `--maxmemory 256mb --maxmemory-policy allkeys-lru`，可根据实际访问量调整。

---

## 六、环境变量快速参考

只列出源码真实读取到的 key（按文件分组）：

- **`prisma/schema.prisma` + `lib/db/index.ts`**：`DATABASE_URL`、`DIRECT_URL`
- **`next.config.mjs`**：`NODE_ENV`、`ANALYZE`（构建分析用）
- **`middleware.ts`**：`JWT_SECRET`
- **`.env.example`**：`POSTGRES_USER`、`POSTGRES_PASSWORD`、`POSTGRES_DB`、`AUTH_SECRET`、`AUTH_TRUST_HOST`、`NODE_ENV`
- **`docker-compose.yml` / `Dockerfile`**：`REDIS_URL`、`REDIS_PASSWORD`、`PORT`、`HOSTNAME`、`REDIS_DISABLED`（仅构建期）
- **API 错误码与 HTTP 语义**：详见 `docs/reference/api-reference.md`「错误码清单」小节

---

## 七、回滚与应急方案

1. **回滚到上一版本**
   - Docker：重新 `docker pull` 旧镜像 tag 并 `docker compose up -d`。
   - Git：`git checkout <previous-commit>` + `pnpm build` + `pnpm start`。
   - CI/CD：保留最近 3 个可部署产物，一键回切。

2. **清空 Redis 缓存**
   - 登录 Redis：`redis-cli -a $REDIS_PASSWORD FLUSHALL`。
   - 仅在出现缓存脏数据（如设置更新未失效）时操作。

3. **快速降级非核心功能**
   - 如系统压力异常高，优先关闭：标签筛选实时计算、访问统计聚合、RSS 自动重生成等长耗时任务。
   - 保留：首页画廊、详情页、后台登录与基础 CRUD。

---

## 八、来源文档清单

本手册整合并替换了以下四份旧文档的对应段落，避免重复维护：

1. `docs/fixes/prisma-connection-fix.md` — Prisma 连接错误修复（核心内容已并入第 3 节）
2. `docs/performance/configuration.md` — 性能优化配置（部署检查清单、故障排查、监控章节已并入第 1 / 4 / 5 节）
3. `docs/performance/summary.md` — 性能优化实施总结（部署步骤、故障排查章节已并入第 2 / 4 节）
4. `docs/reference/api-reference.md` — API 与错误码参考（错误码保留在原文档，本文档第 4 / 6 节交叉引用）

> **维护约定**：后续新增的部署相关故障案例、新环境变量、新索引配置，统一更新到本文件；以上四份旧文档中的重复内容不再增量追加，逐步标记为「已整合到 deployment-troubleshooting.md」。
