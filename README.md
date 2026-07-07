<h1 align="center">
<img width="28" src="./public/maskable-icon.png">
XPhotos
</h1>

<p align="center">
  <strong>基于 Next.js 15 + React 19 + Ant Design 6 的现代化响应式个人摄影图库与管理后台</strong>
</p>

<p align="center">
  <a href="#核心特性">✨ 核心特性</a> ·
  <a href="#技术栈">🛠 技术栈</a> ·
  <a href="#视觉预览">🖼 视觉预览</a> ·
  <a href="#快速开始">🚀 快速开始</a> ·
  <a href="#部署">☁️ 部署</a> ·
  <a href="#项目结构">📂 项目结构</a> ·
  <a href="#文档">📚 文档</a>
</p>

---

## 项目简介

XPhotos 是一个开箱即用的个人摄影图库系统，前台提供多种主题画廊（瀑布流 / 单列 / 模板），后台提供完整的作品、相册、标签、存储、攻略、统计管理能力。核心亮点：

- 🎨 **前台多主题**：瀑布流、单列、模板三种画廊主题，可在后台按相册切换
- 🖼 **作品管理**：多图上传、Live Photo 支持、EXIF 解析、**EXIF 预设模板**、精选/隐藏、批量操作
- 📚 **相册与排序**：创建相册、设置封面，**相册级独立排序**（置顶 / 置底 / 上移 / 下移；`images_albums_relation` 持久化）
- 🏷 **标签管理**：多级（父子）标签、图片标签自动关联、标签移动与历史补全工具
- 📖 **攻略模块**：可视化编辑器 + 模块（行程 / 预算 / 清单 / 交通 / 贴士 / 配图），含 TOC、相册关联、批量排序、缓存失效
- 🏪 **多存储支持**：S3 / Cloudflare R2 / 腾讯云 COS / AList，可在后台切换默认存储；上传前 HeadObject 校验对象存在性
- 🔐 **鉴权体系**：邮箱/用户名密码登录 + 图形验证码 + 两步验证（TOTP）；`middleware.ts` 对 `/admin/**` 做 Cookie JWT 守卫
- 📊 **数据统计**：访问日志、图片按年份分布、热门相机/镜头、后台仪表盘、**公开 Dashboard**
- ⚡ **性能优化**：Next.js 图片优化、SSR + Server Components、PostgreSQL 性能索引、防抖筛选、**Redis 缓存（`lib/redis.ts`，可通过 `REDIS_DISABLED=true` 关闭）**
- 🌍 **国际化**：`zh` / `en` 双语，由 `next-intl` 驱动
- 📱 **响应式**：桌面 / 平板 / 移动端统一适配，移动端筛选可达性优化
- 🐳 **Docker 部署**：根目录自带 `Dockerfile` 与 `docker-compose.yml`

---

## 技术栈

| 领域 | 技术选型 |
|------|----------|
| 前端框架 | **Next.js 15**（App Router）、**React 19** |
| 后台 UI | **Ant Design 6** + Pro Components |
| 前台 UI | TailwindCSS 4、Radix UI、Framer Motion、shadcn/ui 风格组件 |
| 动画 / 动效 | Framer Motion、`motion`、`yet-another-react-lightbox` |
| 状态管理 | Zustand、SWR（数据获取）、React Cache（服务端查询缓存）|
| 表单 | React Hook Form + Zod |
| 国际化 | `next-intl`（`messages/zh.json`、`messages/en.json`）|
| 服务端框架 | **Hono**（`/api/v1/*` 接口统一由 Hono 挂载）|
| 认证 | 自签 JWT（Cookie `auth_token`）+ 图形验证码 + 两步验证（TOTP）；`middleware.ts` 对 `/admin/**` 做守卫 |
| 数据库 | **PostgreSQL** + **Prisma 6** |
| 对象存储 | AWS S3 SDK v3（S3 / R2 / COS / AList 均走 S3 兼容通道）|
| 图片处理 | Sharp、Compressor.js、HEIC→JPEG、BlurHash / ThumbHash |
| 构建 / 开发 | pnpm、Turbopack（`--turbopack`）、TypeScript 5.9 |
| 性能监控 | 内置访问日志 + `admin/analytics` 仪表盘 |

- Node: `>=20`
- pnpm: `>=9`
- License: **MIT**

---

## 视觉预览

| 视图 | 截图 |
|------|------|
| 首页（Hero + 瀑布流）| ![首页预览](public/screenshots/home-desktop.png) |
| 瀑布流画廊 | ![瀑布流预览](public/screenshots/waterfall.png) |
| 单列画廊 | ![单列预览](public/screenshots/detail.png) |
| 相册列表 | ![相册预览](public/screenshots/album.png) |

> ✨ 在线体验：<https://x-photos.vercel.app/>

---

## 快速开始

### 前置条件

- **Node.js ≥ 20**
- **pnpm ≥ 9**
- **PostgreSQL**（本地 / Supabase / 其他兼容实例均可）
- （可选）Docker 与 Docker Compose

### 1. 克隆仓库

```bash
git clone https://github.com/sourcexu7/XPhotos.git
cd XPhotos
```

### 2. 复制环境变量

```bash
cp .env.example .env
```

至少填写：

```env
# Prisma / PostgreSQL 连接串（推荐带上连接池参数）
DATABASE_URL="postgresql://user:password@host:5432/xphotos?connection_limit=20&pool_timeout=10&connect_timeout=10"
DIRECT_URL="postgresql://user:password@host:5432/xphotos"

# JWT 签名密钥（请随机生成，例如：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=please-change-me-to-a-long-random-string

# Redis 缓存（可选；未配置或 REDIS_DISABLED=true 时自动降级）
# REDIS_URL=redis://127.0.0.1:6379/0
# REDIS_DISABLED=true
```

其他可选变量（对象存储、Umami 等）见 `.env.example` 与 `docs/performance/configuration.md`。

### 3. 安装依赖

```bash
pnpm install
```

### 4. 初始化数据库并启动开发服务器

```bash
pnpm run dev
```

`dev` 脚本在 Next.js 15 中会启动 `next dev`。若你希望首次运行时显式完成 Prisma 迁移与种子数据：

```bash
# 1) 生成 Prisma Client、执行迁移、写入种子配置
pnpm run prisma:dev        # 迁移（交互式）
pnpm run prisma:generate   # 生成客户端
pnpm run prisma:seed       # 初始化 configs / admin 用户等

# 2) 启动 dev server（可加 --turbopack）
pnpm run dev
# 或：pnpm run dev:turbopack
```

浏览器打开 <http://localhost:3000> 即可访问前台，访问 <http://localhost:3000/admin> 进入后台。

### 5. 默认管理员账号

`prisma:seed` 会根据环境变量创建管理员，若未设置则使用默认值，**进入后台请立即修改**：

| 字段 | 默认值 |
|------|--------|
| 邮箱 | `admin@xphotos.com` |
| 密码 | `Xphotos@123` |
| 用户名 | `admin` |

也可以用脚本显式创建 / 更新：

```bash
# 创建新管理员
pnpm exec tsx scripts/create-admin.ts

# 更新密码
pnpm exec tsx scripts/update-password.ts
```

---

## 部署

### Vercel（一键部署）

点击按钮一键部署，**部署后请在 Vercel 项目设置中将 Build Command 设置为 `pnpm run build:vercel`**：

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsourcexu7%2FXPhotos&env=DATABASE_URL,JWT_SECRET"><img src="https://vercel.com/button" alt="Deploy with Vercel"/></a>

必须的环境变量：

| Key | 说明 |
|-----|------|
| `DATABASE_URL` | PostgreSQL 连接串，使用 Supabase 时建议追加 `?pgbouncer=true` |
| `DIRECT_URL` | Prisma 迁移直连（可与 `DATABASE_URL` 相同，Serverless 数据库除外）|
| `JWT_SECRET` | JWT 签名密钥，建议随机生成 |

### Netlify

```bash
pnpm run build:netlify   # 等价于 prisma:deploy + prisma:generate + prisma:seed + next build
```

### Docker / 自托管

根目录提供 `Dockerfile` 与 `docker-compose.yml`：

```bash
# 使用 compose 同时启动 PostgreSQL + XPhotos
docker compose up -d --build
```

或仅构建镜像：

```bash
docker build -t xphotos .
docker run -d --name xphotos \
  -p 3000:3000 \
  -e DATABASE_URL=... \
  -e JWT_SECRET=... \
  xphotos
```

### 生产构建（Node 自托管）

```bash
pnpm run build:node      # prisma:deploy + prisma:generate + next build
pnpm start
```

---

## 核心特性

<details>
<summary><strong>🎨 前台多主题画廊</strong></summary>

- **瀑布流主题**：`components/layout/theme/waterfall/`，适合大量作品沉浸式浏览
- **单列主题**：`components/layout/theme/default/`，类似杂志阅读体验
- **模板主题**：`components/layout/theme/template/`，可定制 Hero 与封面
- **Lightbox 预览**：`components/album/preview-image.tsx`，支持 EXIF、复制 / 下载 / 原图
- **相册封面**：每个相册可单独设置封面图、主题、图片排序规则

</details>

<details>
<summary><strong>📸 作品与相册管理</strong></summary>

- 多图批量上传、Live Photo 上传、HEIC 自动转换、前端压缩
- 隐藏 / 精选、排序（`sort` 字段）、按拍摄时间 / 创建时间排序
- **相册级图片独立排序**：`ImagesAlbumsRelation` 表带 `sort` 字段，后台 `album-sort-panel` 拖拽或按钮调整
- 相册封面、主题、随机展示、图片排序规则均可后台配置

</details>

<details>
<summary><strong>🏷 多级标签与智能关联</strong></summary>

- 父子标签树、批量导入 / 导出
- `lib/services/image-tag-sync-service.ts`：根据图片标签文本自动匹配 Tags 表
- `lib/services/tag-move-service.ts`：二级标签在父节点间移动
- `scripts/import-tags-from-json.ts`：从 JSON 批量导入标签

</details>

<details>
<summary><strong>📖 攻略（Guides）模块</strong></summary>

- 数据表：`Guides`、`GuideComponents`、`GuideAlbumsRelation`、`GuideModules`、`GuideModuleContents`、`GuideTableOfContents`
- 可视化编辑器（`components/admin/guide-editor/`）支持：
  - 封面编辑、目录（TOC）管理
  - 行程（itinerary）、预算（expense）、清单（checklist）、交通（transport）、贴士（tips）、配图（photo）模块
  - 模块内排序与预览（`guide-preview.tsx`）
- 前台访问路径 `/guides`、`/guides/[id]`

</details>

<details>
<summary><strong>🏪 多种对象存储</strong></summary>

后台 `admin/settings/storages` 支持统一管理多种对象存储：

| 类型 | 说明 | 主要配置项 |
|------|------|------------|
| **S3 兼容** | AWS S3 / MinIO 等 | `s3_endpoint`、`s3_access_key`、`s3_bucket`、`s3_region`、`s3_force_path_style`、`s3_cdn_url`、`s3_direct_download` |
| **Cloudflare R2** | 零出站流量对象存储 | `r2_account_id`、`r2_access_key_id`、`r2_secret_access_key`、`r2_bucket`、`r2_public_url`、`r2_cdn`、`r2_cdn_url` |
| **腾讯云 COS** | S3 兼容接口 | `cos_secret_id`、`cos_secret_key`、`cos_region`、`cos_endpoint`、`cos_bucket`、`cos_storage_folder`、`cos_cdn_url` |
| **AList** | 通过 AList API 代理上传 | `alist_url`、`alist_token`、`alist_root_path` |

上传时通过 `default_storage`（`s3 / cos / r2 / alist`）选择默认存储；上传组件会调用对应适配器生成访问 URL。

</details>

<details>
<summary><strong>🔐 认证与安全</strong></summary>

- 邮箱 + 密码注册 / 登录（`bcryptjs`）
- **图形验证码**：防暴力破解，支持刷新和验证
- **两步验证（TOTP）**：`admin/settings/authenticator`，可启用 Authenticator App
- Session / Token：`auth_token` Cookie，受 `middleware.ts` 保护的 `/admin/**` 路径
- 环境变量：`JWT_SECRET`（Redis 等其他见 `.env.example`）

</details>

<details>
<summary><strong>📊 数据统计与仪表盘</strong></summary>

- 访问日志表 `VisitLog`：记录 `path`、`pageType`、`ip`、`userAgent`、`referrer`、`source`
- 后台 `admin/analytics`：图片总量、相册数量、标签数量、按年份图片分布、相机 / 镜头统计
- 公开 Dashboard：`components/public/dashboard/`（如需要可在前台展示）
- `admin/data-overview`：核心数据概览卡片

</details>

<details>
<summary><strong>⚡ 性能优化（已实施）</strong></summary>

- **数据库**：`add_performance_indexes.sql` 中包含 `images(del,show)`、`images(featured)`、`images(created_at)`、`images_show_mainpage_idx`、`images_labels_idx`（GIN）、`relation_image_album_idx`、`(album_value, sort)` 等关键索引
- **Prisma 连接池**：`DATABASE_URL` 中配置 `connection_limit / pool_timeout / connect_timeout`，并通过单例模式复用 Prisma Client（`lib/db/index.ts`）
- **服务端查询缓存**：`React.cache` + 服务端数据复用，避免同一渲染周期内重复查询
- **Next.js 图片**：`remotePatterns`、`formats: [avif, webp]`、`deviceSizes / imageSizes`、`minimumCacheTTL`（详见 `next.config.mjs`）
- **前端交互**：SWR、防抖输入、虚拟列表（`react-window`）、懒加载与渐进式加载（BlurHash / ThumbHash）
- **Redis 缓存**：`lib/redis.ts` 提供 `cacheWrap / cacheInvalidate / cacheFlushAll` 接口，用于图片 / 相册 / 攻略 / 设置等热点数据缓存；可通过 `REDIS_DISABLED=true` 关闭或不配置 `REDIS_URL` 降级为内存缓存

</details>

<details>
<summary><strong>🌍 国际化与主题</strong></summary>

- `next-intl` 驱动，翻译文件位于 `messages/zh.json`、`messages/en.json`
- `i18n.ts` 为 `next-intl` 配置入口
- `next-themes` 驱动明暗主题切换，前台可由用户切换
- Ant Design 后台主题变量集中在 `style/admin-theme.css` 与 `components/layout/admin/*`

</details>

---

## 项目结构

按 Next.js App Router 规范组织，只列出核心目录：

```
XPhotos/
├─ app/                          # Next.js App Router
│  ├─ layout.tsx                 # 全局 RootLayout（providers、metadata、umami）
│  ├─ (default)/                 # 默认主题（首页 / albums / covers / guides / preview / about）
│  ├─ (theme)/                   # 可切换主题的相册路由（按相册主题渲染）
│  ├─ admin/                     # 管理后台（dashboard / list / album / upload / settings / guides / analytics）
│  │  ├─ layout.tsx              # 后台布局（Ant Design）
│  │  ├─ list/                   # 图片列表与筛选
│  │  ├─ album/                  # 相册管理 + 相册级排序
│  │  ├─ upload/                 # 多图 / Live Photo / 简单上传
│  │  ├─ settings/               # 偏好设置、账号、2FA、标签、存储
│  │  ├─ guides/                 # 攻略列表与编辑
│  │  └─ analytics/              # 统计与数据概览
│  ├─ login/                     # 登录页（密码 + 图形验证码）
│  ├─ api/[[...route]]/route.ts  # Hono 统一入口（/api/v1/* 与部分 /api/public/*）
│  └─ rss.xml/route.ts           # RSS feed
│
├─ components/                   # 可复用组件
│  ├─ layout/                    # 前台布局（主题、header、album-nav、统一导航等）
│  ├─ album/                     # 图片预览、Lightbox、标签画廊、渐进式加载
│  ├─ admin/                     # 后台组件（dashboard / list / album / settings / upload 等）
│  │  ├─ album/                  # 相册管理 + album-sort-panel（相册级排序）
│  │  ├─ guide-editor/           # 攻略编辑器（封面、TOC、模块管理、内容编辑）
│  │  ├─ settings/storages/      # S3 / R2 / COS / AList 存储配置表单
│  │  └─ upload/                 # 多图上传、Live Photo、文件上传组件
│  ├─ auth/                      # 登出按钮
│  ├─ gallery/                   # 瀑布流 / 简单画廊组件
│  ├─ ui/                        # shadcn/ui 风格基础组件
│  └─ public/dashboard/          # 公开统计卡片
│
├─ hooks/                        # 业务 hooks（gallery filters、SWR 等）
│
├─ lib/                          # 核心业务逻辑
│  ├─ db/                        # Prisma 入口 + query/ + operate/
│  │  ├─ index.ts                # Prisma Client 单例
│  │  ├─ query/                  # images / albums / configs / tags / analytics / dashboard / public-dashboard
│  │  └─ operate/                # 写操作（images / albums / configs / tags）
│  ├─ services/                  # 领域服务（图片标签同步、标签移动）
│  ├─ utils/                     # 通用工具（locale / file / upload / fetcher / blurhash-client ...）
│  ├─ jwt.ts                     # JWT 工具
│  ├─ redis.ts                     # Redis 缓存工具（cacheWrap / cacheInvalidate / cacheFlushAll）
│  └─ s3.ts / r2.ts / cos.ts     # 对象存储适配器
│
├─ server/                       # Hono 服务端路由实现
│  ├─ index.ts                   # Hono app（挂载 /api/v1/*）
│  ├─ middleware/auth.ts         # JWT + Cookie 鉴权
│  ├─ albums.ts / images.ts      # 相册 / 图片 / 排序接口
│  ├─ guides.ts / guide-modules.ts # 攻略与模块接口
│  ├─ settings.ts                # 设置接口（含 cache/clear）
│  ├─ file.ts                    # 文件 / 上传预签名 / verify-url
│  ├─ analytics.ts               # 统计接口
│  ├─ auth.ts                    # 认证接口（登录 / 2FA / 图形验证码）
│  ├─ public.ts                  # 公开接口（站点信息、关于、封面、访问日志、dashboard、guides）
│  └─ open/                      # 公开下载 / 画廊 / 图片代理
│     ├─ download.ts
│     ├─ gallery.ts
│     └─ images.ts
│
├─ stores/                       # Zustand stores（config、按钮、选中）
│
├─ messages/                     # i18n 翻译文件（zh / en）
│
├─ prisma/
│  ├─ schema.prisma              # 数据模型（Images / Albums / Tags / Guides / VisitLog / User ...）
│  ├─ seed.ts                    # 种子数据（configs、默认 admin）
│  ├─ migrations/                # 迁移脚本
│  └─ add_performance_indexes.sql # 性能优化索引
│
├─ scripts/                      # 运维脚本（创建管理员、更新密码、清理图片、批量创建攻略 ...）
│
├─ style/                        # 全局样式（globals.css、admin-theme.css）
│
├─ docs/                         # 项目详细文档（见下方「文档」）
│
├─ public/                       # 静态资源（图标 / 字体 / 截图）
│
├─ Dockerfile / docker-compose.yml
├─ next.config.mjs               # Next.js 配置（图片优化、remotePatterns）
├─ tailwind.config.ts
├─ middleware.ts                 # /admin/** 登录守卫
├─ i18n.ts                       # next-intl 配置
└─ package.json
```

---

## 文档

完整的技术文档位于 `docs/` 目录，涵盖 API、UI、模型、优化、修复与实施指南：

| 文档 | 路径 | 说明 |
|------|------|------|
| 📚 文档入口 | [`docs/README.md`](docs/README.md) | 文档导航与目录说明 |
| 🔌 API 总览 | [`docs/api/README.md`](docs/api/README.md) | 接口前缀、鉴权、通用响应约定 |
| 🔐 认证接口 | [`docs/api/v1-auth.md`](docs/api/v1-auth.md) | 登录 / 注册 / 2FA |
| ⚙️ 设置接口 | [`docs/api/v1-settings.md`](docs/api/v1-settings.md) | 系统配置、标签、存储、cache/clear |
| 🖼 图片接口 | [`docs/api/v1-images.md`](docs/api/v1-images.md) | 图片 CRUD、相册排序、by-ids |
| 📚 相册接口 | [`docs/api/v1-albums.md`](docs/api/v1-albums.md) | 相册管理、封面、排序 |
| 📖 攻略接口 | [`docs/api/v1-guides.md`](docs/api/v1-guides.md) | 攻略 / 模块 / TOC / 相册关联 |
| 🏪 存储接口 | [`docs/api/v1-storage.md`](docs/api/v1-storage.md) | S3 / R2 / COS / AList |
| 📊 统计接口 | [`docs/api/v1-analytics.md`](docs/api/v1-analytics.md) | 访问日志与数据汇总 |
| 🌐 公开接口 | [`docs/api/public.md`](docs/api/public.md) | 站点信息、封面、dashboard、guides |
| 🎨 前台 UI | [`docs/ui/frontend.md`](docs/ui/frontend.md) | 首页 / 相册 / 预览 / 攻略 |
| 🛠 后台 UI | [`docs/ui/admin.md`](docs/ui/admin.md) | Dashboard、列表、相册、设置、攻略 |
| 🗃 数据模型 | [`docs/data/prisma-models.md`](docs/data/prisma-models.md) | 所有 Prisma 模型说明 |
| ⚡ 性能分析 | [`docs/performance/analysis.md`](docs/performance/analysis.md) | 查询 / 图片 / 筛选性能瓶颈 |
| ⚡ 性能优化 | [`docs/performance/configuration.md`](docs/performance/configuration.md) | 连接池、图片、CDN 配置 |
| 🧩 图片排序重构 | [`docs/guides/image-sorting-refactor.md`](docs/guides/image-sorting-refactor.md) | 相册级独立排序实施 |
| 🏷 标签管理重构 | [`docs/guides/tag-management-refactor.md`](docs/guides/tag-management-refactor.md) | 多级标签与自动关联 |
| 🎨 后台 UI 优化 | [`docs/guides/admin-ui-optimization.md`](docs/guides/admin-ui-optimization.md) | 结构、导航、可访问性 |
| 🐛 Prisma 连接修复 | [`docs/fixes/prisma-connection-fix.md`](docs/fixes/prisma-connection-fix.md) | 连接池与容错 |

---

## 常见问题（FAQ）

**Q：项目使用哪种数据库？**
A：PostgreSQL，通过 Prisma 6 访问。详见 `.env.example` 与 `prisma/schema.prisma`。

**Q：如何配置对象存储？**
A：进入后台 `设置 → 存储`，填写对应存储类型（S3 / R2 / COS / AList）的凭证与参数，并在 `default_storage` 中选择默认存储。上传时会走对应适配器。

**Q：如何启用 2FA？**
A：进入后台 `设置 → Authenticator`，使用 TOTP 应用（如 Google Authenticator、1Password）绑定。

**Q：图片加载慢？**
A：1）开启并正确使用对象存储的 CDN 模式；2）在 `next.config.mjs` 中配置 `remotePatterns` 与图片优化；3）数据库层面执行 `prisma/add_performance_indexes.sql` 中的索引优化。

**Q：如何迁移数据 / 重建索引？**
A：`pnpm run prisma:deploy` 会在生产环境执行迁移；索引补全可直接在数据库执行 `add_performance_indexes.sql`。

---

## 开发小抄

```bash
# 依赖与启动
pnpm install
pnpm run dev                 # 开发模式
pnpm run dev:turbopack       # Turbopack 开发模式
pnpm run dev:server          # dev:prisma + seed + next dev

# 数据库
pnpm run prisma:dev          # 本地迁移
pnpm run prisma:deploy       # 生产迁移
pnpm run prisma:generate     # 生成 Prisma Client
pnpm run prisma:seed         # 种子数据
pnpm run prisma:studio       # 可视化数据库浏览器

# 构建
pnpm run build               # 普通 Next.js 构建
pnpm run build:vercel        # Vercel 流程
pnpm run build:netlify       # Netlify 流程
pnpm run build:node          # Node 自托管流程

# 代码质量
pnpm run lint                # ESLint
pnpm run type-check          # tsc --noEmit
pnpm run format              # Prettier
```

---

## 致谢

- 感谢 <https://github.com/besscroft/PicImpact> 项目提供的优秀经验！
- 本项目基于 JetBrains 开源许可证，在 IntelliJ IDEA 中开发，感谢 JetBrains 的支持。

![JetBrains](https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg)
![IntelliJ IDEA](https://resources.jetbrains.com/storage/products/company/brand/logos/IntelliJ_IDEA.svg)

---

## License

XPhotos is open source software licensed as [MIT](LICENSE).
