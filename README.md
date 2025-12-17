<h1 align="center">
<img width="28" src="./public/maskable-icon.png">
XPhotos
</h1>

基于 Next.js 的响应式个人摄影网页与管理后台。

基于开发的响应式个人摄影网页，支持摄影作品多图轮播展示、分类筛选、后台作品上传/管理，适配移动端/桌面端，优化图片加载性能。



## 技术栈

- Node: `>=20`
- Next.js: `15`
- License: `MIT`
- Database: PostgreSQL（Prisma）
  笔者基于vercel+supabase+S3+Cloudfare进行搭建



## 视觉预览

- 首页：
  - ![首页预览](public/screenshots/home-desktop.png)
- 瀑布流展示：
  - ![瀑布流预览](public/screenshots/waterfall.png)
- 单列展示：
  - ![单列预览](public/screenshots/detail.png)
- 相册：
  - ![相册预览](public/screenshots/album.png)
- 在线 Demo(科学)： ✨ 在线体验：https://x-photos.vercel.app/

### 默认账号密码
```bash
# 方式1：在 .env 文件中设置
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=YourSecurePassword123
ADMIN_NAME=your-username

# 方式2：在命令行中设置
ADMIN_EMAIL=your-email@example.com ADMIN_PASSWORD=YourSecurePassword123 ADMIN_NAME=your-username npx prisma db seed

如果不设置环境变量，将使用默认值(进入后台务必修改)：
邮箱：admin@xphotos.com
密码：Xphotos@123
用户名：admin
```

## vercel部署

你可以点击下面的按钮来一键部署到 Vercel，**然后将 `Build Command` 设置为 `pnpm run build:vercel`**，也可以 Fork 项目后手动部署到任何支持的平台。

> 我们推荐当新版本发布时您再进行版本更新！

<a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsourcexu7%2FXPhotos&env=DATABASE_URL,BETTER_AUTH_SECRET,BETTER_AUTH_PASSKEY_RP_ID,BETTER_AUTH_PASSKEY_RP_NAME"><img src="https://vercel.com/button" alt="Deploy with Vercel"/></a>

| Key          | 备注                                                                                                                                                                 |
|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| DATABASE_URL | `postgres://postgres.[your-supabase-project]:[password]@aws-0-[aws-region].pooler.supabase.com:6543/postgres?pgbouncer=true`，`?pgbouncer=true` 用于使用 supabase 的连接池。 |
| DIRECT_URL | `postgres://postgres.[your-supabase-project]:[password]@aws-0-[aws-region].pooler.supabase.com:5432/postgres`，用于 `prisma migrate`，如果使用非 serverless 数据库，与 `DATABASE_URL` 保持一致即可。                            |
| BETTER_AUTH_SECRET  | 权限机密，你可以执行 `npx auth secret` 生成一个，随机字符串即可。                                                                                                                        |
> 请根据您的数据库供应商来填写正确的数据库 `connect url`，表格中的示例为 `supabase` 供应商。


## 本地部署

以下步骤已基于仓库的 `package.json` 与 `.env.example` 精确整理，优先使用 `pnpm`（项目使用 pnpm 管理器）。

### 前置条件

- Node.js >= 20
- pnpm >= 9
- 数据库：PostgreSQL（用于 Prisma）；可使用本地或云端实例
- 可选：Docker（用于生产部署或数据库便捷运行）


### 克隆仓库

```bash
git clone https://github.com/sourcexu7/xphotos.git
cd xphotos
```

### 环境配置

- 在项目根目录复制示例：

```bash
cp .env.example .env
```

- 关键环境变量（示例，详见 `.env.example`）：

| 变量 | 说明 | 示例 |
|---|---|---|
| `DATABASE_URL` | Prisma / PostgreSQL 连接字符串 | postgres://postgres:postgres@localhost:5432/postgres |
| `DIRECT_URL` | Prisma 备用直连 URL（可与 DATABASE_URL 相同） | 同上 |
| `BETTER_AUTH_SECRET` | 用于 auth 的随机密钥（请生成） | LVm22IOrx... |
| 其它 | 如需要可参阅 `.env.example` | |

（注意：项目内并未使用 MongoDB；当前后端基于 Prisma + PostgreSQL。）

### 安装依赖

```bash
pnpm install
```

### 初始化数据库（Prisma）与开发启动

项目在开发脚本中包含 Prisma 的 migrate / seed 步骤，推荐直接运行：

```bash
pnpm run dev
```

该命令按 package.json 流程会运行 Prisma migrate/generate、执行 `prisma db seed`（若配置）并启动 Next.js 开发服务器。

### 或 单独命令（可选）

```bash
pnpm run prisma:dev       # 本地迁移（交互式）
pnpm run prisma:generate # 生成 Prisma 客户端
pnpm run prisma:seed     # 运行 seed 脚本（如果存在）
pnpm run dev             # 启动 Next.js 开发服务（含上面步骤的组合）
```

### 构建与生产运行

```bash
pnpm build
pnpm start
```

或按 package.json 的 vercel / netlify 流程执行对应预置脚本。

---

## 核心特性

- ✨ 视觉展示：支持首页大图轮播（Hero）、渐进式图片加载、Lightbox 全屏查看，聚焦摄影作品的视觉冲击力。
- 📸 作品管理：后台支持多图上传、Live Photo 支持、相册/标签管理与排序，适合批量管理摄影作品。
- 📱 响应式布局：桌面端提供瀑布流与单列两种画廊视图，移动端自动切换为单列以保证无畸变展示。
- ⚡ 性能优化：基于 Next.js 的 App Router + server actions，Server-side 渲染（SSR）结合静态生成（SSG）策略，与图片压缩策略提升加载效率。
- 🔧 易扩展：组件化 UI（shadcn/ui / Ant Design / Radix + Zustand）便于新增模块与自定义主题。
- 🚀 便捷部署：前端可一键部署至 Vercel；后端（Prisma + Hono/Next API）可部署至支持 Node.js 的主机或容器环境。

---

## 项目结构

按 Next.js App Router 规范组织，下面为核心目录与作用（只列出重点）：

```
XPhotos-master/
├─ app/                  # Next.js App Router 页面与布局
│  ├─ layout.tsx         # 全局 RootLayout（providers、metadata）
│  ├─ (default)/         # 默认主题页面：首页、albums、preview
│  ├─ (theme)/           # 可切换主题的相册路由
│  ├─ admin/             # 后台管理页面（dashboard、albums、upload、settings）
│  └─ api/               # Next API 路由（部分公共接口）
├─ components/           # 可复用组件（layout、album、admin、ui 等）
├─ lib/                  # 核心业务逻辑（db query、auth client、upload helper）
├─ server/               # 独立 Hono 服务的路由实现（可选部署）
├─ prisma/               # Prisma schema、seed 与迁移
├─ public/               # 静态资源（icons、fonts、占位图片）
└─ docs/                 # 文档与截图
```

核心文件：
- `app/layout.tsx`：全站 RootLayout，加载 providers、动态 metadata、umami script。
- `components/layout/theme-gallery-client.tsx`：画廊入口，切换瀑布/单列、前端筛选面板。
- `components/album/preview-image.tsx`：图片预览、EXIF、复制/下载逻辑。
- `lib/db/query/*`：数据库查询层（images、albums、configs、tags）。

---

## 部署建议

- 前端（Next.js）：推荐部署到 Vercel（自动识别 Next.js）；使用 `vercel` 或 GitHub Actions 自动化部署。
- 后端（Prisma + Hono / Next API）：可与前端合并部署（Vercel/Netlify Edge/Node）或独立部署到自托管服务器/云服务（需配置 `DATABASE_URL` 与环境变量）。

示例（Vercel）：

1. 在 Vercel 项目设置中添加环境变量（`DATABASE_URL`、`BETTER_AUTH_SECRET` 等）
2. 连接 GitHub 仓库并启用自动部署

---

## 常见问题（FAQ）

- Q：项目使用哪种数据库？
  - A：当前使用 Prisma 与 PostgreSQL（请参阅 `.env.example` 中 `DATABASE_URL`）。

- Q：如何添加第三方存储（S3 / Cloudflare R2 / AList）？
  - A：项目已内置多种存储支持（参见 `components/admin/settings/storages` 与 `lib/s3.ts`, `lib/r2.ts`, `server/storage`）。在设置页中配置对应凭证并测试连接,笔者本地测试了S3和Alist可以用，Cloudflare R2不详后期测试。


### 感谢

感谢 https://github.com/besscroft/PicImpact 项目的优秀经验！！

本项目使用 JetBrains 的开源许可证，基于 IntelliJ IDEA 开发，感谢！

![JetBrains 徽标（主要） logo](https://resources.jetbrains.com/storage/products/company/brand/logos/jb_beam.svg)

![IntelliJ IDEA logo](https://resources.jetbrains.com/storage/products/company/brand/logos/IntelliJ_IDEA.svg)

### License

XPhotos is open source software licensed as [MIT](https://github.com/sourcexu7/XPhotos/blob/main/LICENSE).
