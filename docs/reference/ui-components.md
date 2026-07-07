# XPhotos UI 组件与主题参考

> 本页统一说明项目中 **分散在 `components/**` 目录下的通用组件、主题、导航与加载动效**，取代原来散落在 `components/ui/LOADING_*.md`、`components/layout/UNIFIED_NAV_README.md`、`components/layout/theme/**/README.md` 等多份小文档。如果你只想知道"某个组件怎么用"，在本页基本都能找到。

---

## 一、组件目录职责速览

| 目录 | 定位 | 典型组件 |
|------|------|----------|
| `components/ui/` | shadcn/ui 风格的基础 UI 组件（按钮、卡片、对话框、表格、图片画廊等），也包含加载动效等视觉小工具 | `button / card / dialog / table / image-gallery / loading-animation / image-loading-animation / image-with-loading / accordion / breadcrumb / sonner …` |
| `components/layout/` | 布局相关组件：统一导航、主题切换器、主题画廊渲染器、相册导航等 | `unified-nav`、`theme-selector`、`theme-gallery-client`、`album-nav`、`footer`、`command`、`covers-back-button` |
| `components/layout/theme/<name>/` | 特定主题的渲染器（default / simple / template / waterfall） | `main/*-gallery.tsx`、`nav/*-nav.tsx` |
| `components/album/` | 相册/预览页通用组件（可在多个主题中复用） | `album-grid`、`blur-image`、`live-photo`、`motion-image`、`preview-image`、`preview-image-exif`、`progressive-image`、`tag-gallery` |
| `components/gallery/` | 特定主题使用的画廊组件 | `simple/simple-gallery-card`、`simple/gallery-image`、`waterfall/waterfall-image` |
| `components/admin/` | 管理后台专用组件（Ant Design 体系） | `list / album / dashboard / settings / upload …` |

---

## 二、加载动效（Loading Animation）

### 2.1 组件清单

| 组件 | 文件位置 | 用途 |
|------|----------|------|
| `LoadingAnimation` | `components/ui/loading-animation.tsx` | 全屏加载动效（带遮罩） |
| `LoadingAnimationProviders` | `app/providers/loading-animation-providers.tsx` | 在 `app/layout.tsx` 中注入的 Provider，页面加载时自动显示/隐藏 |
| `ImageLoadingAnimation` | `components/ui/image-loading-animation.tsx` | 图片加载中的内联动效（不占全屏），可选 `small / medium / large` |
| `ImageWithLoading` | `components/ui/image-with-loading.tsx` | Next.js `<Image>` 的包装版，图片加载期间自动显示 `ImageLoadingAnimation` |
| `ImgWithLoading` | `components/ui/img-with-loading.tsx` | 原生 `<img>` 的包装版，用法同上 |

### 2.2 LoadingAnimation Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | `boolean` | `undefined` | 是否显示（受控模式）；未传时由页面加载状态自动控制 |
| `backgroundColor` | `string` | `'rgba(0,0,0,0.5)'` | 遮罩背景色 |
| `circleColor` | `string` | `'#fff'` | 圆圈颜色 |
| `shadowColor` | `string` | `'rgba(0,0,0,0.9)'` | 阴影颜色 |
| `autoHide` | `boolean` | `true` | 页面加载完成后是否自动隐藏 |
| `autoHideDelay` | `number` | `300` | 自动隐藏延迟（毫秒） |

### 2.3 典型用法

```tsx
// 1. 全局自动加载（已在 app/layout.tsx 注入，无需手动再做）
<LoadingAnimationProviders>{children}</LoadingAnimationProviders>

// 2. 手动控制某块区域
'use client'
import { LoadingAnimation, useLoadingAnimation } from '~/components/ui/loading-animation'

export default function Page() {
  const { isLoading, show, hide } = useLoadingAnimation()
  const load = async () => {
    show()
    try { await fetch('/api/data') } finally { hide() }
  }
  return <button onClick={load}>加载</button>
}

// 3. 图片加载动效（推荐）
import { ImageWithLoading } from '~/components/ui/image-with-loading'

<ImageWithLoading src="/image.jpg" alt="作品" width={800} height={600} loadingSize="medium" />
```

### 2.4 响应式与降级

- 内置响应式：`> 768px / 481–768 / ≤480 / ≤360` 四档自动缩放
- 支持 `prefers-reduced-motion`（用户关闭动画时降级）
- 使用 `transform: translateZ(0)` 开启硬件加速，避免 Safari 卡顿

---

## 三、统一导航栏（UnifiedNav）

### 3.1 组件职责

`components/layout/unified-nav.tsx` 在前台所有页面顶部固定显示，由三部分组成：

| 区域 | 组件 | 说明 |
|------|------|------|
| 左 | Logo | 品牌标识 |
| 中 | `AlbumSelector`（`components/layout/theme/waterfall/nav/album-selector.tsx`） | 下拉选择"全部照片 / 某相册"，当前选中项高亮；自动过滤掉根路径 `/` 以避免重复 |
| 右 | `ThemeSelector` + 图标组（首页 / 相册 / 设置等） | 用户切换主题，或跳转其他入口 |

### 3.2 主题切换器（ThemeSelector）

- 可选主题：`0=默认主题`、`1=单列主题`、`2=瀑布流主题`
- 选中值保存到 `localStorage.preferredTheme`
- 优先级：**用户选择 > 后台配置的默认主题**
- 切换后自动刷新页面以应用新主题
- 后台配置入口：`/admin/settings/preferences`（`custom_index_style`）

### 3.3 数据来源

- `UnifiedNav` 与 `AlbumSelector` 都从服务端获取最新相册列表（条件：`del=0`）
- 支持多语言：`messages/zh.json` / `en.json` / `ja.json` / `zh-TW.json`

---

## 四、前台主题

项目内置 **4 个画廊主题**，可在后台按"首页主题"或"按相册指定主题"切换。

### 4.1 主题一览

| 主题 | 目录 | 布局 | 导航样式 | 典型场景 |
|------|------|------|----------|----------|
| 默认（default） | `components/layout/theme/default/` | 多行卡片 | 固定顶部导航 | 通用展示 |
| 单列（simple） | `components/layout/theme/simple/` | 单列垂直 | 固定顶部导航 | 博客 / 长图叙事 |
| 模板（template） | `components/layout/theme/template/` | 自定义 Hero + 封面 | 可定制 Hero | 作品集合页 |
| 瀑布流（waterfall） | `components/layout/theme/waterfall/` | CSS `columns` 多列 | 顶部悬浮 + 滚动模糊 | 摄影作品集（默认推荐） |

> 新增主题：复制 `components/layout/theme/template/` 作为起点，然后在 `theme-gallery-client.tsx` 中注册。

### 4.2 瀑布流主题（默认推荐）

位置：`components/layout/theme/waterfall/`

**布局特性：**
- 移动端 2 列 / 平板 3 列 / 桌面 4–5 列 / 最大宽度 1600px
- 使用 CSS `columns`（浏览器原生，性能好、自动平衡列高）
- `break-inside-avoid` 防止图片被列分割
- 滚动到底部前 800px 自动加载下一组（SWR + 无限滚动 hook）
- BlurHash 占位符 + lazy loading

**典型用法：**
```tsx
// components/layout/theme/waterfall/main/waterfall-gallery.tsx
<div className="columns-2 gap-4 md:columns-3 lg:columns-4 xl:columns-5">
  {images.map(image => <WaterfallImage key={image.id} photo={image} />)}
</div>
```

**样式约定：**
- 图片卡片：`mb-4 + hover:scale-[1.02] + transition-all duration-300`
- 顶部导航：`backdrop-blur-md + bg-white/80 + shadow-sm`，滚动 50px 后显示背景

**性能建议：**
- 图片宽度 800–1200px、WebP/JPEG、质量 80–85%
- 启用 BlurHash 避免布局偏移

---

## 五、相册通用组件（components/album/）

| 组件 | 文件 | 说明 |
|------|------|------|
| `AlbumGrid` | `album-grid.tsx` | 网格相册，多主题可复用 |
| `BlurImage` | `blur-image.tsx` | 模糊占位 + 渐入显示的图片 |
| `LivePhoto` | `live-photo.tsx` | LivePhoto 视频播放封装 |
| `MotionImage` | `motion-image.tsx` | Framer Motion 动画包装的图片 |
| `PreviewImage` | `preview-image.tsx` | 点击查看大图 |
| `PreviewImageExif` | `preview-image-exif.tsx` | 大图内显示 EXIF 元信息 |
| `ProgressiveImage` | `progressive-image.tsx` | 渐进式加载（缩略图→原图） |
| `TagGallery` | `tag-gallery.tsx` | 按标签分组展示图片 |

> 这些组件在不同主题间共享（`album/` 与 `gallery/`），避免重复实现。

---

## 六、维护约定

1. **新增通用组件时**：优先放入 `components/ui/`（纯 UI）或 `components/album/`（与图片/相册强相关）。只用于某个主题的组件，放入 `components/layout/theme/<主题名>/` 下。
2. **组件的 props 规范**：对外暴露的组件在本页的小节中列出关键字段（参见上文 2.2）；复杂 props 的完整 API 在源文件 JSDoc 中补充。
3. **加载动效的使用原则**：
   - 页面级加载用 `LoadingAnimationProviders`（已全局注入，不必再包）
   - 单张图片用 `ImageWithLoading` / `ImgWithLoading`
   - 局部异步操作（按钮触发请求）用 `useLoadingAnimation()` 手动控制
4. **主题开发约定**：
   - 每个主题独立子目录，至少包含 `main/*-gallery.tsx`（画廊主体）与可选的 `nav/*-nav.tsx`
   - 主题间通过 `components/layout/theme-gallery-client.tsx` 动态切换
   - 主题中复用 `components/album/*` 而非再实现一套"大图预览 / EXIF 展示"

---

## 七、来源与原始文档

本页信息来自以下散落文档合并整理，原文已在整合后删除：

- `components/ui/LOADING_ANIMATION_README.md` — 加载动效 API
- `components/ui/LOADING_INTEGRATION.md` — 全局集成说明
- `components/ui/IMAGE_LOADING_USAGE.md` — 图片加载动效用法
- `components/layout/UNIFIED_NAV_README.md` — 统一导航与主题切换
- `components/layout/theme/README.md` — 主题目录说明
- `components/layout/theme/template/README.md` — 主题模板说明
- `components/layout/theme/waterfall/README.md` — 瀑布流主题细节
- `components/album/README.md` — 相册通用组件说明
- `components/gallery/README.md` — 主题专用组件说明
