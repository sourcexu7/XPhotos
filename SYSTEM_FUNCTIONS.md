# XPhotos 项目 — 仓库结构与系统功能说明

以下文档基于代码库中的实际文件与实现生成，内容精确反映代码逻辑、页面与组件中存在的所有功能点与按钮交互。

---

## 仓库文件结构（树形）

- XPhotos-master/
  - package.json
  - pnpm-lock.yaml
  - package-lock.json
  - next.config.mjs
  - tsconfig.json
  - tailwind.config.ts
  - postcss.config.mjs
  - README.md
  - Dockerfile
  - netlify.toml
  - LICENSE
  - .github/
    - workflows/
      - eslint.yaml
      - build-main.yaml
      - build-pull-request.yaml
      - build-release.yaml
  - .vscode/
    - launch.json
  - public/
    - manifest.json
    - robots.txt
    - favicon.svg, icons/, fonts/
  - app/
    - layout.tsx
    - globals-antd.css
    - providers/
      - antd-config-provider.tsx
      - button-store-providers.tsx
      - config-store-providers.tsx
      - next-ui-providers.tsx
      - progress-bar-providers.tsx
      - toaster-providers.tsx
    - @modal/
      - default.tsx
      - (...)preview/[id]/page.tsx
      - (...)preview/[id]/modal.tsx
    - (default)/
      - layout.tsx
      - page.tsx
      - about/page.tsx
      - albums/page.tsx
      - covers/page.tsx
      - preview/[...id]/page.tsx
    - (theme)/
      - layout.tsx
      - [...album]/page.tsx
    - login/page.tsx
    - sign-up/page.tsx
    - admin/
      - layout.tsx
      - page.tsx
      - album/page.tsx
      - list/page.tsx
      - upload/page.tsx
      - settings/
        - account/page.tsx
        - preferences/page.tsx
        - storages/page.tsx
        - tag/page.tsx
        - passkey/page.tsx
        - authenticator/page.tsx
    - api/[[...route]]/route.ts
  - components/
    - layout/
      - unified-nav.tsx
      - theme/
        - default/
          - header/default-header.tsx
          - main/default-gallery.tsx
        - template/
          - header/template-header.tsx
          - main/template-gallery.tsx
        - waterfall/
          - main/waterfall-gallery.tsx
          - nav/waterfall-nav.tsx
          - nav/album-selector.tsx
      - admin/
        - app-sidebar.tsx
        - antd-layout.tsx
    - admin/
      - album/
        - album-add-button.tsx
        - album-add-sheet.tsx
        - album-edit-sheet.tsx
        - album-list.tsx
        - refresh-button.tsx
        - album-title.tsx
      - list/
        - list-props.tsx
        - list-image.tsx
        - image-edit-sheet.tsx
        - image-batch-delete-sheet.tsx
      - settings/
        - storages/
          - s3-tabs.tsx
          - r2-tabs.tsx
          - alist-tabs.tsx
      - dashboard/
        - modern-dashboard.tsx
      - ui/
        - button.tsx
        - modal/antd-modal.tsx
        - settings/antd-settings.tsx
    - album/
      - preview-image.tsx
      - progressive-image.tsx
      - live-photo.tsx
      - preview-image-exif.tsx
      - tag-gallery.tsx
      - motion-image.tsx
    - gallery/
      - waterfall/waterfall-image.tsx
      - simple/gallery-image.tsx
    - ui/
      - button.tsx, input.tsx, select.tsx, dialog.tsx, table.tsx, pagination.tsx, 等
    - login/user-from.tsx
    - sign-up/sign-up-from.tsx
    - auth/passkey-login.tsx
    - auth/passkey-register.tsx
  - lib/
    - db/
      - query/
        - images.ts
        - albums.ts
        - configs.ts
        - tags.ts
      - operate/
        - images.ts
        - albums.ts
        - configs.ts
    - auth-client.ts
    - file-upload.ts
    - jwt.ts
    - s3.ts, r2.ts, s3api.ts, r2 helpers
    - utils/
      - fetcher.ts
      - file.ts
      - blurhash-client.ts
      - auth-utils.ts
  - server/
    - index.ts
    - auth.ts
    - images.ts
    - albums.ts
    - file.ts
    - settings.ts
    - open/
      - images.ts
      - download.ts
    - middleware/
      - auth.ts
  - prisma/
    - schema.prisma
    - seed.ts
    - migrations/
  - hooks/
    - use-swr-infinite-hook.ts
    - use-swr-page-total-hook.ts
    - use-mobile.ts
    - use-blurhash.ts
  - messages/
    - en.json
    - zh.json
    - ja.json
    - zh-TW.json
  - scripts/, docs/, style/, types/, components.json 等

---

## 系统功能说明文档（基于源代码实现的逐页面、逐按钮说明）

> 说明：以下内容严格对应仓库代码实现，列出每个页面/组件的功能点、每个按钮的具体作用与触发的后端/前端逻辑、以及权限约束或依赖的配置项。

### 全局（RootLayout）
- 文件：`app/layout.tsx`
- 功能：
  - 注入全局 providers（国际化、配置 store、button store、主题、Antd 配置、Toaster、进度条）。
  - 通过 `fetchConfigsByKeys` 读取 `custom_title` 和 `custom_favicon_url` 来生成 Metadata（title、favicon）。
  - 根据 `umami_analytics` 与 `umami_host` 插入 Umami 分析脚本（条件加载）。
  - 渲染 `children` 与 `modal`，并在 body 底部加入版权 footer。

### 默认首页（Hero）
- 文件：`app/(default)/page.tsx`
- 功能：
  - 调用 `fetchFeaturedImages()` 获取首页展示图片并传给 `HeroSection` 组件渲染。

### 相册索引（默认样式）
- 文件：`app/(default)/albums/page.tsx`
- 功能：
  - 提供 server actions：`getData(pageNum, album)`、`getPageTotal(album)`、`getConfig()`，分别调用 `fetchClientImagesListByAlbum`、`fetchClientImagesPageTotalByAlbum`、`fetchConfigsByKeys`。
  - 获取相机/镜头选项和标签（`fetchCameraAndLensList`、`fetchTagsList`）传给 `ThemeGalleryClient` 用作过滤器数据。
  - 具体画廊渲染、筛选、分页、图片点击等交互由 `ThemeGalleryClient` 实现（组件内部调用传入的 server actions）。

### 主题相册（指定相册与样式）
- 文件：`app/(theme)/[...album]/page.tsx`
- 功能：
  - 解析 URL params `album` 与 `style` 用于决定展示样式（single / waterfall / default）。
  - 顶部包含“返回相册列表”按钮（Link 到 `/covers`）。
  - 与默认相册相同的 server actions 传入 `ThemeGalleryClient`。

### 图片预览（页面与模态）
- 页面文件：`app/(default)/preview/[...id]/page.tsx`
- 模态文件：`app/@modal/(...)preview/[id]/page.tsx`, `app/@modal/(...)preview/[id]/modal.tsx`
- 功能（数据）：
  - `getData(id)`（server action）调用 `fetchImageByIdAndAuth(id)`，会根据后端逻辑考虑鉴权与图片权限返回数据。
  - `getConfig()` 读取 `custom_index_download_enable` 配置并传入 `PreviewImage`。
- `Modal`：使用 `Dialog` + `createPortal` 渲染到 `#modal-root`，并禁用交互外关闭（阻止点击外部关闭）。

### `PreviewImage` 组件详解（按钮/行为精确到实现）
- 文件：`components/album/preview-image.tsx`
- 数据来源：`props.data`（图片信息）、`props.configHandle`（用于读取配置）。
- 显示内容：图片（`ProgressiveImage` 或 `LivePhoto`）、EXIF 信息、描述、标签、操作按钮区域（复制直链、复制分享链接、下载、全屏）。
- 每个按钮的实现与触发逻辑：
  - 关闭（XIcon）：
    - 行为：调用 `handleClose()`；若浏览历史长度 > 1，调用 `router.back()`，否则 `router.push(props.data.album_value || '/')`。
  - 复制图片直链（CopyIcon）：
    - 行为：将 `props.data.url` 写入剪贴板（支持 navigator.clipboard，也提供 textarea fallback），成功后显示 toast；若图片含 license，提示 license 信息。
  - 复制分享链接（LinkIcon）：
    - 行为：复制 `window.location.origin + '/preview/' + props.id` 到剪贴板，成功后显示 toast。
  - 下载（DownloadIcon）：
    - 前置：仅当配置 `custom_index_download_enable` 为 `'true'` 时渲染下载按钮。
    - 行为：根据图片 URL 判断 storage 类型（包含 's3' 则视为 s3，否则 r2），调用 `/api/public/download/${props.id}?storage=${storageType}`。
      - 若 response 为 JSON（说明返回了直接下载链接），再请求 data.url 并触发浏览器下载；否则根据 Content-Disposition 或默认文件名从 response blob 生成下载文件并触发下载。
    - 交互提示：下载开始显示警告 toast（若含 license 同时提示），失败/成功有相应 toast；下载过程中图标切换为旋转状态。
  - 全屏查看（ExpandIcon）：
    - 行为：设置组件 `lightboxPhoto` 为 true，触发 `ProgressiveImage` / Lightbox 打开全屏查看。
  - 标签（Tag）：
    - 行为：点击后 `router.push(`/tag/${tag}`)` 跳转到标签页。

### 登录页（含 Passkey / OTP）
- 文件：`components/login/user-from.tsx` 与 `app/login/page.tsx`
- 字段：Email、Password；OTP 模式下显示 6 位 OTP 输入组件（InputOTP）。
- 关键按钮：
  - 提交（表单提交）：
    - 非 OTP：POST `/api/v1/auth/login`，body: { email, password }；成功时 toast 成功并跳转 `/admin`；失败显示后端或本地错误。
    - OTP：调用 `authClient.twoFactor.verifyTotp({ code: otpCode })`，成功后同样跳转 `/admin`。
  - Passkey 登录：
    - 调用 `authClient.signIn.passkey({ callbackURL: '/admin' })` 发起 passkey 登录流程，成功后跳转 `/admin`。
  - 返回主页（左上 ArrowLeft Link）：Link 到 `/`。

### 注册页
- 文件：`components/sign-up/sign-up-from.tsx` 与 `app/sign-up/page.tsx`
- 字段与校验：Email、Password（最少 8 位），使用 `zod` 验证。
- 注册按钮：调用 `authClient.signUp.email({ email, password, name: 'admin', image: '' })`，onSuccess 显示成功 toast 并跳转 `/admin`。

### 后台（Admin）总览与管理功能
- 仪表盘（`app/admin/page.tsx`）：调用 `fetchImagesAnalysis()`，使用 `ModernDashboard` 渲染统计卡片与项目列表。
- 相册管理（`app/admin/album/page.tsx` + components/admin/album/*）：
  - `AlbumAddButton`：调用全局 `ButtonStore` 的 `setAlbumAdd(true)` 打开 `AlbumAddSheet`。
  - `RefreshButton`：通过 `useSwrHydrated` 的 `mutate()` 刷新数据。
  - `AlbumAddSheet` / `AlbumEditSheet`：表单提交调用后端 API（组件内部实现）。
- 图片列表（`app/admin/list/page.tsx` + components/admin/list/*）：
  - 支持服务端分页与复杂筛选（showStatus、featured、camera、lens、exposure、f_number、iso、labels 等），`getData` 与 `getTotal` 调用对应后端 query。
  - 列表项支持查看、编辑（image-edit-sheet）与批量删除（image-batch-delete-sheet）。
- 上传（`app/admin/upload/page.tsx`）：
  - 渲染 `FileUpload` 组件（支持多种上传模式），上传逻辑使用 `uploadFile` 与后端 API，支持 S3/R2/AList 等存储。

### 系统设置（Settings）
- Account（`app/admin/settings/account/page.tsx`）
  - 修改头像：提交 avatar 表单调用 `authClient.updateUser({ image })`，成功/失败有 toast 提示。
  - 修改密码：提交时校验旧密码与新密码长度（>=8），并调用 `authClient.changePassword({ newPassword, currentPassword, revokeOtherSessions: true })`。
- Preferences（`app/admin/settings/preferences/page.tsx`）
  - 功能：站点信息、RSS/Umami、显示样式、预览图压缩/宽度、上传限制、关于我（About）配置、关于画廊图片的上传/排序。
  - 关键交互：
    - 顶部保存按钮：触发 `form.submit()`，PUT `/api/v1/settings/update-custom-info`，提交大量配置字段（title、customFaviconUrl、previewQuality、maxUploadFiles、aboutGalleryImages 等）。
    - 画廊图片上传：通过文件 input，使用 `Compressor` 压缩后调用 `uploadFile` 上传，成功后将返回的 URL 加入 `galleryImages` 状态。
    - 画廊删除按钮：从 `galleryImages` 中移除指定图片并显示 toast。
    - 拖拽排序：前端支持拖拽改变 `galleryImages` 顺序，保存时随表单一起提交。
- Storages（`app/admin/settings/storages/page.tsx`）
  - 三个 tab：S3 / R2 / AList，各自渲染对应配置组件（`S3Tabs`, `R2Tabs`, `AlistTabs`），内部实现负责测试连接、编辑与保存。
- Tag 管理（`app/admin/settings/tag/page.tsx`）
  - 使用动态加载的 `TagManager`（client-side），支持增删改标签的 UI，并调用后端 API。
- Passkey（`app/admin/settings/passkey/page.tsx`）
  - 列表：调用 `authClient.passkey.listUserPasskeys()`；删除：`authClient.passkey.deletePasskey({ id })`。
  - 注册：由 `PasskeyRegister` 触发；注册成功后刷新列表。
- Authenticator（TOTP，`app/admin/settings/authenticator/page.tsx`）
  - 启用 2FA：`authClient.twoFactor.enable({ password, issuer })` 返回 totpURI（显示二维码）。
  - 验证：`authClient.twoFactor.verifyTotp({ code })`（6位）。
  - 禁用：`authClient.twoFactor.disable({ password })`。

### 后端 API 与中间件
- 登录：前端 POST `/api/v1/auth/login`（见 `components/login/user-from.tsx`）。
- 下载：前端调用 `/api/public/download/:id?storage=...`（`PreviewImage` 组件实现下载流程）。
- 设置读取/更新：`/api/v1/settings/get-custom-info`、`/api/v1/settings/update-custom-info`（Preferences 页面使用）。
- 数据查询：后端 query 位于 `lib/db/query/*`（images, albums, configs, tags 等），前端通过 server actions 或 API 调用。
- 鉴权：`server/middleware/auth.ts` 中 `jwtAuth` 中间件检查 Authorization header 或 cookie 中的 `auth_token`，并调用 `verifyJWT` 验证；验证失败抛 401。

### 权限与路由关系综述
- 公开页面：站点首页、相册与图片预览等为公开展示；部分数据接口会根据后端实现进行鉴权判断（例如 `fetchImageByIdAndAuth`）。
- 后台受保护：`/admin` 及其子路由（相册管理、图片列表、上传、设置等）应要求登录，写操作由后端中间件或服务端验证 JWT。
- 常见跳转：
  - 登录成功 → `/admin`
  - 注册成功 → `/admin`
  - 相册页面“返回”按钮 → `/covers`
  - 预览模态关闭 → router.back() 或跳转到图片所属相册或 `/`

---

### 关键组件逐项细化

下面补充对若干关键前端组件的逐项行为说明（基于代码实现的精确描述）：

#### `ThemeGalleryClient`（组件）
- 文件：`components/layout/theme-gallery-client.tsx`
- 功能与行为（精确实现）：
  - 接收 props：`systemStyle`、`preferredStyle`、`enableFilters`、`filterOptions`（cameras/lenses）、`tagOptions` 及 `ImageHandleProps`（服务器 action handle/totalHandle/configHandle）。
  - 主题选择逻辑（`baseStyle`）：
    - 若传入 `preferredStyle`，优先采用该样式。
    - 单个相册（非 `/`、`all`）：若 `total`（图片总数）>10 采用瀑布流，否则单列。
    - 首页/合集：依赖 `systemStyle`（`'1'` 单列、否则瀑布流）。
  - 用户可手动切换风格（切换按钮 `toggleTheme()`），切换后设置 `userOverridden=true`，阻止自动跟随后台/数量变化。
  - 渲染选择：根据 `currentStyle` 渲染 `WaterfallGallery`（瀑布流）或 `SimpleGallery`（单列），并将 `filters`（相机/镜头/标签）透传给子组件。
  - 前端筛选面板：当 `enableFilters=true` 时显示浮动筛选按钮与筛选面板，筛选面板行为：
    - 面板可展开/收起（`filtersOpen`），点击页面任意处（非面板与非切换按钮）会收起面板。
    - 滚动页面时（向下滚动）若面板打开则自动收起，避免遮挡画廊。
    - 筛选项通过 `MultiSelect` 控件维护 `cameraFilter`、`lensFilter`、`tagsFilter` 状态，变化后透传给 gallery 子组件作为 `filters`，子组件负责按 filters 请求/过滤数据。
  - 固定操作按钮：右下角浮动的“筛选”与“主题切换”图标按钮（实现为圆形 icon 按钮），含 aria 属性用于可访问性。

#### `HeroSection`（组件）
- 文件：`components/layout/hero-section.tsx`
- 功能与行为：
  - 接收 `images?: ImageType[]`；若存在则渲染 `ImageAutoSlider`（轮播预览）。
  - 页面加载时预取 `/albums` 路由 (`router.prefetch('/albums')`) 用于减少跳转闪屏。
  - `Start` 按钮行为：点击触发 `router.push('/albums', { scroll: true })`，导航至作品画廊并保持滚动行为。
  - 视觉与交互细节：使用 `framer-motion` 做入场动画；`Start` 按钮为可访问按钮（`aria-label="Start"`），支持键盘与触摸。

#### `AlbumList`（组件）
- 文件：`components/admin/album/album-list.tsx`
- 功能与行为：
  - 数据获取：使用 `useSwrHydrated(props)` 从 `props.handle` 获取相册列表数据（SWR 管理），并暴露 `mutate()` 用于刷新。
  - 每个相册卡片显示：相册名（Badge）、路由值（album_value）、简介（detail）、排序（sort）与开关（show）。
  - `Switch`（显示/隐藏）：切换会调用 `/api/v1/albums/update-show`（PUT），body: { id, show }；交互期间显示 loading（`ReloadIcon`）并在成功后 `mutate()` 刷新列表。
  - 编辑按钮（铅笔）:
    - 作用：调用 `setAlbumEditData(album)` 与 `setAlbumEdit(true)`（基于 `ButtonStore`），打开 `AlbumEditSheet` 并填充数据。
  - 删除按钮（垃圾桶）:
    - 作用：打开对话框（`Dialog`），在对话框确认时调用 `DELETE /api/v1/albums/delete/${album.id}`；成功后显示 toast 并 `mutate()` 刷新。
  - 交互反馈：操作失败/成功通过 `sonner` toast 显示国际化消息（`useTranslations()`）。

#### `FileUpload`（组件）
- 文件：`components/admin/upload/file-upload.tsx`
- 功能与行为：
  - 支持多种上传模式：`singleton`（SimpleFileUpload）、`livephoto`（LivephotoFileUpload）、`multiple`（MultipleFileUpload），由顶部 `Select` 切换。
  - 切换上传模式会更换渲染的上传组件实例，组件内部实现负责表单、文件校验、压缩（如果需要）、以及调用 `uploadFile`/后端上传 API。
  - 该组件仅负责模式选择与渲染对应子组件，不直接参与上传逻辑。

#### SimpleGallery（单列画廊）
- 文件：`components/layout/theme/simple/main/simple-gallery.tsx`
- 功能与行为：
  - 使用 `useSWRInfinite` 分页加载图片（key 包含 args/album/index）。
  - 支持前端筛选（`props.filters`），在已加载的 `dataList` 上进行客户端过滤（相机/镜头/标签，标签为 AND 逻辑）。
  - 渲染子项 `GalleryImage`（`components/gallery/simple/gallery-image.tsx`），每个图片项负责进入预览的交互。
  - 加载更多：显示“加载更多”按钮，当 `size < pageTotal` 且未正在验证时可点击调用 `setSize(size+1)` 触发下一页加载；加载中显示旋转图标。

#### WaterfallGallery（瀑布流画廊）
- 文件：`components/layout/theme/waterfall/main/waterfall-gallery.tsx`
- 功能与行为：
  - 同样使用 `useSWRInfinite` 分页并合并数据为 `dataList`，并对 `props.filters` 做客户端过滤（与 SimpleGallery 相同的过滤规则）。
  - 使用 `ImageGallery`（`components/ui/image-gallery`）渲染瀑布流视觉效果。
  - 自动加载更多：在 window 滚动到接近底部（距离 < 800px）时自动 `setSize(size+1)`；同时提供明确的“加载更多”按钮供手动触发。
  - 在加载/验证状态显示旋转图标与“加载中”文案；无图片时显示空提示文字。

#### ImageAutoSlider（自动滚动缩略图条）
- 文件：`components/ui/image-auto-slider.tsx`
- 功能与行为：
  - 接收 `images: ImageType[]`，当数组为空返回 null。
  - 将图片数组复制拼接以实现无缝循环滚动（`duplicatedImages`），通过 CSS 动画（`@keyframes scroll-right`）做横向无限滚动。
  - 每个图片使用 Next.js `Image` 渲染（`unoptimized`），悬停放大并提升亮度（CSS hover 效果）。
  - 该组件不包含控制按钮或暂停交互（纯展示型）。

#### SimpleFileUpload（单文件上传）
- 文件：`components/admin/upload/simple-file-upload.tsx`
- 功能与行为：
  - 单文件上传（Ant Design `Dragger`），支持手动选择参考图提取 EXIF（本地解析，不上传）。
  - 支持存储切换：`r2` / `s3` / `alist`，若选择 `alist` 会请求 `/api/v1/storage/alist/storages` 拉取挂载目录。
  - 上传流程：`onRequestUpload(file)` 负责上传，内部：
    - HEIC 文件使用 `heic-to` 转换为 JPEG 后上传。
    - 使用 `uploadFile(file, album, storage, alistMountPath, { onProgress })` 进行上传，并在 `resHandle` 中：上传预览图、解析 EXIF、生成 blurhash、设置 `url`、`previewUrl`、`imageId`、`hash` 等状态。
  - 提交（`handleSubmit`）：先校验必要字段（album、width/height），合并标签（含一级/二级映射），进行重复检测调用 `/api/v1/images/check-duplicate`，若重复询问确认后 POST `/api/v1/images/add` 保存元数据。
  - 交互元素：存储选择、相册选择、AList 目录选择、EXIF 编辑/预设、标签预设、上传进度条、提交按钮、未上传文件 modal（提示上传并提交或取消）。

#### MultipleFileUpload（批量文件上传）
- 文件：`components/admin/upload/multiple-file-upload.tsx`
- 功能与行为：
  - 支持多文件选择（Ant `Dragger multiple`），配置项与 `SimpleFileUpload` 相似（storage/album/alist 等）。
  - 每个文件项为 `UploadFile`（扩展 `File`，带 `__key`、`labels`、`exif` 等字段），组件维护 `files[]`、`uploadedMeta`（按 key 存储 url/preview/metadata）与 `uploadProgressMap`。
  - 自动上传：当已选择 `album` 时，选中文件会自动调用 `onRequestUpload(file)` 上传原图并在 `uploadedMeta` 中记录结果；若未选择 album，会先本地解析 EXIF/blurhash 但不上传。
  - per-file 操作：删除（删除存储对象 `/api/v1/file/delete`）、本地参考图提取 EXIF、设置/编辑 EXIF 与标签、查看单文件上传进度。
  - 提交：若存在未上传文件，会弹出 modal 让用户选择“上传所选并提交”或“跳过未上传并提交”；提交时调用 `autoSubmit(meta)` 为每个文件发送 POST `/api/v1/images/add`（包含 width/height/labels/exif/tagCategoryMap 等），并在提交前尝试读取图片尺寸以满足后端校验。

#### LivephotoFileUpload（Live Photo / Image+Video）
- 文件：`components/admin/upload/livephoto-file-upload.tsx`
- 功能与行为：
  - 支持同时上传图片与视频：分为 image（type=1）和 video（type=2）的上传流程，最终提交 `type=3`（Live Photo 记录）。
  - 上传函数 `onRequestUpload(file, type)` 根据 `type` 走不同的 `resHandle` 分支：image 成功后会上传预览图、解析 EXIF、生成 blurhash 并设置 `url`/`imageId`；video 成功后设置 `videoUrl`。
  - 提交时校验 `url`、`album`、尺寸等，构造包含 `video_url` 的数据体并 POST `/api/v1/images/add`（type:3），与其他上传组件共享标签/EXIF 选择逻辑与 AList/S3/R2 支持。
  - 同样包含“未上传文件” modal 提示与先上传再提交的交互。

---

文档生成时间：2025-12-17

---

#### GalleryImage（单列/卡片图片项）
- 文件：`components/gallery/simple/gallery-image.tsx`
- 功能与行为：
  - 负责渲染单张图片的移动端与桌面端布局，包括 `MotionImage`（渐进加载）、标题、EXIF 摘要与标签展示。
  - 点击图片：`router.push(`/preview/${photo.id}`)` 跳转到图片预览页面（`/preview/:id`）。
  - EXIF 与标签展示：根据断点显示/隐藏，标签点击会跳转到 `/tag/:tag`。
  - 操作图标：
    - 复制直链（`CopyIcon`）：将 `photo.url` 复制到剪贴板，失败使用 textarea fallback，成功显示 toast；若图片含 license，会在 toast 中提示版权信息。
    - 复制分享链接（`LinkIcon`）：复制 `window.location.origin + '/preview/' + photo.id` 到剪贴板。
    - 下载（`DownloadIcon`）：仅在配置 `custom_index_download_enable === 'true'` 时显示；触发 `downloadImg()`：
      - 先显示警告 toast（提示原图较大及版权信息），调用 `/api/public/download/${photo.id}?storage=${storageType}` 获取下载资源或中转 JSON，再请求后端返回的实际文件，最终使用 Blob 链接触发浏览器下载；过程出错显示错误 toast，下载中显示旋转图标。
  - 响应式：移动端与桌面端分别渲染不同布局，桌面端展示更详尽的 EXIF 字段与布局。

#### ImageGallery（瀑布流列分发 + 点击进入预览）
- 文件：`components/ui/image-gallery.tsx`
- 功能与行为：
  - 将收到的 `images: ImageType[]` 列表按索引分配到 3 列，形成 Masonry 风格布局（通过 `columns[index % 3]` 分配）。
  - 每个缩略图由 `AnimatedImage` 渲染：使用 `AspectRatio` 保持纵横比，img 懒加载并在加载时应用模糊/缩放过渡效果；加载完成后移除模糊并缩放回原始尺寸。
  - 点击缩略图：`router.push(`/preview/${image.id}`)`，跳转到图片预览页面。
  - 视差/入场效果：`AnimatedImage` 使用 `framer-motion` 的 `useInView` 控制首次进入视口时的淡入动画。

#### WaterfallImage（瀑布流单项）
- 文件：`components/gallery/waterfall/waterfall-image.tsx`
- 功能与行为：
  - 使用 `MotionImage` 渲染图片并支持悬停效果（放大、投影、渐变边框等视觉反馈）。
  - 点击项：`router.push(`/preview/${photo?.id}`)` 跳转到预览页面。
  - 悬停时显示渐变遮罩与图片说明（`photo.detail`），同时通过 `isHovered` 控制样式与动画。
  - 对 Live Photo（`photo.type === 2`）显示独立的 Live 标识图标。

---

文档生成时间：2025-12-17
