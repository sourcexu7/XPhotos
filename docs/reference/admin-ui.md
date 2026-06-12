# XPhotos 后台 UI 参考

> 适用范围：`/admin/**` 路由及其下所有页面。所有后台页面统一经过 middleware 的 cookie `auth_token` 鉴权。
>
> 本文档专注于 **页面结构、关键组件入口、交互要点、移动端适配**；接口的详细参数请参阅 [api-reference.md](./api-reference.md)。

---

## 一、后台路由总览

| 路径 | 页面 | 关键组件 | 主要 API（详见 api-reference.md 对应章节） |
| --- | --- | --- | --- |
| `/admin` | 仪表盘（现代版） | `components/admin/dashboard/modern-dashboard.tsx`、`DashboardView`、`StatCard`、`VisitTrendChart` | `/api/v1/public/dashboard`（或页面内本地统计） |
| `/admin/upload` | 上传页（单张 / 多张 / LivePhoto） | `components/admin/upload/simple-file-upload.tsx`、`multiple-file-upload.tsx`、`livephoto-file-upload.tsx` | 3.4 file、3.6 images（`/file/presigned-url`、`/file/upload`、`/file/getObjectUrl`、`/images/add`、`/images/check-duplicate`）、3.7 storage（`/storage/alist/storages`、`/settings/tags/get`、`/settings/get-custom-info`） |
| `/admin/list` | 图片列表（筛选 / 批量操作） | `components/admin/list/antd-list.tsx`、`list-props.tsx`、`FilterBar`、`image-edit-sheet.tsx`、`image-batch-delete-sheet.tsx` | 3.6 images（`update`/`update-show`/`update-featured`/`update-Album`/`update-sort`/`batch-delete`/`camera-lens-list`）、3.2 albums（`get`/`update`）、3.7 settings（`tags/get`） |
| `/admin/album` | 相册管理 | `components/admin/album/album-list.tsx`、`album-add-sheet.tsx`、`album-edit-sheet.tsx`、`album-sort-panel.tsx` | 3.2 albums（`get`/`add`/`update`/`delete`/`update-show`/`update-sort`） |
| `/admin/album/[albumValue]/sort` | 相册内图片排序子页 | `components/admin/album/album-sort-panel.tsx` | 3.6 images（`update-sort`） |
| `/admin/guides` | 攻略管理列表 | `components/admin/guide-editor/index.tsx`、`guide-sort-panel.tsx`、`GuideSortPanel` | 3.5 guides（`list`/`/`/`:id`/`batch-sort`/`reset-sort`） |
| `/admin/guides/[id]/edit` | 单篇攻略编辑（模块 / 内容 / 目录） | `components/admin/guide-editor/modules/*`（`checklist-module`、`expense-module`、`itinerary-module`、`photo-module`、`tips-module`、`transport-module`）、`toc-manager.tsx` | 3.5 guides + guide-modules（`/guides/:id`、`/guides/:id/components`、`/guide-modules/module/*`、`/guide-modules/content/*`、`/guide-modules/toc/*`） |
| `/admin/analytics` | 数据统计（访问统计） | `components/admin/analytics/visit-trend-chart.tsx`（复用） | 3.3 analytics（`GET /api/v1/analytics/`）或路由 handler `/admin/analytics/api` |
| `/admin/data-overview` | 数据总览（公开统计 + 缓存控制） | `components/public/dashboard/dashboard-view.tsx`、`StatCard` | `/api/v1/public/dashboard`、`POST /api/v1/settings/cache/clear` |
| `/admin/settings/preferences` | 偏好设置（站点信息、首页样式、关于我） | `AntCard` + Ant Design `Form`、`Upload`、`Switch` | 3.7 settings（`get-custom-info`、`update-custom-info`）、3.4 file（上传流程） |
| `/admin/settings/tag` | 标签管理（二级树） | `components/admin/tags/tag-manager.tsx` | 3.7 settings tags（`get`、`add`、`update`、`move`、`delete`、`delete-with-children`、`check-completeness`） |
| `/admin/settings/storages` | 存储设置（S3 / R2 / COS / AList） | `components/admin/settings/storages/*`（`s3-tabs`、`r2-tabs`、`cos-tabs`、`alist-tabs`、对应 edit-sheet、`storage-config-mapper`） | 3.7 settings storage（`*-info` 读、`update-*-info` 写、`validate-s3/cos` 连通性、`/storage/alist/info`、`/storage/alist/storages`） |
| `/admin/settings/account` | 账号设置（头像、密码） | Ant Design `Form`、`Upload`、`Input` | 3.1 auth（`update-user`、`change-password`） |
| `/admin/settings/authenticator` | 双因素认证（Authenticator TOTP） | `components/auth/passkey-register.tsx` 类似结构 + TOTP 流程 | Better Auth / `authClient`（auth v1 接口下） |
| `/admin/settings/passkey` | Passkey 管理 | `components/auth/passkey-register.tsx`、`passkey-login.tsx` | Better Auth / `authClient.passkey.*` |

---

## 二、页面级交互说明

### 2.1 `/admin` 仪表盘

**页面用途**：快速查看站点整体数据（总图片数、相册数、精选数、访问趋势等）。

**顶部统一组件说明**
- 页面头部组件：`components/admin/layout/page-header.tsx`（`AdminPageHeader`）
- 统一 props：`{ title, description?, breadcrumbs? }`，在每个页面通过 `import AdminPageHeader from ...` 引入
- 面包屑常见格式：`[{ title: '首页' }, { title: '仪表盘' }]`

**关键按钮 / 组件 / 数据来源**
- 主组件：`ModernDashboard` / `DashboardView`，内部包含多个 `StatCard`（数值卡）与图表组件
- 数据来源：`/api/v1/public/dashboard` 或页面内统计查询（详见 api-reference.md 3.3 / 3.7）
- 交互：卡片可点击（通常跳转到对应后台详情页）；图表通常为静态阅读

**移动端适配要点**
- 图表在窄屏下使用单列排版（antd `Row / Col` `xs=24`）
- 统计卡片会自动换行，避免水平滚动

**常见交互陷阱**
- 数据为空时使用 antd `Empty` 组件；避免图表容器高度为 0

---

### 2.2 `/admin/upload` 上传页

**页面用途**：上传单张 / 多张图片、LivePhoto（图片+视频）并关联相册、标签、EXIF 信息。

**顶部统一组件说明**：`AdminPageHeader`（标题："上传"，描述解释三种模式入口）。

**关键按钮 / 组件 / 数据来源**
- 模式切换（顶部 Tab/入口）：`单张`、`多张`、`LivePhoto`
- 存储选择 Select：r2 / s3 / cos / alist（若为 alist 会额外拉取 AList 目录列表）
- 相册选择 Select：来自 `GET /api/v1/albums/get`
- 一级 / 二级标签选择：来自 `GET /api/v1/settings/tags/get?tree=true`
- 拖拽区：`Dragger`（anTD），选择图片后会进入上传流程
- 提交按钮：触发完整链路（上传原图 → 上传预览图 → 查重 → 入库 `POST /api/v1/images/add`）

**移动端适配要点**
- 上传表单字段纵向堆叠；标签 / 相册多选改为可滚动列表
- 上传进度条保留在屏幕底部或卡片顶部

**常见交互陷阱**
- 未选择相册却点提交（应 disabled 或 toast 提示）
- 连续点击提交导致重复上传（按钮应有 loading 态）
- 多张上传单张失败不会整体回滚（UI 需逐张标注成功 / 失败态）

---

### 2.3 `/admin/list` 图片列表页

**页面用途**：搜索 / 筛选 / 批量管理已有图片（修改显示状态、精选、排序、所属相册、封面、元数据）。

**顶部统一组件说明**：`AdminPageHeader` + 筛选提示文案（"筛选后需点击'查询'生效"，i18n）。

**关键按钮 / 组件 / 数据来源**
- 筛选区（桌面端直接显示，移动端右侧抽屉 Sheet）：相册、显隐、精选、相机、镜头、快门、光圈、ISO、标签
- 查询 / 清空按钮：同步 `staged*` → 生效态并重新拉取列表
- 批量操作吸顶栏（选中图片后出现）：全选、刷新、批量删除
- 图片卡片操作：显示开关、星标、排序、替换相册、设为封面、编辑侧边栏
- 编辑侧边栏：`image-edit-sheet.tsx`（全量 PUT `/api/v1/images/update`）

**移动端适配要点**
- 筛选面板改为 `Sheet`（右抽屉），筛选按钮上显示已应用筛选数徽标
- 图片卡片 grid 列数减少，操作按钮通过 `Popover` 展开以节省空间

**常见交互陷阱**
- 连续点击 "查询" 会重复 mutate；应在 loading 态下禁用
- 批量删除前必须二次确认（`Popconfirm` 或 `Modal`）
- 排序值修改后若未持久化刷新列表，会出现展示与后端不一致

---

### 2.4 `/admin/album` 相册管理（含 `/admin/album/[albumValue]/sort`）

**页面用途**：创建 / 编辑 / 删除相册，设置显示状态、排序，以及相册内图片的精细化排序。

**顶部统一组件说明**：`AdminPageHeader` + 常见操作（新增按钮 `AlbumAddButton`、刷新按钮 `RefreshButton`）。

**关键按钮 / 组件 / 数据来源**
- `AlbumAddButton` → 打开 `album-add-sheet`（`POST /api/v1/albums/add`）
- `album-edit-sheet` → 编辑相册基本信息（`PUT /api/v1/albums/update`）
- `album-list` 行内操作：显隐开关、排序置顶 / ↑ / ↓、删除、进入排序子页
- 排序子页 `album/[albumValue]/sort`：拖动或上下箭头重排，`PUT /api/v1/images/update-sort` 批量提交

**移动端适配要点**
- 相册列表在窄屏下改为单列卡片，行内操作折叠进 Popover
- 排序子页拖拽组件需支持移动端触摸（内部使用 `@dnd-kit` 或 antd 的 sortable list）

**常见交互陷阱**
- 删除相册时需考虑"相册内图片的归属"，多数场景下图片仍保留但无所属
- 排序操作需处理"仅本地重排尚未提交给后端"的状态，避免误离开页面

---

### 2.5 `/admin/guides` 攻略管理

**页面用途**：管理旅行攻略（创建 / 编辑 / 删除），每个攻略包含若干模块（行程、费用、清单、交通、图片、提示），以及模块内容与目录。

**顶部统一组件说明**：`AdminPageHeader`（攻略管理），面包屑：`首页 / 攻略管理`。编辑子页：`首页 / 攻略管理 / 编辑`。

**关键按钮 / 组件 / 数据来源**
- 主列表：anTD `Table`，展示标题 / 国家 / 城市 / 天数 / 显隐 / 排序
- 新增攻略：`PlusOutlined` → Modal（创建表单 → `POST /api/v1/guides/`）
- 编辑：跳转到 `/admin/guides/[id]/edit`
  - `module-manager.tsx`：管理攻略下模块（增删改、重排）
  - 每个 `*-module.tsx`（`itinerary-module`、`expense-module`、`checklist-module`、`transport-module`、`photo-module`、`tips-module`）负责写入模块专用数据
  - `toc-manager.tsx`：管理目录（手动或 `auto-generate`）
- 排序面板：`GuideSortPanel`（`PUT /api/v1/guides/batch-sort` 或 `POST /api/v1/guides/reset-sort`）
- 删除：`Popconfirm` + `DELETE /api/v1/guides/:id`（软删除 `del=1`）

**移动端适配要点**
- 表格在窄屏下使用横向滚动容器（antd Table 的 `scroll.x`）
- 编辑页的模块卡片改为单列纵向堆叠，每个模块内容区高度限制并支持滚动

**常见交互陷阱**
- 攻略编辑页编辑状态需做"未保存离开提示"，避免长编辑丢失
- 目录自动生成会覆盖现有手动目录，需提示用户

---

### 2.6 `/admin/analytics` 数据统计

**页面用途**：查看访问趋势图 / 统计概览（区别于 data-overview 的"后台内部统计"而非公开展示数据）。

**顶部统一组件说明**：`AdminPageHeader`（数据统计）。

**关键按钮 / 组件 / 数据来源**
- 数据读取：`GET /api/v1/analytics/` 或路由 handler `GET /admin/analytics/api`
- 图表：`VisitTrendChart`、`PhotosByYearChart` 等（复用 admin/dashboard 下图表组件）
- 空态：`Empty`（antd）

**移动端适配要点**
- 图表组件应按宽度自适应（useRef + ResizeObserver 或 ant charts 的响应式配置）

**常见交互陷阱**
- 无数据态与加载中态需要区分（骨架屏 vs `Empty`）

---

### 2.7 `/admin/data-overview` 数据总览

**页面用途**：查看与前台 `public/dashboard` 相同的数据总览，并提供 Redis 缓存一键清空。

**顶部统一组件说明**：`AdminPageHeader`（数据总览）。

**关键按钮 / 组件 / 数据来源**
- 读取：`GET /api/v1/public/dashboard`
- 清空缓存按钮：`Confirm` → `POST /api/v1/settings/cache/clear` → 之后对所有以 `/api/` 为 key 的 SWR 做 `mutate(undefined, { revalidate:true })`
- toast：成功 / 失败显示 3s 自动消失

**移动端适配要点**：同仪表盘。

**常见交互陷阱**
- 清空缓存是高风险操作，必须二次确认并提示数据库压力

---

### 2.8 `/admin/settings/*` 设置子页

> 每个设置子页都统一使用 `AdminPageHeader`，面包屑通常为 `首页 / 设置 / <具体设置>`

#### 2.8.1 preferences 偏好设置

- 字段：站点标题、作者、首页样式（`custom_index_style` 0/1/2）、下载开关、原图开关、RSS URI、关于我文案与图片
- 画廊图片：支持拖拽排序、删除、新增加（最多 10 张）
- 读写 API：`GET /api/v1/settings/get-custom-info` / `PUT /api/v1/settings/update-custom-info`
- 上传组件：使用 antd `Upload`，背后调用 file 上传链路

#### 2.8.2 tag 标签管理

- 结构：左侧一级分类（category），右侧该分类下二级标签
- 操作：添加 / 编辑 / 删除 / 移动（支持升级为一级标签）
- 历史图片标签补全：`POST /api/v1/settings/tags/check-completeness`（仅按钮触发）
- 陷阱：删除一级标签会问"是否连同二级标签一起删除"，务必使用 `delete-with-children` 或 `delete` 的区别

#### 2.8.3 storages 存储设置

- Tabs：S3 / R2 / COS / AList
- 读取：`/api/v1/settings/<provider>-info`
- 编辑：对应 `*EditSheet`（表单字段按 provider 不同而异）
- 验证（仅 S3 / COS）：`/api/v1/settings/validate-s3|cos`（轻量读写删）
- 陷阱：AList 保存后使用 `/api/v1/storage/alist/info` 而不是 `/settings/alist-info` key 刷新，需要两处都刷新或统一

#### 2.8.4 account 账号设置

- 头像上传：`authClient.updateUser({ image })` → `POST /api/v1/auth/update-user`
- 密码修改：`authClient.changePassword(...)` → `POST /api/v1/auth/change-password`
- 陷阱：修改密码需要确认当前密码，字段要做 match 校验

#### 2.8.5 authenticator 双因素认证

- 使用 Better Auth 的 Authenticator 模块（前端 `authClient.*`）
- 流程：显示 TOTP 二维码 → 输入验证码激活 → 展示恢复码（一次性）
- 陷阱：激活后必须让用户妥善保存恢复码

#### 2.8.6 passkey Passkey 管理

- 列表：`authClient.passkey.listUserPasskeys()`（本地 / 线上）
- 注册新 Passkey：`PasskeyRegister`（Better Auth `passkey.register`）
- 删除：需要二次确认（`passkey.removePasskey`）
- 陷阱：Passkey 依赖浏览器支持 WebAuthn；非安全上下文下无法使用

---

## 三、统一组件规范

### 3.1 侧边栏（`antd-sidebar` / `main-layout`）

- 路径：`components/admin/layout/main-layout.tsx` + `components/admin/sidebar/antd-sidebar.tsx`（以及 `components/admin/ant-sidebar.tsx`、`components/admin/ant-layout.tsx`）
- 职责：渲染顶部 bar、左侧导航、用户信息（来自真实会话 `authClient.useSession`，无会话时回退默认值）
- 导航项固定：仪表盘 / 上传 / 图片列表 / 相册 / 攻略 / 统计 / 数据总览 / 设置（含子项）
- 移动端：侧边栏默认收起，由汉堡按钮切换展开

### 3.2 页面头部（`AdminPageHeader`）

- 路径：`components/admin/layout/page-header.tsx`
- Props：`{ title, description?, breadcrumbs?: [{ title }] }`
- 视觉：标题使用 `Typography.Title level=3`；描述使用 `type="secondary"`；面包屑通过 antd `Breadcrumb` 渲染
- 约定：**所有 /admin/** 子页均应在顶部放置此组件一次

### 3.3 Drawer / Sheet / Modal / Dialog

- 路径：
  - 后台侧：anTD `Drawer`、`Modal`（`components/admin/modal/antd-modal.tsx`）
  - 部分"移动端抽屉"场景使用 `components/ui/sheet.tsx`（shadcn/ui）
  - 前台与部分子页共享 `components/ui/dialog.tsx`
- 约定：编辑操作优先使用 Sheet 抽屉（不打断主列表浏览）；删除 / 危险操作优先使用 `Modal` + `Popconfirm`

### 3.4 Empty 空状态

- anTD `Empty` 或 `components/ui/empty-state.tsx`
- 出现在：无数据的统计页、无图片的相册、筛选结果为空的列表

### 3.5 Breadcrumb 面包屑

- 通过 `AdminPageHeader.breadcrumbs` 传入
- 格式：数组，从根到当前页（如 `[{ title: '首页' }, { title: '设置' }, { title: '存储' }]`）

---

## 四、验收标准（来自 admin-ui-optimization.md 与实际规范）

- [ ] 每个 `/admin/**` 页面顶部都使用了 `AdminPageHeader` 且包含清晰的 `title` / `description` / `breadcrumbs`
- [ ] 不存在明显的死链导航入口（例如废弃的 `/admin/about` 已移除）
- [ ] 侧边栏用户信息来自真实会话（`authClient.useSession`），无会话时使用合理的默认值与回退
- [ ] 上传页三种模式（单张 / 多张 / LivePhoto）入口清晰可见、可快速切换、有说明文案
- [ ] 图片列表筛选行为对用户可解释：区分 staged 与 effective，移动端显示"已应用筛选数"
- [ ] 所有新增交互提示文案接入 i18n（`messages/*.json` 的 `zh/en/...`）
- [ ] 关键切换按钮（Switch、显隐开关）补充 aria-label
- [ ] 统计图表颜色使用主题 token（antd theme token 或自定义 token），不使用硬编码 `#FF0000` 等
- [ ] 统计页空数据态使用 `Empty` 组件而非空白
- [ ] 相册管理空态引导用户点击"新增相册"
- [ ] 分页组件（anTD Pagination）在 loading 时有明显视觉反馈
- [ ] `page-header` 在 `md` 断点下调整边距（`mb-4 md:mb-6`）
- [ ] 移动端筛选面板使用 Sheet，而不是水平溢出下拉
- [ ] 表单校验错误使用行内 `Form.Item` 的 `help` / `validateStatus`，不使用 alert 覆盖
- [ ] 敏感字段（存储 token、密码）使用可显隐的 password input（`visibilityToggle`）
- [ ] 数值字段在数值不合法时有清晰行内提示（非 toast 独吞）

---

## 来源文档清单

1. `docs/ui/admin.md`（按钮级交互与接口映射）
2. `docs/guides/admin-ui-optimization.md`（结构改造与验收标准）
3. `docs/reference/api-reference.md`（接口详细参数）
4. `app/admin/**/*`（路由与页面入口）
5. `components/admin/**/*`（后台业务组件：上传、列表、相册、设置、仪表盘、引导编辑器、通用头部与布局）
6. `components/ui/**/*`（共享 UI：Sheet、Dialog、Empty、Button、Form、Breadcrumb 等）
