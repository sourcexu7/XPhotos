# XPhotos 前台 UI 参考

> 适用范围：`app/(default)/**`、`app/(theme)/**` 路由，以及公共的画廊 / 主题 / Hero 组件。
>
> 接口详细参数请参考 [api-reference.md](./api-reference.md)。本文档仅保留"数据来源 → api-reference 某章节"的链接式引用。

---

## 一、前台路由总览

| 路径 | 页面 | 数据来源 API | 关键交互 |
| --- | --- | --- | --- |
| `/` | 首页（Hero + 精选相册封面） | 服务端 `fetchFeaturedImages()` + `fetchAlbumsShow()`；或 `GET /api/v1/public/site-info`（站点信息） | `HeroSection` 背景自动轮播；"开始"按钮跳转到 `/covers`；`AlbumGrid` 展示相册封面 |
| `/covers` | 相册封面列表页 | `GET /api/v1/public/covers`（见 api-reference.md 2.1） | 点击封面进入对应主题相册页；返回按钮回到 `/albums` |
| `/albums` | 作品合集（瀑布流 / 单列 切换） | `GET /api/v1/public/gallery/images?page=&album=%2F&...`（见 api-reference.md 2.1） | 瀑布流/单列切换、筛选（相机/镜头/标签）、排序（拍摄时间） |
| `/about` | 关于我 | `GET /api/v1/public/about-info`（见 api-reference.md 2.1） | 社交链接外链、画廊图片轮播、关于我文案渲染 |
| `/preview/[...id]` | 图片详情预览 | `GET /api/v1/images/:id` 或 `GET /api/public/images/get-image-by-id`（见 api-reference.md 2.3 / 3.6） | 复制直链 / 下载 / 全屏查看 / 标签跳转、前后切换（lightbox） |
| `/theme/[...album]` | 主题相册页（某相册内全部图片） | `GET /api/v1/public/gallery/images?album=<albumValue>`（见 api-reference.md 2.1） | 返回 /covers、主题（瀑布流/单列）切换、图片点击进入预览弹窗 |
| `/guides` | 攻略列表（公开） | `GET /api/v1/guides/public/list`（见 api-reference.md 3.5） | 卡片列表、点击进入单篇攻略详情 |
| `/guides/[id]` | 单篇攻略详情 | `GET /api/v1/guides/public/:id`（见 api-reference.md 3.5） | 目录导航、模块内容渲染、图集查看 |

---

## 二、页面级交互说明

### 2.1 首页 `/`

**页面用途**：用大尺寸 Hero 图像营造视觉第一印象，快速引导用户进入 `/covers`（相册封面墙）或 `/albums`（作品合集）。

**关键组件 / 数据来源**
- `components/hero/hero-section.tsx`：Hero 区，内部使用背景轮播（精选图片来自 `fetchFeaturedImages()`）
- `components/album/album-grid.tsx`：相册封面卡片网格（来自 `fetchAlbumsShow()`）
- 主题 / 语言切换入口由全站统一 `command` / `header` 组件注入

**交互流程**
1. 进入页面 → 展示 Hero + 相册封面网格
2. 点击 Hero "开始"按钮 → `router.push('/covers')`（或 `safePush`）
3. 点击任一相册封面 → 进入对应 `/theme/<albumValue>`

**移动端适配要点**
- Hero 文本垂直居中，按钮字号下调
- 相册封面网格从多列 → 1-2 列（依赖 Tailwind `sm / md / lg`）

---

### 2.2 `/covers` 相册封面页

**页面用途**：以相册维度"横向浏览"站点内容，每本相册一张封面 + 标题 + 描述。

**关键组件 / 数据来源**
- 入口：`app/(default)/covers/page.tsx` → `app/(default)/covers/covers-client.tsx`
- 数据：`GET /api/v1/public/covers`（SWR 缓存：`revalidateOnFocus=false`、`dedupingInterval=60s`）
- 返回按钮：跳回 `/albums`

**移动端适配要点**
- 封面卡片从横向滑动或 3 列 → 1-2 列
- "返回作品合集"按钮变为简洁 icon + 短文案

**常见交互陷阱**
- 加载失败要显示 SWR 错误重试（`mutate()` 触发重加载）
- 封面图片为空或未设置封面的相册应有占位图或隐藏

---

### 2.3 `/albums` 作品合集页

**页面用途**：跨相册的全量图片画廊，支持主题切换、多条件筛选与排序。

**关键组件 / 数据来源**
- 入口：`app/(default)/albums/page.tsx` → `components/layout/shared-albums-page.tsx` → `components/layout/theme-gallery-client.tsx`
- 数据：`GET /api/v1/public/gallery/images`（支持 `page / album / cameras / lenses / tags / tagsOperator / sortByShootTime`，见 api-reference.md 2.1）
- 主题：`SimpleGallery`（单列大尺寸）与 `WaterfallGallery`（瀑布流）二选一，悬浮按钮使用 `LayoutGrid / Rows` 切换
- 筛选面板：相机 MultiSelect、镜头 MultiSelect、标签 MultiSelect + AND/OR 逻辑切换
- 排序 Popover：按拍摄时间「默认 / 最新 / 最早」

**交互流程**
1. 首次加载 → 读取 `useSWRInfinite`（或 `useSwrPageTotalHook`）分页数据
2. 用户点击筛选按钮 → 展开 `Sheet`（移动端）或 `Popover`（桌面端），修改筛选状态并触发重新拉取
3. 用户点击排序 Popover → 设置 `sortByShootTime`（`'asc' | 'desc' | undefined`），重新拉取
4. 点击图片 → 打开预览弹窗 `/preview/[id]`（或使用 `@modal/(...)preview/[id]` 的 Parallel Route）

**移动端适配要点**
- 筛选面板使用右抽屉 `Sheet`，避免水平溢出
- 筛选/排序悬浮按钮合并为一个 Command 入口或垂直堆叠

---

### 2.4 `/about` 关于我

**页面用途**：展示作者介绍、社交链接、轮播画廊图片。

**关键组件 / 数据来源**
- 入口：`app/(default)/about/page.tsx`
- 数据：`GET /api/v1/public/about-info`（见 api-reference.md 2.1）
- 轮播：`framer-carousel` 或 `components/ui/framer-carousel.tsx`
- 社交链接：若字段非空则渲染，点击新窗口打开（`target=_blank`）

**移动端适配要点**
- 轮播组件在窄屏下仅展示 1 张图片
- 社交链接图标行垂直居中、自动换行

---

### 2.5 `/preview/[...id]` 图片详情预览

**页面用途**：显示单张图片的大图、元数据、下载与分享。同时被 `@modal/(...)preview/[id]` 的 Parallel Route 复用为弹窗。

**关键组件 / 数据来源**
- 入口：`app/(default)/preview/[...id]/page.tsx` → `components/album/preview-image.tsx`、`components/album/preview-image-exif.tsx`
- 数据：图片详情通过 `props.data` 传递（路由页面内调用 `/api/v1/images/:id` 或等价服务端查询）
- 关键按钮：复制直链、复制分享链接、下载、全屏 lightbox、标签跳转

**交互流程**
1. 点击"下载"→ `GET /api/public/download/:id?storage=s3|r2` → 返回文件流或 JSON 直链
2. 点击全屏 → 进入 `setLightboxPhoto(true)`，支持左右键 / 触摸滑动切换
3. 点击标签 → 跳转 `/tag/<tag>`（如已实现）或回 `/albums` 并带上筛选参数

**移动端适配要点**
- 按钮组横向滚动或折叠成 icon-only
- 元数据使用 `dl/dt/dd` 纵向排版

---

### 2.6 `/theme/...album` 主题相册页

**页面用途**：以相册维度浏览单本相册，切换瀑布流 / 单列两种布局。

**关键组件 / 数据来源**
- 入口：`app/(theme)/[...album]/layout.tsx` + `page.tsx`；使用 `shared-albums-page` 复用 `/albums` 的筛选/排序/主题切换逻辑，但 `album` 参数为具体相册值
- 数据：`GET /api/v1/public/gallery/images?album=<albumValue>`
- 返回按钮：`components/layout/covers-back-button.tsx`（回 `/covers`；有 history 则 `router.back()`）

**移动端适配要点**
- 同 `/albums`：筛选项使用 Sheet，图片间距缩小

---

### 2.7 `/guides` 攻略列表页 / 单篇攻略页

**页面用途**（列表）：展示所有公开的攻略（标题、封面、国家/城市、天数）。
**页面用途**（单篇 `/guides/[id]`）：渲染攻略正文、模块、目录。

**关键组件 / 数据来源**
- 列表：`app/(default)/guides/page.tsx` → `GET /api/v1/guides/public/list`
- 详情：`app/(default)/guides/[id]/page.tsx` → `GET /api/v1/guides/public/:id`
- 内容渲染：`components/guides/markdown-renderer.tsx` + `components/guides/guide-toc.tsx`（目录）

**移动端适配要点**
- 攻略正文卡片单列展示
- 目录悬浮在右下角，点击展开 / 关闭 Sheet

---

## 三、通用交互点

### 3.1 主题切换（深色 / 浅色）

- 实现位置：全站统一 `ThemeSelector`（或由 `next-themes` 驱动）
- 样式风格：`custom_index_style` 0/1/2（默认 / 简约 / 瀑布流），本地持久化到 `localStorage.preferredTheme`
- 切换：`setTheme` 后 `window.location.reload()` 或 `next-themes` 内部处理
- 与 Tailwind `dark` 类配合，`html` 上挂载 `data-theme` / `class="dark"`

### 3.2 瀑布流布局与懒加载

- 组件：
  - `components/layout/theme/default/main/default-gallery.tsx`（默认画廊）
  - `components/layout/theme/simple/main/simple-gallery.tsx`（单列）
  - `components/layout/theme/waterfall/main/waterfall-gallery.tsx`（瀑布流）
  - `components/ui/virtual-waterfall-gallery.tsx`（虚拟瀑布流，大数据量时使用）
  - `components/ui/virtual-image-gallery.tsx`（虚拟画廊）
- 图片组件：
  - `components/gallery/simple/gallery-image.tsx` / `simple-gallery-card.tsx`
  - `components/gallery/waterfall/waterfall-image.tsx`
  - `components/album/progressive-image.tsx`（渐进加载，带 blurhash）
  - `components/ui/image-with-loading.tsx` / `img-with-loading.tsx`（带骨架屏）
- 懒加载策略：
  - 使用 Next.js `next/image` 的 `loading="lazy"` + 本地 `IntersectionObserver`
  - 瀑布流通过列高度平衡放置（`columns-{n}` 或绝对定位）
  - 图片预加载：`use-image-preload.ts` hook 预加载相邻图片，减少滚动时白屏

### 3.3 预览弹窗（`@modal` Parallel Route）

- 路径：`app/@modal/(...)preview/[id]/page.tsx`
- 交互：点击画廊图片触发，内容复用 `/preview/[...id]` 的 `PreView` 组件
- 关闭：点击遮罩 / Esc / 关闭按钮 → 不改变 URL 历史，仅在服务端路由中消失（或由父组件 `setOpen(false)`）

### 3.4 下载与原图查看

- 下载：`GET /api/public/download/:id?storage=s3|r2`（见 api-reference.md 2.2）
  - 若后端返回 `Content-Disposition: attachment; ...` → 浏览器下载；否则前端通过 `fetch + Blob + a[download]` 触发下载
- 原图直链：`props.data.url`（由 `/images/add` 写入时的存储直链或预签名 GET URL）
- 权限：是否开放下载、是否开放原图由 `custom_index_download_enable` 等配置控制（来自 `site-info` / `custom-info`）

### 3.5 图片画廊（simple / virtual）

- `SimpleGallery`：一次性加载或分页 `fetchMore`，`onClick` 打开预览弹窗
- `VirtualWaterfallGallery`：支持虚拟滚动，仅渲染视口内 + 前后 buffer 的图片；适合大量图片（千张级）
- 统一事件：点击 → 跳 `/preview/[id]` 或 `@modal` 弹窗；hover → 显示 EXIF 信息浮层；长按 / 右键 → 下载

---

## 四、可访问性与响应式要点

- **焦点可见**：全局保留 `:focus-visible` 样式（由 Tailwind / antd 提供）
- **Alt 文本**：`next/image` 与原生 `<img>` 均需有意义的 `alt`（如 "相册：xxx，图片标题：xxx"），否则空串 `alt=""`
- **语义化标签**：页面头部使用 `<header>` / `<main>` / `<footer>`；画廊图片使用 `<figure>` + `<figcaption>`（必要时）
- **键盘可用**：所有链接 / 按钮可 Tab 聚焦；弹窗与 Sheet 自动聚焦首元素；Esc 关闭
- **颜色对比度**：浅色 / 深色主题各自满足 WCAG AA 文本对比度（4.5:1）
- **图片懒加载**：全部使用 `loading="lazy"` + 明确的 `width/height` 或 `aspect-ratio`，避免 CLS
- **响应式断点**：
  - `sm`（640px）：单列；`md`（768px）：2 列；`lg`（1024px）：3 列；`xl`：4 列
  - 顶部导航在 `md` 以下折叠为汉堡 + `Command` 菜单（`components/layout/command.tsx`）
- **动效降级**：尊重 `prefers-reduced-motion`；大幅动画（如 Framer Carousel）在启用"减少动效"时切换为静态展示

---

## 来源文档清单

1. `docs/ui/frontend.md`（按钮级交互与接口映射）
2. `docs/reference/api-reference.md`（接口详细参数）
3. `app/(default)/**/*`（前台页面路由：home / covers / albums / about / preview / guides）
4. `app/(theme)/**/*`（主题相册路由）
5. `components/album/*`（相册、预览、渐进加载图片、标签画廊）
6. `components/hero/*`（Hero Section、动态背景）
7. `components/gallery/**/*`（simple / waterfall 两种画廊图像组件）
8. `components/layout/theme/**`（default / simple / waterfall / template 主题画廊与导航）
9. `components/layout/*`（共享相册页、主题选择器、统一导航、Command 菜单、Footer、Dark Theme Enforcer 等）
10. `components/ui/*`（虚拟瀑布流、虚拟画廊、图片加载动画、对话框、Sheet、Drawer、Framer Carousel、Toast、Dark-mode Toggle 等共享 UI）
