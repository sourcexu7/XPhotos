# XPhotos 数据模型参考

> **权威来源**：`prisma/schema.prisma`（PostgreSQL + Prisma）
>
> 本文件汇总项目当前**真实存在**的数据库模型、字段、索引与表间关系。字段含义、变更原因、迁移脚本与回滚方式等信息，请通过「模型演进」章节跳转至对应 refactor 文档阅读。

---

## 一、模型总览

| 模型（Prisma） | 表名（DB） | 用途 | 主要关联 |
|---|---|---|---|
| `Images` | `images` | 图片主表（画廊/预览/后台管理） | `ImagesAlbumsRelation`、`ImagesTagsRelation` |
| `Albums` | `albums` | 相册主表（封面页/主题相册） | `ImagesAlbumsRelation`、`GuideAlbumsRelation` |
| `ImagesAlbumsRelation` | `images_albums_relation` | 图片 ↔ 相册多对多，含相册内排序 | `Albums`、`Images` |
| `Tags` | `tags` | 标签树，支持二级层级 | `ImagesTagsRelation`、自身自引用（parent/children） |
| `ImagesTagsRelation` | `images_tags_relation` | 图片 ↔ 标签多对多 | `Images`、`Tags` |
| `Configs` | `configs` | 站点设置（K/V） | — |
| `VisitLog` | `visit_log` | 访问日志（后台统计） | — |
| `Guides` | `guides` | 攻略主表（2026-04 新增） | `GuideComponents`、`GuideModules`、`GuideTableOfContents`、`GuideAlbumsRelation` |
| `GuideComponents` | `guide_components` | 旧版组件表（兼容保留） | `Guides` |
| `GuideModules` | `guide_modules` | 攻略模块（新版块化编辑器） | `Guides`、`GuideModuleContents` |
| `GuideModuleContents` | `guide_module_contents` | 模块内容（支持多类型） | `GuideModules` |
| `GuideTableOfContents` | `guide_table_of_contents` | 攻略目录 | `Guides` |
| `GuideAlbumsRelation` | `guide_albums_relation` | 攻略 ↔ 相册多对多 | `Guides`、`Albums` |
| `User` | `user` | 用户（better-auth） | `Account`、`Session`、`TwoFactor` |
| `Account` | `account` | 登录账号（含 password） | `User` |
| `Session` | `session` | 登录会话 | `User` |
| `TwoFactor` | `two_factor` | 2FA 凭据 | `User` |
| `Verification` | `verification` | 校验 token（邮箱/其它） | — |

---

## 二、业务核心模型

### 2.1 Images（图片主表）

表名：`images`

**字段**

| 字段 | 类型（Prisma） | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `String @id` | `VarChar(50)` | `cuid()` | 主键，上传时常由前端预生成 |
| `image_name` | `String?` | `Text` | — | 图片文件名 |
| `url` | `String?` | `Text` | — | 原图 URL |
| `preview_url` | `String?` | `Text` | — | 预览图 URL |
| `video_url` | `String?` | `Text` | — | LivePhoto 视频 URL（`type=2`） |
| `original_key` | `String?` | `Text` | — | 对象存储 key（原图） |
| `preview_key` | `String?` | `Text` | — | 对象存储 key（预览） |
| `video_key` | `String?` | `Text` | — | 对象存储 key（视频） |
| `blurhash` | `String?` | `Text` | — | BlurHash 占位符 |
| `exif` | `Json?` | `Json` | — | EXIF 信息（相机、镜头、ISO、光圈、快门等） |
| `shoot_at` | `DateTime?` | `Timestamp` | — | 拍摄时间（用于按拍摄时间排序/筛选） |
| `labels` | `Json?` | `Json` | — | 历史标签字段（同时存在 Tags 多对多表） |
| `width` | `Int` | — | `0` | 图片宽度 |
| `height` | `Int` | — | `0` | 图片高度 |
| `lon` | `String?` | — | — | 经度 |
| `lat` | `String?` | — | — | 纬度 |
| `title` | `String?` | `VarChar(200)` | — | 图片标题 |
| `detail` | `String?` | `Text` | — | 图片描述 |
| `type` | `Int` | `SmallInt` | `1` | `1`=普通图片；`2`=LivePhoto |
| `show` | `Int` | `SmallInt` | `1` | 展示控制（后台开关与筛选常用） |
| `show_on_mainpage` | `Int` | `SmallInt` | `1` | 是否在首页展示 |
| `featured` | `Int` | `SmallInt` | `0` | 精选图片（0/1） |
| `sort` | `Int` | `SmallInt` | `0` | 图片全局排序权重 |
| `createdAt`（`created_at`） | `DateTime` | `Timestamp` | `now()` | 创建时间 |
| `updatedAt`（`updated_at`） | `DateTime?` | `Timestamp` | auto | 更新时间 |
| `del` | `Int` | `SmallInt` | `0` | 软删除（0=正常，1=删除） |

**关联**

- `imagesAlbumsRelation: ImagesAlbumsRelation[]`
- `imagesTagsRelation: ImagesTagsRelation[]`

**索引（Prisma 显式声明）**

- `@@index([del, show])` — 筛选未删除且公开的图片
- `@@index([featured])` — 精选图片查询
- `@@index([createdAt])` — 时间排序
- `@@index([show, show_on_mainpage])` — 首页展示筛选
- `@@index([del, show, featured])` — 多条件筛选

> JSONB 字段（`exif`、`labels`）的 GIN 索引需在迁移脚本中手动创建，Prisma schema 未显式声明。

---

### 2.2 Albums（相册）

表名：`albums`

**字段**

| 字段 | 类型 | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `String @id` | `VarChar(50)` | `cuid()` | 主键 |
| `name` | `String` | `VarChar(200)` | — | 相册名 |
| `album_value` | `String @unique` | `Text` | — | **相册路由值**（唯一，例如 `/city`），前台路由依据 |
| `detail` | `String?` | `Text` | — | 相册描述 |
| `theme` | `String` | `Text` | `"0"` | 主题选择 |
| `show` | `Int` | `SmallInt` | `1` | 展示控制 |
| `sort` | `Int` | `SmallInt` | `0` | 相册排序 |
| `random_show` | `Int` | `SmallInt` | `1` | 随机展示开关 |
| `license` | `String?` | `Text` | — | 授权信息 |
| `cover` | `String?` | `Text` | — | 封面图 URL |
| `image_sorting` | `Int` | `SmallInt` | `1` | 图片排序规则 |
| `createdAt`（`created_at`） | `DateTime` | `Timestamp` | `now()` | — |
| `updatedAt`（`updated_at`） | `DateTime?` | `Timestamp` | auto | — |
| `del` | `Int` | `SmallInt` | `0` | 软删除 |

**关联**

- `imagesAlbumsRelation: ImagesAlbumsRelation[]`
- `guide_albums_relation: GuideAlbumsRelation[]`

**索引**

- `@@index([del, show])` — 相册筛选
- `@@index([album_value])` — 相册路由值查询（与 `@unique` 互补）

---

### 2.3 ImagesAlbumsRelation（图片 ↔ 相册多对多 + 相册内排序）

表名：`images_albums_relation`

> **重点**：该表除承担多对多关联外，**额外承担相册级的图片排序功能**。`sort` 字段为相册内独立排序，区别于 `Images.sort`（全局）。

**字段**

| 字段 | 类型 | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `album_value` | `String` | `Text` | — | 外键 → `Albums.album_value`（⚠️ 注意：不是 `Albums.id`） |
| `imageId` | `String` | `VarChar(50)` | — | 外键 → `Images.id` |
| `sort` | `Int` | `SmallInt` | `0` | **相册内图片排序权重**（2026-04 新增） |

**主键 / 唯一约束**

- `@@id([imageId, album_value])` — 复合主键

**关联**

- `albums: Albums @relation(fields: [album_value], references: [album_value])`
- `images: Images @relation(fields: [imageId], references: [id])`

**索引**

- `@@index([imageId])`
- `@@index([album_value])`
- `@@index([imageId, album_value])`
- **`@@index([album_value, sort])`** — 相册内排序查询优化（前台 `ORDER BY relation.sort ASC, image.created_at DESC` 的关键索引）

---

### 2.4 Tags + ImagesTagsRelation（标签层级 + 图片标签关联）

#### Tags（`tags`）

> **重点**：`Tags` 是一个树形结构，通过 `parentId` 自引用支持一级 / 二级标签。`category` 字段用于标识标签的分类（通常等于一级标签的 `name`）。

**字段**

| 字段 | 类型 | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `String @id` | `VarChar(50)` | `cuid()` | 主键 |
| `name` | `String @unique` | `VarChar(200)` | — | 标签名称（全局唯一） |
| `category` | `String?` | `VarChar(200)` | — | 标签分类（通常等于其一级标签的 `name`） |
| `parentId` | `String?` | `VarChar(50)` | — | 父级标签 ID（一级标签为 `null`，二级标签指向一级） |
| `detail` | `String?` | `Text` | — | 标签描述 |
| `createdAt`（`created_at`） | `DateTime` | `Timestamp` | `now()` | — |
| `updatedAt`（`updated_at`） | `DateTime?` | `Timestamp` | auto | — |

**关联（自引用）**

- `parent: Tags? @relation("TagChildren", fields: [parentId], references: [id], onDelete: SetNull)`
- `children: Tags[] @relation("TagChildren")`
- `images: ImagesTagsRelation[]`

#### ImagesTagsRelation（`images_tags_relation`）

**字段**

| 字段 | 类型 | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `String @id` | `VarChar(50)` | `cuid()` | 主键 |
| `imageId` | `String` | `VarChar(50)` | — | 外键 → `Images.id` |
| `tagId` | `String` | `VarChar(50)` | — | 外键 → `Tags.id` |
| `createdAt`（`created_at`） | `DateTime` | `Timestamp` | `now()` | — |

**唯一约束**

- `@@unique([imageId, tagId])`

**关联**

- `image: Images @relation(fields: [imageId], references: [id], onDelete: Cascade)`
- `tag: Tags @relation(fields: [tagId], references: [id], onDelete: Cascade)`

**索引**

- `@@index([imageId])`
- `@@index([tagId])`

---

### 2.5 Configs（站点设置）

表名：`configs`

**字段**

| 字段 | 类型 | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `String @id` | `VarChar(50)` | `cuid()` | 主键 |
| `config_key` | `String @unique` | `VarChar(200)` | — | 配置项 key（唯一） |
| `config_value` | `String?` | `Text` | — | 配置项 value |
| `detail` | `String?` | `Text` | — | 配置项说明 |
| `createdAt`（`created_at`） | `DateTime` | `Timestamp` | `now()` | — |
| `updatedAt`（`updated_at`） | `DateTime?` | `Timestamp` | auto | — |

**常见 config_key 清单（来自代码中频繁使用的 key）**

| 分组 | key |
|---|---|
| 前台展示 | `custom_title`、`custom_author`、`custom_index_style`、`custom_index_download_enable`、`custom_index_origin_enable` |
| RSS | `rss_feed_id`、`rss_user_id` |
| 关于我 | `about_intro`、`about_*_url`、`about_gallery_images`、`about_gallery_images_full` |
| 上传与预览 | `max_upload_files`、`preview_quality`、`preview_max_width_limit`、`preview_max_width_limit_switch` |
| 统计 | `umami_host`、`umami_analytics` |
| 存储 | `alist_*`、`r2_*`、`accesskey_*`、`bucket`、`endpoint`、`storage_folder`、`cos_*` 等 |

---

### 2.6 VisitLog（访问日志）

表名：`visit_log`

**字段**

| 字段 | 类型 | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `String @id` | `VarChar(50)` | `cuid()` | 主键 |
| `path` | `String` | `Text` | — | 访问路径 |
| `pageType` | `String` | `VarChar(50)` | — | 页面类型：`home` / `gallery` / `album` / `admin` / `other` |
| `ip` | `String?` | `VarChar(100)` | — | 访问 IP |
| `userAgent` | `String?` | `Text` | — | User-Agent |
| `referrer` | `String?` | `Text` | — | 来源地址 |
| `source` | `String?` | `VarChar(50)` | — | 来源类型：`direct` / `referer` / `search` |
| `createdAt`（`created_at`） | `DateTime` | `Timestamp` | `now()` | — |

**索引**

- `@@index([createdAt])`
- `@@index([path])`

---

## 三、攻略系统模型（2026-04 新增）

### 3.1 Guides（攻略主表）

表名：`guides`

**字段**

| 字段 | 类型 | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `String @id` | `VarChar(50)` | `cuid()` | 主键 |
| `title` | `String` | `VarChar(200)` | — | 攻略标题 |
| `country` | `String` | `VarChar(100)` | — | 国家 |
| `city` | `String` | `VarChar(100)` | — | 城市 |
| `days` | `Int` | `SmallInt` | — | 天数 |
| `start_date` | `DateTime?` | `Timestamp` | — | 起始日期 |
| `end_date` | `DateTime?` | `Timestamp` | — | 结束日期 |
| `cover_image` | `String?` | `Text` | — | 封面图 URL |
| `content` | `Json?` | `Json` | — | 攻略内容 |
| `show` | `Int` | `SmallInt` | `1` | 展示控制 |
| `sort` | `Int` | `SmallInt` | `0` | 排序 |
| `createdAt`（`created_at`） | `DateTime` | `Timestamp` | `now()` | — |
| `updatedAt`（`updated_at`） | `DateTime?` | `Timestamp` | auto | — |
| `del` | `Int` | `SmallInt` | `0` | 软删除 |

**关联**

- `components: GuideComponents[]`
- `albums: GuideAlbumsRelation[]`
- `modules: GuideModules[]`
- `tableOfContents: GuideTableOfContents[]`

**索引**

- `@@index([del, show])`
- `@@index([country, city])`
- `@@index([days])`

---

### 3.2 GuideComponents（旧版组件表，兼容保留）

表名：`guide_components`

| 字段 | 类型 | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `String @id` | `VarChar(50)` | `cuid()` | — |
| `guide_id` | `String` | `VarChar(50)` | — | 外键 → `Guides.id`（`onDelete: Cascade`） |
| `type` | `String` | `VarChar(50)` | — | `image` / `map` / `table` / `list` / `text` |
| `content` | `Json?` | `Json` | — | 组件内容 |
| `sort` | `Int` | — | `0` | 组件排序 |
| `createdAt` | `DateTime` | `Timestamp` | `now()` | — |
| `updatedAt` | `DateTime?` | `Timestamp` | auto | — |

**索引**：`@@index([guide_id])`

---

### 3.3 GuideModules（模块 — 新版块化编辑器）

表名：`guide_modules`

| 字段 | 类型 | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `String @id` | `VarChar(50)` | `cuid()` | — |
| `guide_id` | `String` | `VarChar(50)` | — | 外键 → `Guides.id`（`onDelete: Cascade`） |
| `name` | `String` | `VarChar(100)` | — | 模块名 |
| `template` | `String?` | `VarChar(50)` | — | 模板类型：`itinerary` / `expense` / `checklist` / `attraction` / `food` / `tips` |
| `sort` | `Int` | — | `0` | 模块排序 |
| `is_hidden` | `Boolean` | — | `false` | 是否隐藏 |
| `createdAt` | `DateTime` | `Timestamp` | `now()` | — |
| `updatedAt` | `DateTime?` | `Timestamp` | auto | — |

**关联**

- `guide: Guides`
- `contents: GuideModuleContents[]`

**索引**

- `@@index([guide_id])`
- `@@index([guide_id, sort])`

---

### 3.4 GuideModuleContents（模块内容 — 支持多类型）

表名：`guide_module_contents`

| 字段 | 类型 | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `String @id` | `VarChar(50)` | `cuid()` | — |
| `module_id` | `String` | `VarChar(50)` | — | 外键 → `GuideModules.id`（`onDelete: Cascade`） |
| `type` | `String` | `VarChar(50)` | — | `text` / `image` / `table` / `video` / `code` / `latex` / `link` / `card` |
| `content` | `Json?` | `Json` | — | 具体内容 |
| `sort` | `Int` | — | `0` | 内容排序 |
| `createdAt` | `DateTime` | `Timestamp` | `now()` | — |
| `updatedAt` | `DateTime?` | `Timestamp` | auto | — |

**索引**

- `@@index([module_id])`
- `@@index([module_id, sort])`

---

### 3.5 GuideTableOfContents（目录）

表名：`guide_table_of_contents`

| 字段 | 类型 | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `String @id` | `VarChar(50)` | `cuid()` | — |
| `guide_id` | `String` | `VarChar(50)` | — | 外键 → `Guides.id`（`onDelete: Cascade`） |
| `title` | `String` | `VarChar(200)` | — | 目录标题 |
| `level` | `Int` | `SmallInt` | `1` | `1`=一级，`2`=二级 |
| `target_id` | `String?` | `VarChar(50)` | — | 关联的模块 ID 或内容 ID |
| `target_type` | `String?` | `VarChar(50)` | — | `module` 或 `content` |
| `sort` | `Int` | — | `0` | 目录排序 |
| `is_hidden` | `Boolean` | — | `false` | 是否隐藏 |
| `createdAt` | `DateTime` | `Timestamp` | `now()` | — |

**索引**

- `@@index([guide_id])`
- `@@index([guide_id, sort])`

---

### 3.6 GuideAlbumsRelation（攻略 ↔ 相册）

表名：`guide_albums_relation`

| 字段 | 类型 | DB 类型 | 默认值 | 说明 |
|---|---|---|---|---|
| `id` | `String @id` | `VarChar(50)` | `cuid()` | — |
| `guide_id` | `String` | `VarChar(50)` | — | 外键 → `Guides.id`（`onDelete: Cascade`） |
| `album_id` | `String` | `VarChar(50)` | — | 外键 → `Albums.id`（`onDelete: Cascade`） |
| `createdAt` | `DateTime` | `Timestamp` | `now()` | — |

**唯一约束**：`@@unique([guide_id, album_id])`

**索引**

- `@@index([guide_id])`
- `@@index([album_id])`

---

## 四、认证与会话模型

基于 better-auth 生成。

### 4.1 User（`user`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `String @id` | 主键 |
| `name` | `String @unique` | 用户名（唯一） |
| `email` | `String` | 邮箱 |
| `emailVerified` | `Boolean` | 邮箱是否已验证 |
| `image` | `String?` | 头像 URL |
| `twoFactorEnabled` | `Boolean?` | 是否启用 2FA |
| `createdAt` | `DateTime @db.Timestamp` | — |
| `updatedAt` | `DateTime @db.Timestamp` | — |

**约束**：`@@unique([email])`

**关联**：`sessions: Session[]`、`accounts: Account[]`、`TwoFactor: TwoFactor[]`

### 4.2 Account（`account`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `String @id` | 主键 |
| `accountId` | `String` | 账号 ID（第三方账号时可能不同） |
| `providerId` | `String` | 登录提供者 ID |
| `userId` | `String` | 外键 → `User.id`（`onDelete: Cascade`） |
| `accessToken` | `String?` | — |
| `refreshToken` | `String?` | — |
| `idToken` | `String?` | — |
| `accessTokenExpiresAt` | `DateTime?` | — |
| `refreshTokenExpiresAt` | `DateTime?` | — |
| `scope` | `String?` | — |
| `password` | `String? @db.VarChar(200)` | **密码登录所用** |
| `createdAt` | `DateTime @db.Timestamp` | — |
| `updatedAt` | `DateTime @db.Timestamp` | — |

### 4.3 Session（`session`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `String @id` | 主键 |
| `expiresAt` | `DateTime @db.Timestamp` | 过期时间 |
| `token` | `String` | 会话 token（唯一） |
| `createdAt` | `DateTime @db.Timestamp` | — |
| `updatedAt` | `DateTime @db.Timestamp` | — |
| `ipAddress` | `String?` | — |
| `userAgent` | `String?` | — |
| `userId` | `String` | 外键 → `User.id`（`onDelete: Cascade`） |

**约束**：`@@unique([token])`

### 4.4 TwoFactor（`two_factor`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `String @id` | 主键 |
| `secret` | `String` | 2FA 密钥 |
| `backupCodes` | `String` | 备用码 |
| `userId` | `String` | 外键 → `User.id`（`onDelete: Cascade`） |

### 4.5 Verification（`verification`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `String @id` | 主键 |
| `identifier` | `String` | 校验标识（如邮箱） |
| `value` | `String` | token 值 |
| `expiresAt` | `DateTime @db.Timestamp` | 过期时间 |
| `createdAt` | `DateTime? @db.Timestamp` | — |
| `updatedAt` | `DateTime? @db.Timestamp` | — |

---

## 五、索引与性能要点

以下汇总 **Prisma schema 显式声明**的所有索引。

### 5.1 Images（`images`）

| 索引 | 声明位置 | 说明 |
|---|---|---|
| `(del, show)` | `schema.prisma` | 筛选未删除且公开的图片 |
| `(featured)` | `schema.prisma` | 精选查询 |
| `(createdAt)` | `schema.prisma` | 时间排序 |
| `(show, show_on_mainpage)` | `schema.prisma` | 首页展示筛选 |
| `(del, show, featured)` | `schema.prisma` | 多条件联合筛选 |
| `(shoot_at)` | `schema.prisma` | 按拍摄时间排序/筛选 |
| `labels`（GIN） | 迁移脚本 | Prisma schema 不支持 JSONB 声明，需在迁移脚本中手动创建 |
| `exif`（GIN） | 迁移脚本 | 同上 |

### 5.2 Albums（`albums`）

| 索引 | 声明位置 |
|---|---|
| `(del, show)` | `schema.prisma` |
| `(album_value)` | `schema.prisma`（与 `@unique` 互补） |

### 5.3 ImagesAlbumsRelation（`images_albums_relation`）

| 索引 | 声明位置 | 说明 |
|---|---|---|
| `(imageId)` | `schema.prisma` | — |
| `(album_value)` | `schema.prisma` | — |
| `(imageId, album_value)` | `schema.prisma` | 联合查询 |
| **`(album_value, sort)`** | `schema.prisma` | **相册内排序查询优化的关键索引** |

### 5.4 ImagesTagsRelation（`images_tags_relation`）

| 索引 | 声明位置 |
|---|---|
| `(imageId)` | `schema.prisma` |
| `(tagId)` | `schema.prisma` |

### 5.5 VisitLog（`visit_log`）

| 索引 | 声明位置 |
|---|---|
| `(createdAt)` | `schema.prisma` |
| `(path)` | `schema.prisma` |
| `("pageType")` | `schema.prisma` |

### 5.6 Guides 系列

| 表 | 索引 | 声明位置 |
|---|---|---|
| `guides` | `(del, show)` / `(country, city)` / `(days)` | `schema.prisma` |
| `guide_components` | `(guide_id)` | `schema.prisma` |
| `guide_modules` | `(guide_id)` / `(guide_id, sort)` | `schema.prisma` |
| `guide_module_contents` | `(module_id)` / `(module_id, sort)` | `schema.prisma` |
| `guide_table_of_contents` | `(guide_id)` / `(guide_id, sort)` | `schema.prisma` |
| `guide_albums_relation` | `(guide_id)` / `(album_id)` / `UNIQUE(guide_id, album_id)` | `schema.prisma` |

---

## 六、模型演进与变更记录

关于字段添加原因、迁移脚本位置与回滚方式，请跳转至下列文档：

- 相册内图片排序改造（`ImagesAlbumsRelation` 新增 `sort` 字段 + `(album_value, sort)` 索引）：  
  👉 [`docs/guides/image-sorting-refactor.md`](../guides/image-sorting-refactor.md)

- 标签层级管理改造（`Tags.parentId`、`Tags.category`、标签移动与图片标签同步）：  
  👉 [`docs/guides/tag-management-refactor.md`](../guides/tag-management-refactor.md)

- 攻略系统 2026-04 新增（`Guides` / `GuideComponents` / `GuideModules` / `GuideModuleContents` / `GuideTableOfContents` / `GuideAlbumsRelation`）：  
  👉 对应后台 UI 与接口见 [`docs/ui/admin.md`](../ui/admin.md)、[`docs/api/`](../api/)

- 认证与会话模型（better-auth）：  
  👉 [`docs/api/v1-auth.md`](../api/v1-auth.md)

- 补充性能索引脚本（Images.shoot_at、VisitLog.pageType 等）：  
  👉 `prisma/schema.prisma` 中的索引声明

---

## 七、来源文档清单

本文件基于以下真实文件整理生成（按引用顺序）：

1. `prisma/schema.prisma` — **最终权威**
2. `docs/data/prisma-models.md` — 模型摘要（接口/功能相关）
3. `docs/guides/image-sorting-refactor.md` — 相册图片排序改造
4. `docs/guides/tag-management-refactor.md` — 标签层级管理改造
5. `docs/api/v1-auth.md` — 认证相关表与接口
6. `prisma/schema.prisma` — 补充性能索引

> ⚠️ `docs/api/v1-guides.md` 当前项目中不存在；攻略相关字段以 `prisma/schema.prisma` 为权威来源。
