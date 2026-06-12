# XPhotos 性能与优化操作手册

> **整合来源**：`docs/performance/analysis.md` · `docs/performance/summary.md` · `docs/performance/configuration.md`
>
> **本文档定位**：单一权威来源，记录 XPhotos 项目当前已查明的性能瓶颈、已实施的优化措施、实际可用的配置参数，以及后续可选优化方向。所有内容均以当前代码仓库中的真实实现为准，删除三份旧文档之间重复、空想、与现状不符的段落。

---

## 一、性能现状与核心瓶颈

本章节只记录在源码中真实存在的问题与优化方向。

### 1.1 数据库查询瓶颈

以下瓶颈来自对 `lib/db/query/images.ts`、`prisma/schema.prisma`、`lib/db/index.ts` 的实际代码审查。

**1. EXIF JSON 字段过滤无法走索引**

`lib/db/query/images.ts` 中对相机、镜头、曝光、光圈、ISO 的筛选使用：

```ts
COALESCE(image.exif->>'model', 'Unknown') = ${options.camera}
COALESCE(image.exif->>'lens_model', 'Unknown') = ${options.lens}
COALESCE(image.exif->>'exposure_time', '') = ${options.exposure}
COALESCE(image.exif->>'f_number', '') = ${options.f_number}
COALESCE(image.exif->>'iso_speed_rating', '') = ${options.iso}
```

`exif` 在 schema 中声明为 `Json`（PostgreSQL JSONB）。上述 `->>` 取值并用 `COALESCE` 包裹的写法**无法利用任何 B-tree 索引**，在图片量较大时会退化为全表扫描或逐行过滤。
建议（未实施）：在迁移中对常用 EXIF 字段创建函数索引或生成列，例如：

```sql
CREATE INDEX idx_images_exif_model
  ON images ((COALESCE(exif->>'model', 'Unknown')));
```

**2. `labels` JSONB 字段缺少 GIN 索引**

`prisma/schema.prisma` 的 `Images` 模型里有如下注释：

> 注意：JSONB 字段的 GIN 索引需要在迁移文件中手动创建，Prisma schema 不支持

当前仓库**没有**任何针对 `labels` 的 GIN 索引迁移或 SQL（未找到 `db_optimizations.sql`），对 `labels` 的包含/匹配查询会退化为顺序扫描。建议（未实施）：在迁移文件中执行：

```sql
CREATE INDEX idx_images_labels_gin ON images USING GIN (labels jsonb_ops);
```

**3. 连接池参数仅在 `.env.example` 中体现，无程序化默认值**

`lib/db/index.ts` 依赖 `process.env.DATABASE_URL` 中的查询串来决定连接数。若部署方漏写 `connection_limit`，Prisma 会使用默认值（通常偏小）。`.env.example` 中当前值为：

```
connection_limit=25&pool_timeout=20&connect_timeout=10
```

**4. 同一渲染周期内的重复查询已部分缓解**

`lib/db/query/images.ts` 中的 `fetchClientImagesListByAlbum`、`fetchFeaturedImages`、`fetchCameraAndLensList` 等函数已使用 `React.cache` 包装，同一次请求内多次调用只会触发一次数据库查询。但对于**跨请求**的数据（相机 / 镜头下拉列表），仍需查询数据库——见 2.2 的 Redis 方案。

---

### 1.2 图片加载与前端渲染瓶颈

以下内容基于 `next.config.mjs` 的实际配置（与旧文档中描述的 `minimumCacheTTL: 60`、`imageSizes: [16..384]` 不一致处，**以本小节为准**）。

`next.config.mjs` 中的 `images` 字段：

```js
remotePatterns: [
  { protocol: 'https', hostname: 'xphotos.s3.ap-northeast-1.amazonaws.com', pathname: '/**' },
  { protocol: 'https', hostname: 'xphotos7-1306526302.cos.ap-nanjing.myqcloud.com', pathname: '/**' },
],
formats: ['image/avif', 'image/webp'],
deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
imageSizes: [16, 32, 48, 64, 96, 128, 160, 200, 256, 320, 384, 480, 560, 640],
qualities: [60, 75, 85, 90, 100],
minimumCacheTTL: 3600,
```

**存在的问题 / 可优化点：**

1. **图片仅来源于 S3 和 COS 两个对象存储**，未走 CDN。跨地域访问的加载速度依赖于对象存储本身的边缘加速，建议（未实施）：在对象存储前增加 CDN 层，并将 `next.config.mjs` 中的 `remotePatterns` 指向 CDN 域名。
2. **上传时未自动生成缩略图 / 多尺寸版本**，列表页仍通过 Next.js Image 的 on-the-fly 优化读取原图。当原图 > 10MB 时，首次优化会产生明显的冷启动延迟。建议（未实施）：上传后用 Sharp 预生成若干尺寸并写入 `preview_key` / 缩略图 key。
3. `minimumCacheTTL: 3600`（1 小时）相比旧文档中的 60 秒已显著提升，但仍**短于静态资源一年缓存的常见做法**。对完全不变的图片可考虑用 `Cache-Control: public, max-age=31536000, immutable`（需要在 CDN 层而非 Next.js 中实现）。

---

### 1.3 筛选条件与 API 响应瓶颈

1. **防抖已实施，但缺少服务端缓存**：筛选组件 (`hooks/use-gallery-filters.ts` 的思路见 summary 文档) 已使用防抖避免频繁请求，API 层仍然每次查询数据库。对高并发访客流量，建议（未实施）：将热点筛选查询的结果写入 Redis。
2. **OFFSET 深分页**：`lib/db/query/images.ts` 中使用 `LIMIT/OFFSET`（从 `ORDER BY` 的写法可推断），页码越深查询越慢。建议（未实施）：改用游标分页（keyset pagination）。
3. **API 响应没有启用内容压缩**：`next.config.mjs` 中只为 `/api/:path*` 配置了 CORS 头，没有显式启用 gzip/brotli 的中间件。Next.js 默认对静态资源启用压缩，但 API JSON 的压缩需视部署方式而定。
4. **瀑布流大量图片 DOM 节点**：`components/ui/virtual-waterfall-gallery.tsx` 存在，但项目当前未使用 `react-window` 等虚拟滚动库，当列表超过数百张时渲染会变慢。

---

## 二、已实施的优化与实测数据

### 2.1 总览表

| 优化方向 | 完成状态 | 核心文件 | 预期效果 |
|---|---|---|---|
| 数据库索引（B-tree） | ✅ 已实施 | `prisma/schema.prisma` | 高频列表查询 -50~-70% |
| 查询字段收敛（不使用 SELECT \*） | ✅ 已实施 | `lib/db/query/images.ts` | 数据传输量 -40%+ |
| React.cache 服务端查询去重 | ✅ 已实施 | `lib/db/query/images.ts` | 同一次 SSR 请求内重复查询消除 |
| Prisma Client 单例复用 | ✅ 已实施 | `lib/db/index.ts` | 避免热重载 / 并发场景下连接池耗尽 |
| Redis 通用缓存层 | ✅ 已实施（可选开关） | `lib/redis.ts` | 热点数据命中后毫秒级返回；不可用时静默降级 |
| Next.js Image 自动格式转换 | ✅ 已实施 | `next.config.mjs` | 图片体积 -50~-70% |
| 响应式尺寸和自定义 quality | ✅ 已实施 | `next.config.mjs` | 根据显示尺寸提供对应图片 |
| 生产环境移除 console 日志 | ✅ 已实施 | `next.config.mjs` | 包体积减小，日志更干净 |
| 筛选输入防抖 | ✅ 已实施 | 前端 hooks | 重复请求 -70% |
| PWA / 离线缓存 | ✅ 已实施 | `next.config.mjs`（next-pwa） | 静态资源二次访问更快 |

> 注：旧文档 summary/analysis 中的「labels GIN 索引」「images_tags_relation 联合索引」两项，在当前 `prisma/schema.prisma` 中**并不存在**（schema 中仅有 `ImagesTagsRelation` 的单字段 `imageId` / `tagId` 索引）。请以本手册为准，不要在部署中假定它们已存在。

---

### 2.2 已实施优化的关键代码要点

**数据库索引（来自 `prisma/schema.prisma`）**

- `Images`: `@@index([del, show])`、`@@index([featured])`、`@@index([createdAt])`、`@@index([show, show_on_mainpage])`、`@@index([del, show, featured])`
- `Albums`: `@@index([del, show])`、`@@index([album_value])`
- `ImagesAlbumsRelation`: `@@index([imageId])`、`@@index([album_value])`、`@@index([imageId, album_value])`、`@@index([album_value, sort])`
- `ImagesTagsRelation`: `@@index([imageId])`、`@@index([tagId])`
- `VisitLog`: `@@index([createdAt])`、`@@index([path])`
- `Guides` 系列：`@@index([del, show])`、`@@index([country, city])`、`@@index([guide_id])`、`@@index([guide_id, sort])` 等

**Prisma 单例（`lib/db/index.ts`）**

在开发与生产环境都复用同一 Prisma Client 实例，并监听 `beforeExit` / `SIGINT` / `SIGTERM` 做 `$disconnect()`。附带有 `checkDatabaseHealth` 与 `getConnectionPoolInfo` 两个运维函数。

**Redis 通用缓存（`lib/redis.ts`）**

- 运行在 `server-only` 上下文中。
- `REDIS_URL` / `REDIS_PASSWORD` 两个环境变量控制。
- `REDIS_DISABLED=true|1` 或未配置 `REDIS_URL` 时整个缓存层被跳过，对业务逻辑无副作用。
- 提供 API：
  - `cacheWrap<T>(key, fn)`：先读缓存，miss 时执行 `fn` 并写回；失败直接走数据库。
  - `cacheInvalidate(...keys)`：写操作后主动失效。
  - `cacheInvalidateByPattern(pattern)`：基于 SCAN 的前缀失效（非阻塞）。
  - `cacheFlushAll()`：后台触发的全量清空。
- 重连策略：`reconnectStrategy: retries * 100ms`，上限 3000ms；`connectTimeout: 5000ms`。
- **未设置 TTL**：依赖 Redis 自身的 `allkeys-lfu` 淘汰策略来自动回收冷数据。

**Next.js Image（`next.config.mjs`）**

- `formats: ['image/avif', 'image/webp']`，浏览器按能力自动选择。
- `imageSizes` 扩展至 14 档，覆盖瀑布流 2~4 列的列宽。
- `qualities: [60, 75, 85, 90, 100]`，与 `OptimizedImage` 默认 `quality=85` 对齐。
- `minimumCacheTTL: 3600`，相比默认值 60 秒减少上游回源。
- `remotePatterns` 严格限定为 `xphotos.s3.ap-northeast-1.amazonaws.com` 与 `xphotos7-1306526302.cos.ap-nanjing.myqcloud.com` 两个域名，避免 SSRF。

**其他**

- `compiler.removeConsole` 在生产环境仅保留 `error` / `warn`。
- `output: 'standalone'` + `next-pwa`，方便容器化部署。
- `middlewareClientMaxBodySize: '100mb'`，以支持大图上传。

---

### 2.3 旧文档中已核实为「未实施」的项

以下条目在旧文档 `analysis.md` / `summary.md` 中被描述为「已实施」或「预期」，但在当前代码中**实际未实施**，已从本节「已实施」列表中排除：

- `images(labels)` GIN 索引（schema 注释说明「需在迁移文件中手动创建」，但仓库内没有对应迁移或 `db_optimizations.sql`）。
- `images_tags_relation(imageId, tagId)` 联合索引（schema 中仅有 `@@unique([imageId, tagId])` 约束与 `@@index([imageId])`、`@@index([tagId])`）。
- 图片上传时自动生成多尺寸缩略图 / 自动压缩（前端没有 Sharp 调用，`lib/db/operate/images.ts` 中也未见相关逻辑）。
- CDN 域名加速（`.env.example` 中没有 `NEXT_PUBLIC_CDN_URL`，`next.config.mjs` 中也没有相关读取）。
- 游标分页（仍使用 LIMIT/OFFSET）。
- 虚拟列表（`components/ui/virtual-waterfall-gallery.tsx` 存在但未使用 react-window 等库）。
- Service Worker 的细粒度图片缓存（next-pwa 仅提供基础 PWA 能力）。
- Sentry / Datadog / New Relic 等第三方 APM（项目未引入）。
- Lighthouse / Web Vitals 的自动化集成（未配置，仅作为可选工具使用）。

---

## 三、配置指南

本节只写「如何配置」。所有参数以仓库中实际使用的为准，不罗列空想项。

### 3.1 数据库与 Prisma

**必需环境变量（`.env.example`）**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/xphotos?schema=public&connection_limit=25&pool_timeout=20&connect_timeout=10"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/xphotos?schema=public"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=xphotos
```

**连接池参数推荐值**

| 参数 | 当前 `.env.example` | 推荐范围 | 说明 |
|---|---|---|---|
| `connection_limit` | 25 | 10 ~ 50 | 推荐设置为 CPU 核数的 2 ~ 5 倍；不要超过 PostgreSQL `max_connections` |
| `pool_timeout` | 20 | 10 ~ 30 秒 | 等待空闲连接的最长时间 |
| `connect_timeout` | 10 | 5 ~ 15 秒 | 单次建连超时 |

建议分档：

| 场景 | connection_limit | pool_timeout |
|---|---|---|
| 开发环境 | 5 | 10s |
| 小型站点（<1000 UV/日） | 10 | 15s |
| 中型站点（1000~10000 UV/日） | 20~25 | 20s |
| 大型站点（>10000 UV/日） | 30~50 | 30s |

**部署步骤**

```bash
pnpm prisma migrate deploy     # 应用最新 schema 变更
pnpm prisma generate           # 重新生成 Prisma Client
```

---

### 3.2 Redis 缓存层

**环境变量**

```env
REDIS_URL=redis://your-redis-host:6379
# 可选：Redis 有密码时配置
REDIS_PASSWORD=your-redis-password
# 可选：显式关闭（例如本地开发）
REDIS_DISABLED=false
```

**代码接入点（`lib/redis.ts`）**

```ts
// 读路径
cacheWrap('album:photos:' + albumId, () => fetchFromDB(albumId))

// 写路径（图片删除、排序变动、标签变更等）
cacheInvalidate('album:photos:' + albumId)
cacheInvalidateByPattern('album:photos:*')
```

**注意事项**

- Redis 不可用时，`cacheWrap` 会退化为直接查询数据库，**不会中断请求**。
- 代码中没有设置 key TTL，**请在 Redis 配置 `maxmemory-policy allkeys-lfu`**（或 `allkeys-lru`），依靠内存上限与淘汰策略自动回收。

---

### 3.3 Next.js 图片优化

**当前 `next.config.mjs` 中真实有效的配置**（与旧文档不一致处以此为准）：

```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'xphotos.s3.ap-northeast-1.amazonaws.com', pathname: '/**' },
    { protocol: 'https', hostname: 'xphotos7-1306526302.cos.ap-nanjing.myqcloud.com', pathname: '/**' },
  ],
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes:  [16, 32, 48, 64, 96, 128, 160, 200, 256, 320, 384, 480, 560, 640],
  qualities:   [60, 75, 85, 90, 100],
  minimumCacheTTL: 3600,
}
```

**调参建议**

- 若启用 CDN：将 `remotePatterns` 改为 CDN 域名，并在 CDN 上配置 `Cache-Control: public, max-age=31536000, immutable`。
- 若图片流量大：调低 `qualities` 的默认值（`OptimizedImage` 默认是 85），或在组件内部按设备像素比选择更低 quality。

---

### 3.4 其他关键环境变量

`.env.example` 中实际存在的：

```env
AUTH_SECRET=asdfghgfd
AUTH_TRUST_HOST=true
NODE_ENV=production
```

> 注：旧文档 `configuration.md` 中列举的 `NEXT_PUBLIC_CDN_URL`、`R2_*`、`UMAMI_*`、`JWT_SECRET`、`NEXTAUTH_SECRET` 等变量在当前 `.env.example` 中**并不存在**，已从本手册删除。若确需启用，请自行补充并同步更新本手册。

---

## 四、后续优化方向（按优先级）

本章节只保留在旧文档中出现、但在当前代码中**尚未实施**的项目，并按 P0/P1/P2 分级与大致工作量/收益做合并去重。

### P0（高优先级，应尽快落地）

| 项 | 说明 | 大致工作量 | 预期收益 |
|---|---|---|---|
| 为 `labels` 创建 GIN 索引 | 在迁移文件中执行 `CREATE INDEX ... USING GIN(labels)`，避免标签筛选走全表扫描 | 0.5 人日 | 标签筛选查询 -60% |
| 为 EXIF 常用字段创建函数索引 | 对 `exif->>'model'`、`exif->>'lens_model'` 等高频过滤字段创建函数索引或生成列 | 1 人日 | 相机/镜头筛选查询 -50~-70% |
| 图片上传时自动压缩 + 生成缩略图 | 使用 Sharp 生成多尺寸版本并写入对象存储，避免 Next.js 图片优化的冷启动延迟 | 2~3 人日 | 首屏 LCP -30~-50% |
| 对象存储前增加 CDN 层 | 将 S3 / COS 通过 Cloudflare、阿里云 CDN 等分发，减少跨地域延迟 | 0.5~1 人日（含 CDN 配置） | 图片加载 TT 减少，跨地域访问显著改善 |

### P1（中优先级，合适时机做）

| 项 | 说明 | 大致工作量 | 预期收益 |
|---|---|---|---|
| 游标分页替代 OFFSET | 用 `sort` / `created_at` 作为游标，避免深分页 | 1~2 人日 | 深分页查询时间 -50%+ |
| Redis 接入热门列表 / 筛选结果 | 将相册列表、精选图片、相机 / 镜头下拉等热点数据走 `cacheWrap` | 1 人日 | 热点接口 QPS 提升，数据库负载下降 |
| 瀑布流引入虚拟滚动 | 使用 `react-window` 或 `tanstack-virtual`，避免一次性渲染数百张图片节点 | 1~2 人日 | 长列表滚动更流畅，内存占用降低 |
| API 响应启用 Brotli 压缩 | 在部署层（Nginx / CDN / 部署平台）启用 Brotli 或确认 Next.js 默认压缩生效 | 0.5 人日 | JSON 传输体积 -60%+ |

### P2（低优先级，长期可选）

| 项 | 说明 | 大致工作量 | 预期收益 |
|---|---|---|---|
| 读写分离（主从复制） | 将分析 / 统计查询路由到只读副本 | 3+ 人日（含基础设施） | 高并发场景下主库压力降低 |
| 物化视图缓存汇总结果 | 对 `VisitLog`、图片总数等聚合查询建立物化视图并定期刷新 | 2 人日 | 管理后台统计页显著提速 |
| 细粒度 Service Worker 图片缓存 | 在 next-pwa 基础上增加自定义缓存策略 | 1~2 人日 | 二次访问体验更好 |
| 接入外部 APM（Sentry / Datadog 等） | 集中追踪慢查询、慢 API、错误率 | 1 人日 | 问题定位时间缩短 |

---

## 五、快速参考卡

### 数据库连接池参数推荐值

| 场景 | connection_limit | pool_timeout | connect_timeout |
|---|---|---|---|
| 开发 | 5 | 10s | 5s |
| 小站点 | 10 | 15s | 10s |
| 中型站点 | 20~25 | 20s | 10s |
| 大站点 | 30~50 | 30s | 10~15s |

### 关键索引清单（真实存在于 `prisma/schema.prisma`）

**images 表**

- `(del, show)` 联合索引
- `(featured)` 单列索引
- `(createdAt)` 单列索引
- `(show, show_on_mainpage)` 联合索引
- `(del, show, featured)` 联合索引

**images_albums_relation 表**

- `(imageId)`
- `(album_value)`
- `(imageId, album_value)`
- `(album_value, sort)`

**images_tags_relation 表**

- `(imageId)`
- `(tagId)`

**其他表**

- `albums(del, show)`、`albums(album_value)`
- `visit_log(createdAt)`、`visit_log(path)`
- `guides(del, show)`、`guides(country, city)`
- `guide_components(guide_id)`
- `guide_albums_relation(guide_id)`、`(album_id)`
- `guide_modules(guide_id)`、`(guide_id, sort)`
- `guide_module_contents(module_id)`、`(module_id, sort)`
- `guide_table_of_contents(guide_id)`、`(guide_id, sort)`

> **缺失、需手动补建**：`images(labels)` GIN 索引、EXIF 常用字段函数索引。

### Next.js 图片优化要点（`next.config.mjs` 真实内容）

- `remotePatterns` 仅允许 S3（ap-northeast-1）与 COS（ap-nanjing）两个域名
- `formats: ['image/avif', 'image/webp']`
- `deviceSizes`: 8 档；`imageSizes`: 14 档（含 160 / 200 / 320 / 480 / 560 / 640）
- `qualities`: `[60, 75, 85, 90, 100]`
- `minimumCacheTTL: 3600`（1 小时）

### Redis 关键环境变量清单

| 变量 | 必填 | 默认行为 | 说明 |
|---|---|---|---|
| `REDIS_URL` | 否 | 整个缓存层被跳过 | Redis 连接串，如 `redis://host:6379` |
| `REDIS_PASSWORD` | 否 | 无 | Redis 鉴权密码 |
| `REDIS_DISABLED` | 否 | `false` | 设为 `true` / `1` 可显式禁用 |

### 性能监控与验证

| 场景 | 方式 | 命令 / 工具 |
|---|---|---|
| PostgreSQL 慢查询 | 数据库端 | `ALTER DATABASE xphotos SET log_min_duration_statement = 1000;` |
| 热点查询定位 | 数据库端 | `CREATE EXTENSION IF NOT EXISTS pg_stat_statements;` 然后查询 `pg_stat_statements` |
| 连接池使用率 | 应用端 | `lib/db/index.ts` 中 `getConnectionPoolInfo()` |
| 健康检查 | 应用端 | `lib/db/index.ts` 中 `checkDatabaseHealth()` |
| 前端性能 | 浏览器开发者工具 / Lighthouse | 关注 LCP、CLS、INP |
| Web Vitals | 部署平台 / 第三方（可选） | 如 Vercel Analytics、Plausible 等 |

---

## 来源文档清单

本手册合并并取代以下三份旧文档：

- `docs/performance/analysis.md` — 原始瓶颈分析与优化方向草案
- `docs/performance/summary.md` — 已实施优化项梳理与实测数据汇总
- `docs/performance/configuration.md` — 配置参数与部署指南

事实核查所参考的源码文件：

- `next.config.mjs`
- `prisma/schema.prisma`
- `lib/db/index.ts`
- `lib/db/query/images.ts`
- `lib/redis.ts`
- `.env.example`

> 旧文档保留在仓库中，供历史追溯使用；后续新增或修改的性能相关内容**只更新本手册**，不再维护三份旧文档。
