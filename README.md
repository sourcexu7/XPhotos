# 📸 XPhotos

> **现代化响应式个人摄影图库与管理后台** — 基于 **Next.js 15**、**React 19**、**Ant Design 6** 与 **Hono** 构建

<div align="center">

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
  [![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev)
  [![Ant Design](https://img.shields.io/badge/Ant%20Design-6-1677ff?logo=antdesign)](https://ant.design)
  [![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono)](https://hono.dev)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org)
  [![Prisma](https://img.shields.io/badge/Prisma-6-0C344B?logo=prisma)](https://www.prisma.io)
  [![pnpm](https://img.shields.io/badge/pnpm-9-000?logo=pnpm)](https://pnpm.io)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

  [✨ 核心特性](#-核心特性概览) ·
  [🛠 技术栈](#-技术栈) ·
  [🖼 视觉预览](#-视觉预览) ·
  [🚀 快速开始](#-快速开始) ·
  [☁️ 部署](#-部署) ·
  [📂 项目结构](#-项目结构) ·
  [📚 文档](#-完整文档)

  [在线体验 →](https://sourcexu.com/)

</div>

---

## ✨ 核心特性概览

| 分类 | 能力 |
|------|------|
| 🎨 **前台多主题** | 瀑布流 / 单列 / 模板三种画廊主题，可按相册切换 |
| 🖼 **作品管理** | 多图上传、Live Photo、HEIC 自动转换、EXIF 解析、精选/隐藏、批量操作 |
| 📚 **相册与排序** | 创建相册、设置封面、**相册级独立排序**（置顶 / 置底 / 上移 / 下移 / 拖拽） |
| 🏷 **标签管理** | 多级（父子）标签、图片标签自动关联、标签移动、批量导入/导出 |
| 📖 **攻略模块** | 富媒体攻略编辑器（行程 / 预算 / 清单 / 交通 / 贴士 / 配图） |
| 🏪 **多存储支持** | S3 / Cloudflare R2 / 腾讯云 COS / AList，后台一键切换默认存储 |
| 🔐 **鉴权体系** | 邮箱密码登录 + 图形验证码 + 两步验证（TOTP）+ Session / Cookie 防护 |
| 📊 **数据统计** | 访问日志、图片按年份分布、热门相机 / 镜头、后台仪表盘 |
| ⚡ **性能优化** | Next.js 图片优化、SSR + Server Components、PostgreSQL 性能索引、防抖筛选、虚拟列表 |
| 🌍 **国际化** | `zh` / `en` 双语（`next-intl`） |
| 📱 **响应式** | 桌面 / 平板 / 移动端统一适配，移动端筛选可达性优化 |
| 🐳 **容器化部署** | 根目录自带 `Dockerfile` 与 `docker-compose.yml` |

---

## 🛠 技术栈

### 分层一览

| 层级 | 技术组件 |
|------|----------|
| **前端框架** | **Next.js 15**（App Router）、**React 19** |
| **后台 UI** | **Ant Design 6** + Pro Components（`@ant-design/icons`） |
| **前台 UI** | TailwindCSS 4、Radix UI、Framer Motion、shadcn/ui 风格组件 |
| **动画 / 动效** | Framer Motion、`motion`、`yet-another-react-lightbox` |
| **状态管理** | Zustand、SWR（数据获取）、`React.cache`（服务端查询缓存） |
| **表单** | React Hook Form + Zod |
| **国际化** | `next-intl`（`messages/zh.json`、`messages/en.json`） |
| **服务端框架** | **Hono** — `/api/v1/*` 接口统一由 Hono 挂载 |
| **认证** | better-auth（Password / 2FA TOTP / Session / JWT） |
| **数据库** | **PostgreSQL** + **Prisma 6** |
| **对象存储** | AWS S3 SDK v3（S3 / R2 / COS / AList 统一适配器） |
| **图片处理** | Sharp、Compressor.js、HEIC→JPEG、BlurHash / ThumbHash |
| **构建 / 开发** | pnpm、Turbopack、TypeScript 5.9 |
| **性能监控** | 内置 `VisitLog` 访问日志 + `admin/analytics` 仪表盘 |

### 运行环境要求

- **Node.js** ≥ `20.0.0`
- **pnpm** ≥ `9.0.0`
- **PostgreSQL**（推荐 14+，支持 GIN 索引）
- **（可选）** Docker 与 Docker Compose

---

## 🖼 视觉预览

| 视图 | 截图 |
|------|------|
| 首页（Hero + 瀑布流） | ![首页预览](public/screenshots/home-desktop.png) |
| 瀑布流画廊 | ![瀑布流预览](public/screenshots/waterfall.png) |
| 单列画廊 | ![单列预览](public/screenshots/detail.png) |
| 相册列表 | ![相册预览](public/screenshots/album.png) |
| 关于我 | ![关于我](public/screenshots/aboutme.png) |

> 👉 [在线体验 →](https://sourcexu.com/)

---

## 🚀 快速开始

> **一句话总结**：配置好 PostgreSQL → 复制 `.env` → 安装依赖 → 执行迁移与种子 → 启动 dev server。

### 📋 前置条件

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| **Node.js** | ≥ 20.0.0 | `node -v` 验证 |
| **pnpm** | ≥ 9.0.0 | `pnpm -v` 验证；npm 用户可执行 `npm i -g pnpm` |
| **PostgreSQL** | 14+ | 需先创建空数据库（如 `xphotos`） |
| **Docker** | （可选） | 使用容器化部署时需要 |

### 🔧 初始化步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/sourcexu7/XPhotos.git
cd XPhotos
```

#### 2. 配置环境变量

**Linux / macOS：**
```bash
cp .env.example .env
```

**Windows PowerShell：**
```powershell
Copy-Item .env.example .env
```

打开 `.env`，至少填写以下 **必填项**：

```env
# ─── 数据库连接（必填） ──────────────────────────────────
# Prisma / PostgreSQL 连接串（推荐带上连接池参数以优化性能）
DATABASE_URL="postgresql://user:password@localhost:5432/xphotos?schema=public&connection_limit=25&pool_timeout=20&connect_timeout=10"
DIRECT_URL="postgresql://user:password@localhost:5432/xphotos?schema=public"

# ─── 认证密钥（必填，建议随机生成） ──────────────────────
# JWT 密钥（middleware.ts 中用于校验登录态，≥ 32 字符）
JWT_SECRET=please-change-me-to-a-long-random-string-min-32-chars

# better-auth 会话密钥（可执行 `npx auth secret` 生成）
AUTH_SECRET=please-change-me-to-another-random-string
AUTH_TRUST_HOST=true

# ─── 其他（可选） ────────────────────────────────────────
# Redis 缓存（未配置时自动禁用，不影响核心业务）
# REDIS_URL=redis://127.0.0.1:6379/0

# Node 运行环境
NODE_ENV=development
```

> 💡 **密钥生成小技巧**：
> ```bash
> # 生成 JWT_SECRET / AUTH_SECRET
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> # 或使用 better-auth 官方工具
> npx auth secret
> ```

#### 3. 安装依赖

```bash
pnpm install
```

#### 4. 初始化数据库与启动（推荐：一键脚本）

项目提供了 **一键完成迁移 + 种子 + 启动** 的脚本，首次运行建议使用：

```bash
# 方式 A：推荐（自动完成 Prisma 迁移、生成、种子数据，然后启动 dev server）
pnpm run dev:server

# 方式 B：Turbopack 加速版（同上，但使用 Next.js Turbopack 构建）
pnpm run dev:turbopack

# 方式 C：仅启动 Next.js dev（需已手动完成过初始化）
pnpm run dev
```

首次启动后，`dev:server` 与 `dev:turbopack` 会自动执行：

1. ✅ `prisma migrate dev` — 创建表结构
2. ✅ `prisma generate` — 生成 Prisma Client
3. ✅ `prisma db seed` — 写入默认配置、预置标签、默认管理员账号
4. 🚀 `next dev` — 启动开发服务器

#### 5. 手动分步初始化（可选）

如果你希望对每个阶段有更细粒度的控制：

```bash
# 1) 创建数据表
pnpm run prisma:dev

# 2) 生成 Prisma Client（IDE 类型提示依赖此步骤）
pnpm run prisma:generate

# 3) 写入种子数据（默认配置 + 预置标签 + 管理员账号）
pnpm run prisma:seed

# 4) 启动开发服务器
pnpm run dev
```

#### 6. 验证启动

浏览器打开：

- **前台**：<http://localhost:3000>
- **后台**：<http://localhost:3000/admin>

后台登录使用 **默认管理员账号**（首次登录后请立即在后台修改）：

| 字段 | 默认值 |
|------|--------|
| 邮箱 | `admin@xphotos.com` |
| 密码 | `Xphotos@123` |
| 用户名 | `admin` |

---

### 🔐 账号管理（可选）

除种子数据自动创建的管理员外，你还可以用脚本显式操作：

```bash
# 创建新管理员
pnpm exec tsx scripts/create-admin.ts

# 更新现有管理员密码
pnpm exec tsx scripts/update-password.ts

# 可视化数据库浏览器
pnpm run prisma:studio
```

---

## ☁️ 部署

### Vercel（一键部署）

点击按钮一键部署，**部署后请在 Vercel 项目设置中将 Build Command 设置为 `pnpm run build:vercel`**：

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsourcexu7%2FXPhotos&env=DATABASE_URL,AUTH_SECRET,JWT_SECRET"><img src="https://vercel.com/button" alt="Deploy with Vercel"/></a>

**必须的环境变量：**

| Key | 说明 |
|-----|------|
| `DATABASE_URL` | PostgreSQL 连接串，使用 Supabase 时建议追加 `?pgbouncer=true` |
| `DIRECT_URL` | Prisma 迁移直连（可与 `DATABASE_URL` 相同，Serverless 数据库除外） |
| `AUTH_SECRET` | better-auth 会话密钥，建议 `npx auth secret` 生成 |
| `JWT_SECRET` | JWT 签名密钥（`middleware.ts` 使用，≥ 32 字符） |
| `AUTH_TRUST_HOST` | 生产部署时建议设为 `true` |

---

### Netlify

```bash
pnpm run build:netlify
# 等价于：prisma:deploy → prisma:generate → prisma:seed → next build
```

---

### Docker / 自托管

根目录提供 `Dockerfile` 与 `docker-compose.yml`。

**方式 A：docker compose（推荐，含 PostgreSQL）**

```bash
# 一键启动 PostgreSQL + XPhotos
docker compose up -d --build
```

**方式 B：仅构建 XPhotos 镜像**

```bash
docker build -t xphotos .
docker run -d --name xphotos \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@db:5432/xphotos?schema=public&connection_limit=25" \
  -e DIRECT_URL="postgresql://user:password@db:5432/xphotos?schema=public" \
  -e AUTH_SECRET="your-auth-secret" \
  -e JWT_SECRET="your-jwt-secret-min-32-chars" \
  -e AUTH_TRUST_HOST=true \
  -e NODE_ENV=production \
  xphotos
```

---

### Node 自托管（生产构建）

```bash
# 1) 安装依赖
pnpm install --prod --frozen-lockfile

# 2) 生产构建（自动执行迁移 + 生成客户端 + Next 构建）
pnpm run build:node

# 3) 启动服务
pnpm start
# 默认监听 0.0.0.0:3000
```

> 💡 **生产环境提示**：建议在反向代理（Nginx / Caddy）后运行，并配置 HTTPS 与静态资源缓存。

---

### 构建命令速览

| 命令 | 执行流程 | 适用场景 |
|------|----------|----------|
| `pnpm run build` | 仅 `next build` | 已手动完成迁移后 |
| `pnpm run build:vercel` | `prisma:deploy` → `prisma:generate` → `prisma:seed` → `next build` | Vercel 平台 |
| `pnpm run build:netlify` | 同上 | Netlify 平台 |
| `pnpm run build:node` | `prisma:deploy` → `prisma:generate` → `next build` | Node 自托管 |

---

## 🎯 功能详解

<details open>
<summary>🎨 前台多主题画廊</summary>

| 主题 | 路径 | 适用场景 |
|------|------|----------|
| **瀑布流** | `components/layout/theme/waterfall/` | 大量作品沉浸式浏览 |
| **单列** | `components/layout/theme/default/` | 杂志式阅读体验 |
| **模板** | `components/layout/theme/template/` | 可定制 Hero 与封面 |

- **Lightbox 预览**：`components/album/preview-image.tsx`，支持 EXIF、复制 / 下载 / 原图
- **相册封面**：每个相册可单独设置封面图、主题、图片排序规则

</details>

<details>
<summary>📸 作品与相册管理</summary>

- 多图批量上传、Live Photo 上传、HEIC 自动转换、前端压缩
- 隐藏 / 精选、全局排序（`sort` 字段）、按拍摄时间 / 创建时间排序
- **相册级图片独立排序**：`ImagesAlbumsRelation` 表独立 `sort` 字段，后台 `album-sort-panel` 支持拖拽与按钮调整
- 相册封面、主题、随机展示、图片排序规则均可在后台配置

</details>

<details>
<summary>🏷 多级标签与智能关联</summary>

- 父子标签树、批量导入 / 导出
- `lib/services/image-tag-sync-service.ts` — 根据图片标签文本自动匹配 Tags 表
- `lib/services/tag-move-service.ts` — 二级标签在父节点间移动
- 预置 20+ 个常用摄影分类标签（种子数据内置）

</details>

<details>
<summary>📖 攻略（Guides）模块</summary>

- **涉及数据表**：`Guides`、`GuideComponents`、`GuideAlbumsRelation`、`GuideModules`、`GuideModuleContents`、`GuideTableOfContents`
- **可视化编辑器**（`components/admin/guide-editor/`）：
  - 封面编辑、目录（TOC）管理
  - 行程 / 预算 / 清单 / 交通 / 贴士 / 配图 六大模块
  - 模块内排序与实时预览
- **前台访问**：`/guides`、`/guides/[id]`

</details>

<details>
<summary>🏪 对象存储（四选一或混用）</summary>

后台 `admin/settings/storages` 统一管理：

| 类型 | 说明 | 主要配置项 |
|------|------|------------|
| **S3 兼容** | AWS S3 / MinIO 等 | `s3_endpoint`、`s3_access_key`、`s3_bucket`、`s3_region`、`s3_force_path_style`、`s3_cdn_url`、`s3_direct_download` |
| **Cloudflare R2** | 零出站流量 | `r2_account_id`、`r2_access_key_id`、`r2_secret_access_key`、`r2_bucket`、`r2_public_url`、`r2_cdn`、`r2_cdn_url` |
| **腾讯云 COS** | S3 兼容接口 | `cos_secret_id`、`cos_secret_key`、`cos_region`、`cos_endpoint`、`cos_bucket`、`cos_storage_folder`、`cos_cdn_url` |
| **AList** | API 代理上传 | `alist_url`、`alist_token`、`alist_root_path` |

上传时通过 `default_storage`（`s3 / cos / r2 / alist`）选择默认存储。

</details>

<details>
<summary>🔐 认证与安全</summary>

- 邮箱 + 密码登录（`bcryptjs` 哈希）
- **图形验证码**：防暴力破解，支持刷新与刷新
- **两步验证（TOTP）**：`admin/settings/authenticator`，可绑定 Authenticator App
- Session / Token：`auth_token` Cookie，由 `middleware.ts` 保护 `/admin/**` 路径
- 需配置环境变量：`AUTH_SECRET`、`JWT_SECRET`

</details>

<details>
<summary>📊 数据统计与仪表盘</summary>

- `VisitLog` 表记录：`path`、`pageType`、`ip`、`userAgent`、`referrer`、`source`
- 后台 `admin/analytics`：图片总量、相册数、标签数、年份分布、相机 / 镜头统计
- `admin/data-overview`：核心数据概览卡片

</details>

<details>
<summary>⚡ 性能优化（已实施）</summary>

| 维度 | 措施 |
|------|------|
| **数据库** | `add_performance_indexes.sql` 含 `images(del,show)`、`images(featured)`、`images_labels_idx`（GIN）、`(album_value, sort)` 等关键索引 |
| **Prisma 连接池** | `DATABASE_URL` 配置 `connection_limit / pool_timeout / connect_timeout`；`lib/db/index.ts` 中单例复用 Prisma Client |
| **服务端查询缓存** | `React.cache` + 同渲染周期数据复用 |
| **Next.js 图片** | `remotePatterns`、`formats: [avif, webp]`、`deviceSizes / imageSizes`（详见 `next.config.mjs`） |
| **前端交互** | SWR 数据获取、防抖输入、虚拟列表（`react-window`）、懒加载 + BlurHash/ThumbHash |

</details>

<details>
<summary>🌍 国际化与主题</summary>

- `next-intl` 驱动：`messages/zh.json`、`messages/en.json`
- `i18n.ts` 为 `next-intl` 配置入口
- `next-themes` 驱动明暗主题切换
- Ant Design 后台主题集中在 `style/admin-theme.css` 与 `components/layout/admin/*`

</details>

---

## 📂 项目结构

按 **Next.js App Router** 规范组织，核心目录如下：

```
XPhotos/
├─ app/                              # Next.js App Router
│  ├─ layout.tsx                     # 全局 RootLayout（providers、metadata）
│  ├─ (default)/                     # 默认主题（首页 / albums / covers / guides / about）
│  ├─ (theme)/                       # 相册主题路由（按相册主题渲染）
│  ├─ admin/                         # 管理后台
│  │  ├─ layout.tsx                  #   Ant Design 后台布局
│  │  ├─ list/                       #   图片列表与筛选
│  │  ├─ album/                      #   相册管理 + 相册级排序
│  │  ├─ upload/                     #   多图 / Live Photo 上传
│  │  ├─ settings/                   #   偏好 / 账号 / 2FA / 标签 / 存储
│  │  ├─ guides/                     #   攻略列表与编辑
│  │  └─ analytics/                  #   统计仪表盘
│  ├─ login/                         # 登录页（密码 + 图形验证码）
│  ├─ api/[[...route]]/route.ts      # Hono 统一入口（/api/v1/*、/api/public/*）
│  └─ rss.xml/route.ts               # RSS Feed
│
├─ components/                       # 可复用组件
│  ├─ layout/                        # 前台布局（主题、header、导航）
│  ├─ album/                         # 图片预览、Lightbox、标签画廊
│  ├─ admin/                         # 后台专用组件
│  │  ├─ album/                      #   相册管理 + album-sort-panel
│  │  ├─ guide-editor/               #   攻略可视化编辑器
│  │  ├─ settings/storages/          #   四类存储配置表单
│  │  └─ upload/                     #   多图上传 / Live Photo 上传
│  ├─ gallery/                       # 瀑布流 / 简单画廊组件
│  └─ ui/                            # shadcn/ui 风格基础组件
│
├─ hooks/                            # 业务 hooks（gallery filters / SWR 等）
│
├─ lib/                              # 核心业务逻辑
│  ├─ db/                            # Prisma 入口与数据访问层
│  │  ├─ index.ts                    #   Prisma Client 单例
│  │  ├─ query/                      #   读操作（images / albums / tags ...）
│  │  └─ operate/                    #   写操作（images / albums / tags ...）
│  ├─ services/                      # 领域服务（标签同步、标签移动）
│  ├─ utils/                         # 通用工具（locale / file / blurhash ...）
│  ├─ auth-client.ts                 # better-auth 客户端
│  ├─ jwt.ts                         # JWT 工具
│  └─ s3.ts / r2.ts / cos.ts         # 对象存储适配器
│
├─ server/                           # Hono 服务端路由
│  ├─ index.ts                       #   Hono app（挂载 /api/v1/*）
│  ├─ middleware/auth.ts             #   JWT + Cookie 鉴权
│  ├─ albums.ts / images.ts          #   相册 / 图片 / 排序接口
│  ├─ guides.ts / guide-modules.ts   #   攻略与模块接口
│  ├─ settings.ts                    #   设置接口
│  ├─ file.ts                        #   文件 / 上传预签名
│  ├─ analytics.ts                   #   统计接口
│  ├─ auth.ts                        #   认证接口
│  ├─ public.ts                      #   公开接口
│  └─ open/                          #   公开下载 / 画廊 / 图片代理
│
├─ stores/                           # Zustand stores
├─ messages/                         # i18n 翻译文件（zh / en）
├─ prisma/
│  ├─ schema.prisma                  # 数据模型定义
│  ├─ seed.ts                        # 种子数据
│  ├─ migrations/                    # 迁移脚本
│  └─ add_performance_indexes.sql    # 性能优化索引
├─ scripts/                          # 运维脚本（create-admin / update-password ...）
├─ style/                            # 全局样式
├─ docs/                             # 完整技术文档
├─ public/                           # 静态资源
├─ Dockerfile / docker-compose.yml
├─ next.config.mjs
├─ middleware.ts                     # /admin/** 登录守卫
└─ package.json
```

---

## 📚 完整文档

详细技术文档位于 `docs/` 目录：

| 类别 | 文档 | 说明 |
|------|------|------|
| � **入口** | [`docs/README.md`](docs/README.md) | 文档导航与目录 |
| 🔌 **API** | [`docs/api/README.md`](docs/api/README.md) | 接口总览、鉴权、响应约定 |
| 🔐 **API** | [`docs/api/v1-auth.md`](docs/api/v1-auth.md) | 登录 / 注册 / 2FA |
| ⚙️ **API** | [`docs/api/v1-settings.md`](docs/api/v1-settings.md) | 系统配置、标签、存储 |
| 🖼 **API** | [`docs/api/v1-images.md`](docs/api/v1-images.md) | 图片 CRUD、排序、筛选 |
| 📚 **API** | [`docs/api/v1-albums.md`](docs/api/v1-albums.md) | 相册管理、封面、排序 |
| 🏪 **API** | [`docs/api/v1-storage.md`](docs/api/v1-storage.md) | S3 / R2 / COS / AList |
| 📊 **API** | [`docs/api/v1-analytics.md`](docs/api/v1-analytics.md) | 访问日志与数据汇总 |
| 🌐 **API** | [`docs/api/public.md`](docs/api/public.md) | 公开接口 |
| 🎨 **UI** | [`docs/ui/frontend.md`](docs/ui/frontend.md) | 前台页面说明 |
| 🛠 **UI** | [`docs/ui/admin.md`](docs/ui/admin.md) | 后台页面说明 |
| 🗃 **数据** | [`docs/data/prisma-models.md`](docs/data/prisma-models.md) | Prisma 模型说明 |
| ⚡ **性能** | [`docs/performance/analysis.md`](docs/performance/analysis.md) | 性能瓶颈分析 |
| ⚡ **性能** | [`docs/performance/configuration.md`](docs/performance/configuration.md) | 连接池 / 图片 / CDN 配置 |
| 🧩 **实施** | [`docs/guides/image-sorting-refactor.md`](docs/guides/image-sorting-refactor.md) | 相册级独立排序 |
| 🏷 **实施** | [`docs/guides/tag-management-refactor.md`](docs/guides/tag-management-refactor.md) | 多级标签与自动关联 |
| 🎨 **实施** | [`docs/guides/admin-ui-optimization.md`](docs/guides/admin-ui-optimization.md) | 后台 UI 优化 |
| 🐛 **修复** | [`docs/fixes/prisma-connection-fix.md`](docs/fixes/prisma-connection-fix.md) | Prisma 连接池与容错 |

---

## ❓ 常见问题

| 问题 | 解答 |
|------|------|
| **使用哪种数据库？** | PostgreSQL 14+，通过 Prisma 6 访问。详见 `.env.example` 与 `prisma/schema.prisma`。 |
| **如何配置对象存储？** | 进入后台 `设置 → 存储`，填写对应存储类型（S3 / R2 / COS / AList）的凭证，并在 `default_storage` 中选择默认存储。 |
| **如何启用 2FA？** | 进入后台 `设置 → Authenticator`，使用 TOTP 应用（Google Authenticator、1Password、Authy 等）绑定。 |
| **图片加载慢？** | ① 开启对象存储的 CDN 模式；② 在 `next.config.mjs` 中配置 `remotePatterns` 与图片格式优化；③ 执行 `prisma/add_performance_indexes.sql` 添加数据库索引。 |
| **如何迁移数据 / 重建索引？** | 生产环境执行 `pnpm run prisma:deploy`；索引补全直接在数据库执行 `add_performance_indexes.sql`。 |
| **忘记管理员密码？** | 执行 `pnpm exec tsx scripts/update-password.ts` 重置密码。 |
| **如何切换画廊主题？** | 每个相册可在后台单独设置主题（瀑布流 / 单列 / 模板），按相册粒度切换。 |

---

## 🛠 开发小抄

### 开发与启动

| 命令 | 说明 |
|------|------|
| `pnpm install` | 安装依赖 |
| `pnpm run dev` | 标准开发模式（需先手动迁移） |
| `pnpm run dev:server` | **推荐**：自动执行 Prisma 迁移 + 种子数据 + 启动 dev server |
| `pnpm run dev:turbopack` | 同上，使用 Turbopack 加速 |

### 数据库

| 命令 | 说明 |
|------|------|
| `pnpm run prisma:dev` | 创建本地迁移（交互式） |
| `pnpm run prisma:deploy` | 生产环境执行迁移 |
| `pnpm run prisma:generate` | 生成 Prisma Client（类型提示） |
| `pnpm run prisma:seed` | 写入种子数据（默认 admin + 标签） |
| `pnpm run prisma:studio` | 启动可视化数据库浏览器（默认 http://localhost:5555） |

### 构建（不同平台）

| 命令 | 适用场景 | 执行流程 |
|------|----------|----------|
| `pnpm run build` | 已完成迁移的环境 | 仅 `next build` |
| `pnpm run build:vercel` | Vercel 平台 | `prisma:deploy → prisma:generate → prisma:seed → next build` |
| `pnpm run build:netlify` | Netlify 平台 | 同上 |
| `pnpm run build:node` | Node 自托管 | `prisma:deploy → prisma:generate → next build` |
| `pnpm start` | 启动生产服务（需先 build） | — |

### 代码质量

| 命令 | 说明 |
|------|------|
| `pnpm run lint` | ESLint 代码检查 |
| `pnpm run type-check` | TypeScript 类型检查（`tsc --noEmit`） |
| `pnpm run format` | Prettier 代码格式化 |

---

## 🙏 致谢

- 感谢 [PicImpact](https://github.com/besscroft/PicImpact) 项目提供的优秀参考！
- 本项目基于 JetBrains 开源许可证开发，感谢 [JetBrains](https://www.jetbrains.com/) 的支持。

<div align="center">
  <img src="https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg" alt="JetBrains" height="40"/>
  &nbsp;&nbsp;
  <img src="https://resources.jetbrains.com/storage/products/company/brand/logos/IntelliJ_IDEA.svg" alt="IntelliJ IDEA" height="40"/>
</div>

---

## 📄 License

XPhotos is open source software licensed as [MIT](LICENSE).
