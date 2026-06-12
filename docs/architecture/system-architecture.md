# XPhotos 系统架构总览

> 本文档是面向新成员的「项目地图」，目标是用最小篇幅讲清：项目做什么、代码在哪、数据怎么流、哪些文档有细节。
> 所有具体实现细节均指向更细文档，不在这里展开。

---

## 一、项目目标与角色

**一句话目标**：XPhotos 是一个「单用户（摄影师）作品展示 + 后台作品管理」的个人摄影画廊系统。前台面向访客，后台面向管理员。

- **前台访客**：浏览照片、按相册/主题查看作品、查看攻略、RSS 订阅。
- **后台管理员**：上传图片、管理相册/标签、查看访问统计、配置存储与站点偏好、编辑攻略内容。

---

## 二、目录结构与职责

> 只列出一级/关键目录，方便新人快速定位。

| 路径 | 职责 | 主要内容 |
|------|------|---------|
| `app/` | Next.js App Router 路由层 | 前台页面（`(default)/`）、主题页（`(theme)/`）、后台页面（`admin/`）、API 聚合入口（`api/[[...route]]/`）、登录页、RSS |
| `components/` | UI 组件库 | 前台组件（`album/`、`gallery/`、`layout/theme/`、`hero/`）、后台组件（`admin/`、`layout/admin/`）、通用 UI（`ui/`） |
| `lib/` | 共享逻辑（非 HTTP） | DB 查询封装（`db/query/`、`db/operate/`）、文件上传（`file-upload.ts`）、JWT（`jwt.ts`）、存储适配（`s3.ts`、`r2.ts`、`cos.ts`）、Redis（`redis.ts`）、工具函数（`utils/`）、服务层（`services/`） |
| `server/` | Hono 服务端 API | 按资源拆分的路由模块（`images.ts`、`albums.ts`、`settings.ts`、`analytics.ts`、`auth.ts`、`guides.ts`等），聚合入口为 `server/index.ts` |
| `prisma/` | 数据库 schema 与迁移 | `schema.prisma`（**最终权威**）、`migrations/`、`seed.ts` |
| `hooks/` | React hooks | 画廊状态、图片预加载、上传状态、主题切换等 |
| `stores/` | 全局状态（Zustand） | 配置、按钮、选择状态 |
| `messages/` | i18n 多语言 | `zh.json`、`en.json` |
| `docs/` | 项目文档 | API（`docs/api/`）、参考（`docs/reference/`）、指南（`docs/guides/`）、UI（`docs/ui/`）、架构（`docs/architecture/`） |

---

## 三、前后端分层模型

从「用户请求」到「数据库」共 4 层，自顶向下：

```
┌─────────────────────────────────────────────────┐
│  [浏览器/访客]  ← HTTP →  [Next.js App Router]  │  ① 路由层：page.tsx / layout.tsx 渲染 SSR/客户端页面
└──────────────────┬──────────────────────────────┘
                   │ /api/** 、 /admin/**
                   ▼
┌─────────────────────────────────────────────────┐
│         Hono Server (app/api/[[...route]])      │  ② API 层：server/index.ts 聚合 server/*.ts
│   middleware/auth.ts 做 JWT / Cookie 鉴权        │
└──────────────────┬──────────────────────────────┘
                   │ Prisma Client (lib/db/*)
                   ▼
┌─────────────────────────────────────────────────┐
│               Prisma ORM                        │  ③ ORM 层：生成类型与查询构建器
└──────────────────┬──────────────────────────────┘
                   │ PostgreSQL 协议
                   ▼
┌─────────────────────────────────────────────────┐
│              PostgreSQL 数据库                  │  ④ 持久化层：真实数据表
└─────────────────────────────────────────────────┘

  横向辅助：
  ┌────────────┐   ┌──────────┐   ┌──────────────────┐
  │ Redis 缓存 │   │ 对象存储 │   │ 外部 CDN / 静态资源 │
  └────────────┘   └──────────┘   └──────────────────┘
     (lib/redis.ts)   (lib/s3/r2/cos/alist)
```

关键流向示例（上传一张图片）：

1. 访客在后台上传页（`/admin/upload`）选取图片 → 前端 `file-upload.ts` 预处理
2. Hono 路由 `server/file.ts` 接收 → 调用 `lib/s3.ts` 或 `lib/r2.ts` 存到对象存储
3. 写入 `Images` 表（Prisma），同时写入 `ImagesAlbumsRelation`、`ImagesTagsRelation`
4. 前台画廊通过 `server/open/gallery.ts` 读取 → Next.js 渲染 `components/gallery/` 或 `components/layout/theme/`

---

## 四、鉴权与访问控制

### 4.1 Token 传递
- **Cookie 方式**（主路径）：登录成功后设置 `auth_token` Cookie，`middleware.ts` 与 `server/middleware/auth.ts` 都读取它。
- **Header 方式**：`Authorization: Bearer <token>`，主要供脚本/外部调用。
- **Token 内容**：JWT，payload 含用户标识；签发与校验见 `lib/jwt.ts` 与 `server/auth.ts`。

### 4.2 受保护范围

| 范围 | 说明 |
|------|------|
| `/admin/**` 所有路由 | `middleware.ts` 拦截，无有效会话重定向至 `/login` |
| `/api/v1/settings/**` | 需登录 |
| `/api/v1/file/**` | 需登录（上传相关） |
| `/api/v1/images/**` | 写操作需登录；部分只读公开 |
| `/api/v1/albums/**` | 需登录 |
| `/api/v1/storage/**` | 需登录 |
| `/api/v1/analytics/**` | 需登录 |
| `/api/v1/auth/**`、`/api/public/**`、`/rss.xml` | 公开，无需鉴权 |

> 完整接口级鉴权标注详见 `docs/api/README.md` 与 `docs/reference/api-reference.md`。

---

## 五、数据模型总览

> 本节只给「实体关系线索」，字段与索引细节见 `docs/reference/data-model.md`；表定义**最终权威**是 `prisma/schema.prisma`。

```
Images  ─── ImagesAlbumsRelation  ─── Albums  ─── GuideAlbumsRelation  ─── Guides
   │                                                          │
   │                                                          ├── GuideComponents（旧版组件，兼容保留）
   │                                                          ├── GuideModules
   │                                                          │     └── GuideModuleContents
   │                                                          └── GuideTableOfContents
   │
   └── ImagesTagsRelation  ─── Tags (树形：parentId/children)

Configs （键值对，站点配置）
VisitLog （访问日志，供后台统计）
User / Account / Session / TwoFactor / Passkey / Verification （认证表族，better-auth）
```

- **Images ↔ Albums**：多对多，通过 `ImagesAlbumsRelation`，额外承载**相册内图片排序**（`sort` 字段 + `(album_value, sort)` 索引）。
- **Images ↔ Tags**：多对多，`Tags` 自身是**树形**结构（`parentId`、`category`）。
- **Guides**：攻略系统，有模块化编辑器（`GuideModules` + `GuideModuleContents`），可关联多个相册。
- **Configs**：单键单值，承载站点标题、存储配置、关于信息等。

详见 `docs/reference/data-model.md`。

---

## 六、存储与图片管线

对象存储支持 4 种后端（前台读路径统一通过站点 URL，后台写路径按配置调用）：

- **S3**：`lib/s3.ts`
- **Cloudflare R2**：`lib/r2.ts`
- **腾讯云 COS**：`lib/cos.ts`
- **AList**：`server/storage/alist.ts`、`lib/` 相关适配

**图片管线（上传 → 展示）**：

1. **上传**：`components/admin/upload/` + `lib/file-upload.ts` → 校验尺寸/格式 → 前端可选预处理
2. **存储**：调用对应存储 SDK 写入原图 → 回写 `original_key` / `url`
3. **预览图生成**：按配置 `preview_quality`、`preview_max_width_limit` 生成缩略/预览图 → 回写 `preview_key` / `preview_url`
4. **入库**：写 `Images` 表，补充 `blurhash`、`width`、`height`、`exif`、`shoot_at` 等元数据
5. **分类**：按管理操作写入 `ImagesAlbumsRelation`、`ImagesTagsRelation`
6. **展示**：前台通过 `BlurHash → 渐进式 → 预览图 → 原图` 流程渲染；瀑布流/网格主题见 `components/layout/theme/`

---

## 七、前后台路由地图

### 7.1 前台（访客）
| 路由 | 页面 |
|------|------|
| `/` | 首页（画廊，默认主题入口） |
| `/covers` | 封面图浏览 |
| `/albums` | 相册列表 |
| `/about` | 关于页（管理员信息） |
| `/preview/[...id]` | 图片详情/预览 |
| `/theme/[album]/...` | 主题相册浏览（瀑布流/网格等多主题） |
| `/guides`、`/guides/[id]` | 攻略列表与详情 |
| `/login` | 登录入口（也用于后台管理员登录） |
| `/rss.xml` | RSS 订阅源 |

### 7.2 后台（管理员，统一 `/admin/**`，由 `middleware.ts` 拦截）
| 路由 | 页面 |
|------|------|
| `/admin`、`/admin/dashboard`（或默认仪表盘） | 仪表盘：作品/统计总览 |
| `/admin/upload` | 图片上传（支持单/多/大文件） |
| `/admin/list` | 图片列表（筛选、批量编辑、删除） |
| `/admin/album`、`/admin/album/[albumValue]/sort` | 相册管理、相册内排序 |
| `/admin/guides`、`/admin/guides/[id]/edit` | 攻略管理与模块化编辑器 |
| `/admin/analytics`、`/admin/analytics/api` | 访问统计、统计数据接口 |
| `/admin/settings/preferences` | 站点偏好 |
| `/admin/settings/account` | 账号 |
| `/admin/settings/passkey` | Passkey |
| `/admin/settings/authenticator` | 2FA |
| `/admin/settings/tag` | 标签管理 |
| `/admin/settings/storages` | 存储配置（S3/R2/COS/AList） |
| `/admin/data-overview` | 数据总览（部分版本） |

前台 UI 与后台 UI 的组件级/按钮级交互详见：
- `docs/reference/frontend-ui.md`
- `docs/reference/admin-ui.md`
- `docs/guides/admin-ui-optimization.md`

---

## 八、性能与缓存要点

- **React.cache** 与服务端数据获取去重：查询层在 `lib/db/query/` 中使用。
- **数据库索引**：`Images(del,show,featured)`、`ImagesAlbumsRelation(album_value,sort)`、`Tags/Guides/VisitLog` 等关键索引，详见 `prisma/schema.prisma` + `db_optimizations.sql`。
- **Redis 缓存层**：`lib/redis.ts`，用于热点数据（配置、列表缓存）。
- **前端虚拟滚动**：`components/ui/virtual-waterfall-gallery.tsx`，长列表关键优化。
- **图片压缩管线**：`lib/utils/compress.ts` + 预览图尺寸/质量配置。

完整性能策略与指标体系详见 `docs/performance/` 与 `docs/reference/data-model.md` 的索引章节。

---

## 九、开发与部署流程

- **本地开发**：`next dev`；依赖 Node 18+/pnpm；PostgreSQL + 可选 Redis；`prisma migrate dev`。
- **构建**：`next build` → 产出 `.next/`；Prisma client 随构建生成。
- **生产部署**：项目提供 `Dockerfile`、`docker-compose.yml`、`deploy.yml`（CI）。常见路径：Vercel / Docker / 自建 Nginx + Next。
- **环境变量**：参考 `.env.example`（数据库、存储、JWT/认证密钥等）。
- **i18n**：`messages/zh.json`、`messages/en.json`，由 `next-intl` 或内置方案驱动（按项目实际）。

完整的部署排错与环境说明详见 `docs/README.md` 与项目根相关运维文档。

---

## 来源文档清单

本文件由下列真实文件抽取信息整理而成，细节请以它们为准：

1. `docs/api/README.md` — API 路由与鉴权总览
2. `docs/reference/data-model.md` — 数据模型参考（字段/索引/关系）
3. `docs/reference/api-reference.md` — 接口级鉴权与响应约定
4. `docs/guides/admin-ui-optimization.md` — 后台结构与优化成果
5. `docs/reference/admin-ui.md` / `docs/reference/frontend-ui.md` — 前后台路由与组件细节
6. `prisma/schema.prisma` — 数据模型**最终权威**
7. `app/`、`components/`、`lib/`、`server/` 源码目录结构
