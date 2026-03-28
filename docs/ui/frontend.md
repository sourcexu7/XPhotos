# 前台功能文档（按钮级）

本文件覆盖前台页面（含 `(default)`、`(theme)`、`@modal`）的主要功能与按钮/交互点，并在每个按钮条目中标注其关键行为与可能触发的网络请求。

> 接口细节见 `docs/api/*`。本文件侧重“用户能点到的东西”。

## 路由总览（前台）

- `/`：首页（Hero）
- `/covers`：相册封面列表（城隅寻迹）
- `/albums`：作品合集（支持筛选/排序/主题切换）
- `/about`：关于我（公开配置 + 轮播）
- `/preview/[...id]`：图片预览页（复制/下载/全屏/关闭）
- `/theme/[...album]`：主题相册页（返回/主题切换）
- `@modal/(...)preview/[id]`：预览弹窗（内部复用 `/preview`）

---

## `/` 首页（`app/(default)/page.tsx` → `components/layout/hero-section.tsx`）

### 关键区块

- **自动轮播背景**：`ImageAutoSlider`（展示精选图片）

### 按钮/交互点

- **Start 按钮**
  - **位置**：Hero 标语下方
  - **行为**：跳转到 `/covers?from=hero`
  - **实现**：`components/layout/hero-section.tsx` 的 `handleStartClick()` 使用 `safePush(router, '/covers?from=hero')`
  - **请求**：无直接请求；但组件 `useEffect` 会 `router.prefetch('/covers')`（预取路由资源）

---

## `/covers` 相册封面页（`app/(default)/covers/page.tsx` → `app/(default)/covers/covers-client.tsx`）

### 数据来源

- `GET /api/v1/public/covers`（SWR 缓存，`revalidateOnFocus=false`，`dedupingInterval=60s`）

### 按钮/交互点

- **返回作品合集**
  - **行为**：跳转 `/albums`
  - **控件**：`Button(ghost) + ArrowLeft`
- **重新加载**
  - **出现条件**：加载 `covers` 失败
  - **行为**：调用 SWR `mutate()` 触发重新请求 `GET /api/v1/public/covers`
- **相册卡片（DestinationCard）**
  - **行为**：进入相册主题页
  - **跳转目标**：`${album.album_value}?style=1`（为单列主题偏好传参）

---

## `/albums` 作品合集（`app/(default)/albums/page.tsx` → `components/layout/theme-gallery-client.tsx`）

### 关键能力

- **主题切换**：瀑布流 / 单列（悬浮按钮）
- **筛选面板**（本页启用 `enableFilters`）
  - 相机（多选）
  - 镜头（多选）
  - 标签（多选 + AND/OR）
- **排序**（悬浮 Popover）：按拍摄时间从新到旧/从旧到新/默认

### 按钮/交互点（悬浮区）

实现：`components/layout/theme-gallery-client.tsx`

- **排序按钮（ArrowUpDown）**
  - **出现条件**：`enableFilters=true` 且 `album==='/'`（作品合集）
  - **行为**：打开 Popover，选择：
    - “从新到旧” → `setSortByShootTime('desc')`
    - “从旧到新” → `setSortByShootTime('asc')`
    - “默认排序” → `setSortByShootTime(undefined)`
- **筛选按钮（Filter）**
  - **行为**：展开/收起筛选面板（`setFiltersOpen`）
  - **自动收起规则**：页面滚动向下时自动收起；点击面板外自动收起（对 Popover/Command 做了白名单）
- **主题切换按钮（Rows/LayoutGrid）**
  - **行为**：在瀑布流与单列间切换（`toggleTheme()`）

### 筛选面板内交互点

- **相机 MultiSelect**：变更 `cameraFilter`
- **镜头 MultiSelect**：变更 `lensFilter`
- **标签 MultiSelect**：变更 `tagsFilter`
- **标签逻辑 AND/OR**
  - **出现条件**：已选择至少 1 个标签
  - **行为**：切换 `tagsOperator`

---

## `/about` 关于我（`app/(default)/about/page.tsx`）

### 数据来源

- `GET /api/v1/public/about-info`（SWR）

### 按钮/交互点

- **重新加载**
  - **出现条件**：接口加载失败
  - **行为**：`mutate()` 重新请求 `GET /api/v1/public/about-info`
- **社交链接按钮组（INS/小红书/微博/GitHub）**
  - **出现条件**：对应链接配置不为空
  - **行为**：新窗口打开（`target="_blank"`）
- **轮播（FramerCarousel）**
  - **行为**：展示配置的画廊图片；点击查看行为由组件内部决定（详见 `components/ui/framer-carousel`）

---

## `/preview/[...id]` 图片预览（`app/(default)/preview/[...id]/page.tsx` → `components/album/preview-image.tsx`）

### 按钮/交互点（信息栏操作区）

实现：`components/album/preview-image.tsx`

- **关闭按钮（X）**
  - **行为**：优先 `router.back()`；若无历史则跳回图片所在相册 `album_value`，否则回 `/`
- **复制图片直链（CopyIcon）**
  - **行为**：复制 `props.data.url` 到剪贴板；成功后 toast（含 license 提示）
- **复制分享链接（LinkIcon）**
  - **行为**：复制 `window.location.origin + '/preview/' + props.id` 到剪贴板
- **下载（DownloadIcon）**
  - **出现条件**：配置 `custom_index_download_enable=true`
  - **行为**：
    - 调用 `GET /api/public/download/:id?storage=s3|r2`
    - 若返回 JSON（direct_download 模式）：再 `fetch(data.url)` 下载 blob
    - 若返回附件流：读取 `Content-Disposition` 推断文件名并下载 blob
- **全屏查看（ExpandIcon）**
  - **行为**：打开 lightbox（`setLightboxPhoto(true)`）
- **标签 Tag（点击标签）**
  - **出现条件**：`labels` 非空
  - **行为**：跳转 `/tag/<tag>`

---

## `/theme/[...album]` 主题相册页（`app/(theme)/[...album]/page.tsx`）

### 按钮/交互点

- **返回相册列表**
  - **实现**：`components/layout/covers-back-button.tsx`
  - **行为**：优先 `router.back()`；若历史不足则 `router.push('/covers')`
  - **性能**：会预取 covers 数据（`useCoversPrefetch()`）
- **主题切换按钮（悬浮）**
  - **实现**：同 `ThemeGalleryClient`（瀑布流/单列切换）

---

## `@modal/(...)preview/[id]` 预览弹窗（`app/@modal/(...)preview/[id]/page.tsx`）

- **说明**：弹窗内容直接复用 `/preview` 页组件（`PreView`），因此按钮行为与 `/preview` 一致。

