# 后台功能文档（按钮级）

本文件覆盖后台 `/admin/**` 的页面与按钮/交互点，并标注主要请求与状态变化。

> `/admin/**` 页面访问会经过 `middleware.ts` 的 cookie `auth_token` 校验。

## 路由总览（后台）

- `/admin`：仪表盘
- `/admin/upload`：上传（单张 / LivePhoto / 多张）
- `/admin/list`：图片列表（筛选/批量操作等，逻辑在组件内）
- `/admin/album`：相册管理
- `/admin/analytics`：统计页面（可能调用 `/admin/analytics/api` 或 `/api/v1/analytics`）
- `/admin/settings/*`：设置（偏好、标签、存储、账号、passkey/authenticator 等）

---

## `/admin` 仪表盘（`app/admin/page.tsx`）

- **说明**：服务端拉取 `fetchImagesAnalysis()`，渲染 `ModernDashboard`（卡片/列表交互由该组件内部决定）

---

## `/admin/upload` 上传（`app/admin/upload/page.tsx` → `components/admin/upload/file-upload.tsx`）

### 上传模式切换（Select）

- **控件**：下拉选择 `mode`
  - 单张（`singleton`）→ `SimpleFileUpload`
  - LivePhoto（`livephoto`）→ `LivephotoFileUpload`
  - 多张（`multiple`）→ `MultipleFileUpload`

### 单张上传（`components/admin/upload/simple-file-upload.tsx`，节选关键按钮）

> 该组件较大，文档在“映射阶段”会进一步补齐每个按钮对应的接口与参数。

- **存储选择（Select）**
  - **行为**：选择 `s3/r2/cos/alist...`（以 `storages` 数据为准）
  - **特殊**：
    - 选择 `alist` 会触发拉取 AList 目录（`getAlistStorage()`）
    - 选择 `s3` 会 toast 提示“无需选择目录，请先选择相册再上传”
  - **接口映射**：
    - 拉取 AList 目录：`GET /api/v1/storage/alist/storages`
- **相册选择（Select）**
  - **前置条件**：必须选择（提交按钮会 disabled）
- **AList 目录选择（Select）**
  - **出现条件**：storage=`alist` 且 `storageSelect=true`
  - **前置条件**：必须选择 mountPath
- **提交（AntButton Primary：`Button.submit`）**
  - **行为**：若文件已选择但 `url` 为空，会先上传文件（`onRequestUpload(files[0])`），再提交元数据（`handleSubmit()`）
  - **禁用条件**：未选择文件且无 url / 未选相册 / 未选存储 / alist 未选目录
  - **接口映射（核心链路）**：
    - 预签名上传：`POST /api/v1/file/presigned-url` → `PUT <presignedUrl>` → `POST /api/v1/file/getObjectUrl`
    - 服务器代传回退：`POST /api/v1/file/upload`
    - 提交前重复检测：`POST /api/v1/images/check-duplicate`
    - 入库保存：`POST /api/v1/images/add`
- **缺文件弹窗（Modal：文件未上传）**
  - **取消**：关闭弹窗
  - **上传并提交**：先上传再提交
- **拖拽/点击选择文件（Dragger）**
  - **前置条件**：需先选择存储与相册（alist 还需目录）
  - **行为**：选择单个文件（最多 1 个）
- **选择参考图提取 EXIF（AntButton）**
  - **行为**：选择本地图片，仅本地解析 EXIF，不上传
- **管理常用选项（链接）**
  - **位置**：EXIF “相机品牌/型号”表单项 extra
  - **行为**：打开预设管理弹窗（相机型号/快门/ISO/光圈等预设）
- **预设标签（AntTag，可点）**
  - **行为**：点击加入/移除标签（`togglePresetTag`）
- **文件列表删除（AntButton text danger CloseOutlined）**
  - **出现条件**：已选择文件
  - **行为**：从待上传列表移除该文件
  - **相关接口**：若已上传并需要清理对象，组件内会调用 `POST /api/v1/file/delete`（按 storage/key 删除）

### 多张上传（`components/admin/upload/multiple-file-upload.tsx`，按钮级）

#### 顶部栏控件

- **存储选择（Select）**
  - **可选**：`r2 / s3 / alist`
  - **行为**：切换 storage；选 `alist` 会拉取目录并展示目录选择器；选 `s3` 会 toast 提示
  - **接口**：`GET /api/v1/storage/alist/storages`（仅当 storage=alist 且首次需要目录时）
- **相册选择（Select）**
  - **前置条件**：选中文件后会尝试自动上传；若未选相册会 toast 提示“请先选择相册以便自动上传”
  - **接口**：相册列表来自 `GET /api/v1/albums/get`
- **一级标签（Primary Select）**
  - **数据来源**：`GET /api/v1/settings/tags/get?tree=true`（取 category 列表）
  - **行为**：选择后会清空二级选择，并把一级/二级选中的标签自动合并到每个文件的 `labels`
- **二级标签（Secondary MultipleSelector）**
  - **数据来源**：来自树形标签的 children（随一级选择变化）
  - **行为**：选择后自动合并进每个文件的 `labels`
- **AList 目录选择（Select）**
  - **出现条件**：storage=alist 且已拉取到目录列表

#### 主按钮：提交（会先上传未完成文件）

- **按钮文案**：`提交（会先上传未完成文件）`
- **禁用条件**：未选择文件 / storage 为空 /（alist 且未选目录）
- **行为**：
  - 若存在“未上传完成”的文件：弹出“未上传文件”对话框让用户选择“上传所选并提交/跳过未上传并提交”
  - 否则：对每个文件执行“若无 URL 则上传 → 提交元数据”
- **接口映射（每个文件）**：
  - 上传原图：通过 `uploadFile()` → `POST /api/v1/file/presigned-url` → `PUT <presignedUrl>` → `POST /api/v1/file/getObjectUrl`（失败时回退 `POST /api/v1/file/upload`）
  - 上传预览图：同 `uploadFile()`（压缩为 webp，`type='/preview'` 或 `${album}/preview`）
  - 提交前重复检测：`POST /api/v1/images/check-duplicate`
  - 入库保存：`POST /api/v1/images/add`
  - 删除已上传对象（移除文件时触发清理）：`POST /api/v1/file/delete`（body: `{ storage, key }`）

#### 未上传文件弹窗（Modal）

- **取消**：关闭弹窗
- **跳过未上传并提交**：仅提交“已有 url 的文件”（仍会调用 `/api/v1/images/check-duplicate` 与 `/api/v1/images/add`）
- **上传所选并提交**：
  - 对勾选的文件先走上传链路（见上）
  - 然后提交所有已获得 url 的文件元数据

#### 文件区（Dragger：多选）

- **行为**：选择文件后会立即触发“自动上传”（对每个文件 `onRequestUpload(file)`，fire-and-forget）
- **限制提示**：从 `GET /api/v1/settings/get-custom-info` 读取 `max_upload_files`、预览压缩质量/宽度限制，并用于 UI 提示与压缩参数

#### 每个文件卡片内按钮/交互点

- **删除文件（CloseOutlined）**
  - **行为**：移除文件；若已上传且存在 `key`，会尝试删除对象存储文件
  - **接口**：`POST /api/v1/file/delete`
- **预设标签（AntTag 可点）**
  - **数据来源**：`GET /api/v1/settings/tags/get`
  - **行为**：对当前文件 labels 进行加入/移除
- **参考图提取 EXIF（按钮）**
  - **行为**：选择本地参考图，仅本地解析 EXIF/经纬度并写入该文件的临时元数据，不上传
- **管理常用选项（链接）**
  - **行为**：打开“常用 EXIF 选项”弹窗（localStorage 持久化）

### LivePhoto 上传（`components/admin/upload/livephoto-file-upload.tsx`，按钮级）

> LivePhoto 模式需要 **图片 + 视频** 两个文件（分别上传），然后一次性提交元数据（`type: 3`，含 `video_url`）。

#### 顶部栏控件

- **存储选择（Select）**：同多张（含 alist 目录拉取 `GET /api/v1/storage/alist/storages`）
- **相册选择（Select）**：相册列表 `GET /api/v1/albums/get`
- **一级/二级标签选择**：
  - **数据来源**：`GET /api/v1/settings/tags/get`
  - **行为**：将选择结果合并到 `imageLabels`
- **提交（主按钮：`Button.submit`）**
  - **行为**：如图片未上传（`url` 为空）会弹出“文件未上传”弹窗；否则执行校验并提交
  - **提交接口**：`POST /api/v1/images/add`（body 含 `url/preview_url/video_url/type=3/blurhash/exif/labels/width/height/lat/lon`）

#### 文件未上传弹窗（Modal）

- **取消**：关闭
- **上传并提交**：先上传图片与视频（若已选择）再调用提交

#### 上传文件区（两个 Dragger）

- **图片 Dragger**
  - **accept**：图片/RAW/HEIC 等
  - **行为**：选择后仅缓存到 `images`（不会自动上传，上传发生在“提交”路径里）
  - **上传链路**：`uploadFile(file, album, storage, ...)`（HEIC 会转 jpg）→ 同 `/api/v1/file/*`
  - **预览图**：会压缩成 webp 并上传（`type='/preview'` 或 `${album}/preview`）
- **视频 Dragger**
  - **accept**：video/mov/mp4 等
  - **上传链路**：同 `uploadFile()` → `/api/v1/file/*`，成功后写入 `videoUrl`

#### 元数据区按钮/交互点

- **预设标签（AntTag 可点）**：来源 `GET /api/v1/settings/tags/get`，点击加入/移除
- **自定义标签（MultipleSelector，可输入）**：修改 `imageLabels`
- **EXIF 常用项下拉/手动输入 + 管理常用选项**：仅影响提交到 `/api/v1/images/add` 的 `exif`
- **选择参考图提取 EXIF（按钮）**
  - **行为**：仅本地解析并合并到当前 exif（不上传）

---

## `/admin/list` 图片列表（`app/admin/list/page.tsx` → `components/admin/list/list-props`）

- **说明**：页面把服务端分页函数 `fetchServerImagesPageByAlbum(...)` 传给 `ListProps`（数据分页主要发生在服务端 action）。\n+
### 关键按钮 → 接口映射（`components/admin/list/list-props.tsx`）

- **查询（筛选应用）**：仅更新本地筛选状态并 `mutate()` 触发重新拉取列表数据
- **清空（重置筛选）**：重置筛选状态并 `mutate()`
- **刷新**：`mutate()` 刷新列表
- **批量删除**
  - 打开弹窗：`setImageBatchDelete(true)`
  - 确认删除：`DELETE /api/v1/images/batch-delete`（body 为选中 id 数组）
- **显示状态开关（Switch）**：`PUT /api/v1/images/update-show`（body: `{ id, show }`）
- **精选星标（Star）**：`PUT /api/v1/images/update-featured`（body: `{ imageId, featured }`）
- **排序（📌/↑/↓）**：`PUT /api/v1/images/update-sort`（body: `{ orders: [{id, sort}] }`）
- **绑定相册（Replace 图标）**：`PUT /api/v1/images/update-Album`（body: `{ imageId, albumId }`）
- **设为相册封面（ImageIcon）**：`PUT /api/v1/albums/update`（把目标相册 `cover` 更新为图片 URL）
- **编辑图片信息（SquarePen）**：打开侧边栏；保存时 `PUT /api/v1/images/update`

### 选项数据来源（下拉/筛选）

- 相册列表：`GET /api/v1/albums/get`
- 相机/镜头候选：`GET /api/v1/images/camera-lens-list`
- 标签候选：`GET /api/v1/settings/tags/get`（注意：该接口返回结构需与前端读取方式匹配）

### 按钮级交互点清单（更细）

#### 1）筛选栏（桌面端直接显示 / 移动端为右侧抽屉 Sheet）

实现：`components/admin/list/list-props.tsx` 的 `FilterContent`

- **筛选下拉（相册/公开状态/精选/相机/镜头/快门/光圈/ISO）**
  - **行为**：先写入“暂存态”（`staged*`），不会立即查询
- **筛选标签 Popover（按钮：筛选标签）**
  - **行为**：在 Popover 内勾选标签（Checkbox），并选择 AND/OR 逻辑
  - **按钮**：
    - AND / OR：设置 `stagedLabelsOperator`
    - 清除已选：清空 `stagedSelectedTags`
- **查询（AntButton primary：`Button.query` / 文案“查询”）**
  - **行为**：把 `staged*` 全量同步到“生效态”（`selected*`），再 `mutate()` 触发刷新
  - **注意**：当前实现里连续 `await mutate()` 调用两次（以代码为准）
- **清空（AntButton：`Button.reset` / 文案“清空”）**
  - **行为**：同时清空暂存态与生效态，并 `mutate()` 刷新（同样调用两次）
- **布局切换（AntButton text：卡片/列表）**
  - **行为**：切换 `layout`，不请求接口
- **移动端抽屉（Sheet）**
  - **按钮**：筛选（打开抽屉）、关闭（关闭抽屉）

#### 2）批量操作吸顶栏（出现条件：已选中图片数 > 0）

- **全选 Checkbox**
  - **行为**：选中/取消“当前页全部图片 id”
- **刷新（按钮）**
  - **行为**：`mutate()` 刷新当前列表
- **批量删除（按钮）**
  - **行为**：打开批量删除弹窗（`setImageBatchDelete(true)`）
  - **确认删除弹窗**：`components/admin/list/image-batch-delete-sheet.tsx`
    - 取消：仅关闭弹窗
    - 确认删除：`DELETE /api/v1/images/batch-delete`（body 为 id 数组）→ 成功后刷新列表与总数

#### 3）图片卡片布局（layout='card'）

- **卡片左上角 Checkbox**
  - **行为**：选择/取消选择单张图片
- **查看大图详情（右上角按钮 ScanSearch）**
  - **行为**：打开预览侧边栏（`setImageView(true)`），仅展示不改数据
  - **展示组件**：`components/admin/list/image-view.tsx`（含 EXIF 展示、标签 Badge、显示状态 Switch 只读）
- **显示状态开关（Switch）**
  - **行为**：公开/隐藏切换
  - **接口**：`PUT /api/v1/images/update-show`（body: `{ id, show }`）
- **精选星标（StarFilled/StarOutlined）**
  - **行为**：设为/取消精选
  - **接口**：`PUT /api/v1/images/update-featured`（body: `{ imageId, featured }`）
- **排序权重 Badge**
  - **说明**：仅展示 sort 值
- **排序按钮（📌/↑/↓）**
  - **行为**：本地重排并重新计算 sort（0..n），然后持久化
  - **接口**：`PUT /api/v1/images/update-sort`（body: `{ orders: [{id, sort}] }`）
- **绑定相册（Replace 图标 + AlertDialog）**
  - **行为**：弹窗选择目标相册（Select），点击“更新”提交
  - **接口**：`PUT /api/v1/images/update-Album`（body: `{ imageId, albumId }`）
  - **按钮**：取消（清理本地状态）、更新（提交）
- **设为相册封面（ImageIcon）**
  - **行为**：把当前图片 url 作为相册 `cover` 更新
  - **接口**：`PUT /api/v1/albums/update`（body 为目标相册对象 + `cover`）
- **编辑图片信息（SquarePen）**
  - **行为**：打开编辑侧边栏
  - **保存（按钮：保存更改）**：`PUT /api/v1/images/update`（body 为 image 全量）→ 成功后刷新列表
  - **参考图提取 EXIF（按钮）**：仅本地解析写入编辑态，不上传参考图

#### 4）图片列表布局（layout='list'）

列表布局的按钮行为与卡片布局一致（公开开关、排序按钮、编辑按钮等），只是 UI 排版不同。

---

## `/admin/album` 相册管理（`app/admin/album/page.tsx`）

### 按钮/交互点

- **新增相册（AlbumAddButton）**：打开新增侧边栏/弹窗（实现见 `components/admin/album/*`）
- **刷新（RefreshButton）**：重新拉取相册列表（handle: `fetchAlbumsList()`）
- **相册列表（AlbumList）**：包含编辑/排序/显示开关等交互（映射阶段补齐）

### 关键按钮 → 接口映射（`components/admin/album/album-list.tsx`、`album-add-sheet.tsx`）

- **新增提交**：`POST /api/v1/albums/add`
- **删除相册**：`DELETE /api/v1/albums/delete/:id`
- **显示状态开关**：`PUT /api/v1/albums/update-show`
- **排序（置顶/↑/↓）**：`PUT /api/v1/albums/update-sort`（body: `{ orderedIds }`）
- **编辑相册**：打开编辑面板；提交时 `PUT /api/v1/albums/update`（在 `album-edit-sheet.tsx` 内）

---

## `/admin/settings/preferences` 偏好设置（`app/admin/settings/preferences/page.tsx`）

### 核心请求

- 读取：`GET /api/v1/settings/get-custom-info`
- 保存：`PUT /api/v1/settings/update-custom-info`
- 上传（关于我图片）：通过 `uploadFile(...)`（内部通常会走 `/api/v1/file/*` 或相关上传链路，映射阶段精确到接口）

### 按钮/交互点（节选）

- **保存（Card extra 主按钮：`Button.submit`）**：`form.submit()` → `updateInfo()` → `PUT /api/v1/settings/update-custom-info`
- **复制 RSS URI（CopyOutlined）**：复制 `${origin}/rss.xml`
- **画廊图片：添加图片（PlusOutlined）**：触发 `<input type=file multiple>` 选择并上传（最多 10 张）
- **画廊图片：拖拽排序**：对图片卡片进行拖拽调整顺序
- **画廊图片：删除（DeleteOutlined 按钮）**：从画廊数组移除
- **开关（Switch）**：下载开关、预览宽度限制开关、原图开关等（随保存提交）

---

## `/admin/settings/tag` 标签管理（`app/admin/settings/tag/page.tsx`）

- **说明**：渲染 `TagManager`（动态加载）；对应接口见 `docs/api/v1-settings.md` 的 `/tags/*`。

### 按钮级交互点 → 接口映射（`components/admin/tags/tag-manager.tsx`）

- **历史图片标签补全检查（按钮）**
  - **行为**：触发历史数据修复与无效关联清理
  - **接口**：`POST /api/v1/settings/tags/check-completeness`（body: `{ batchSize: 100 }`）
  - **提示**：成功会 toast 汇总（检查总数/修复数/无效关联数）
- **添加一级标签（输入框 + “添加”按钮 / 回车）**
  - **前置条件**：一级标签名非空
  - **接口**：`POST /api/v1/settings/tags/add`（body: `{ name }`）
  - **后续**：刷新树并自动选中新建一级标签（便于立即新增二级）
- **编辑一级标签（“编辑”按钮）**
  - **接口**：`PUT /api/v1/settings/tags/update/:id`（body: `{ name, category: name }`）
  - **按钮**：“保存”“取消”
- **移动一级/二级标签（“移动”按钮）**
  - **弹窗**：选择目标一级标签；留空表示“升级为一级标签”
  - **接口**：`POST /api/v1/settings/tags/move`（body: `{ tagId, targetParentId|null }`）
  - **提示**：成功提示“图片标签关联已自动同步”
- **删除一级标签（“删除”按钮，带确认）**
  - **无子标签**：`DELETE /api/v1/settings/tags/delete/:id`
  - **有子标签**：`DELETE /api/v1/settings/tags/delete-with-children/:id`
- **选择一级标签（列表项点击）**
  - **行为**：切换右侧二级标签列表（无接口）
- **添加二级标签（输入框 + “添加”按钮 / 回车）**
  - **前置条件**：必须已选择一级分类
  - **接口**：`POST /api/v1/settings/tags/add`（body: `{ name, parentId }`）
- **复制二级标签（“复制”按钮）**
  - **行为**：复制标签名到剪贴板（无接口）
- **编辑二级标签（“编辑”按钮）**
  - **接口**：`PUT /api/v1/settings/tags/update/:id`（body: `{ name }`）
- **删除二级标签（“删除”按钮，带确认）**
  - **接口**：`DELETE /api/v1/settings/tags/delete/:id`

---

## `/admin/settings/storages` 存储设置（`app/admin/settings/storages/page.tsx`）

- **Tabs**：S3 / R2 / COS / AList

### 数据读取（各 Tab 初始化）

- AList：`GET /api/v1/settings/alist-info`
- R2：`GET /api/v1/settings/r2-info`
- S3：`GET /api/v1/settings/s3-info`
- COS：`GET /api/v1/settings/cos-info`

### 关键按钮 → 接口映射（`components/admin/settings/storages/*`）

- **刷新（ReloadOutlined）**
  - **行为**：重新拉取当前 Tab 的配置（SWR `mutate()`）
  - **接口**：
    - AList：`GET /api/v1/settings/alist-info`
    - R2：`GET /api/v1/settings/r2-info`
    - S3：`GET /api/v1/settings/s3-info`
    - COS：`GET /api/v1/settings/cos-info`
- **编辑（EditOutlined，主按钮）**
  - **行为**：打开对应 EditSheet（侧边栏），将当前配置深拷贝进编辑态
- **验证配置（SafetyOutlined，仅 S3/COS）**
  - **行为**：调用后端“轻量读写删”检查，并 toast 展示每一步结果
  - **接口**：
    - S3：`GET /api/v1/settings/validate-s3`
    - COS：`GET /api/v1/settings/validate-cos`
- **保存配置（EditSheet / Modal 内）**
  - AList：`PUT /api/v1/settings/update-alist-info`
  - R2：`PUT /api/v1/settings/update-r2-info`
  - S3：`PUT /api/v1/settings/update-s3-info`
  - COS：`PUT /api/v1/settings/update-cos-info`
  - **后续**：成功后会 `mutate('/api/v1/settings/<provider>-info')` 刷新展示
  - **保存前置校验（客户端）**：
    - S3：会检查必要字段（`accesskey_id/accesskey_secret/region/endpoint/bucket`），并规范化 `endpoint(https://)`、`storage_folder`
    - COS：会检查必要字段（`cos_secret_id/cos_secret_key/cos_region/cos_endpoint/cos_bucket`），并规范化 `endpoint(https://)`、`cos_storage_folder`；若开启 `cos_cdn=true`，要求填写 `cos_cdn_url`
    - R2/AList：当前实现无强校验（主要由后端或运行时失败体现）
  - **注意（AList 保存后刷新 key）**：
    - `AlistEditSheet` 保存后触发的刷新是 `mutate('/api/v1/storage/alist/info')`（与 tab 的读取 key `'/api/v1/settings/alist-info'` 不一致），可能导致 UI 不立即刷新；接口层仍以 `PUT /api/v1/settings/update-alist-info` 为准。

---

## `/admin/settings/account` 账号设置（`app/admin/settings/account/page.tsx`）

### 按钮/交互点

- **提交头像（保存按钮）**
  - **行为**：`authClient.updateUser({ image })`（对应 `/api/v1/auth/update-user`）
- **修改密码（保存按钮）**
  - **行为**：`authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions:true })`（对应 `/api/v1/auth/change-password`）

