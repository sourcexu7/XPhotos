# Prisma 数据模型摘要（与接口/功能相关）

来源：`prisma/schema.prisma`

> 仅摘录与接口、页面按钮、业务流程直接相关的模型与字段。完整字段以 schema 为准。

## Images（`images`）

用于：前台画廊展示、预览页、后台图片管理、上传入库。

- **主键**：`id: String`
  - 上传入库时常由前端生成（例如 `client_image_id`）并作为 `Images.id` 使用
- **资源链接**：
  - `url`：原图 URL
  - `preview_url`：预览图 URL
  - `video_url`：LivePhoto 视频 URL（`type=2`）
  - `original_key/preview_key/video_key`：对象存储 key（如有）
- **展示控制**：
  - `show`：0=公开，1=隐藏（后台开关与筛选常用）
  - `show_on_mainpage`：是否在首页展示（具体逻辑取决于查询实现）
  - `featured`：0/1（精选）
  - `sort`：排序权重（列表排序与“置顶/上下移动”会更新该值）
- **拍摄与信息**：
  - `exif: Json`：EXIF 信息（相机、镜头、ISO、光圈、快门、拍摄时间等）
  - `shoot_at: DateTime?`：拍摄时间（迁移中新增，用于按拍摄时间排序/筛选）
  - `labels: Json?`：标签（兼容历史；同时存在 Tags 多对多表）
  - `title/detail/lon/lat/width/height/blurhash`
- **软删除**：`del`（0=正常，1=删除）

### 与相册/标签关系

- 多对多（图片 ↔ 相册）：`ImagesAlbumsRelation`
- 多对多（图片 ↔ 标签）：`ImagesTagsRelation`

## Albums（`albums`）

用于：封面页、主题相册页、后台相册管理、图片归属与排序规则。

- `id`：主键
- `name`：相册名
- `album_value`：**相册路由值**（唯一），例如 `'/city'`，前台通过它进行路由跳转
- `cover`：封面图 URL（后台“设为相册封面”会更新）
- `show`：0=公开，1=隐藏
- `sort`：排序（后台相册排序按钮会更新）
- `random_show`：随机展示开关（具体效果由查询实现决定）
- `theme`：主题选择（如 0/1）
- `image_sorting`：图片排序规则（枚举值含义见后台表单选项）
- `license`：授权信息（前台下载提示会展示）
- `del`：软删除

## Configs（`configs`）

用于：站点设置、前台 about/site-info、下载开关、上传限制、存储配置等。

- `config_key`（唯一）+ `config_value`

常见 key（在代码中出现频繁）：

- 前台展示：`custom_title`、`custom_author`、`custom_index_style`、`custom_index_download_enable`、`custom_index_origin_enable`
- RSS：`rss_feed_id`、`rss_user_id`
- 关于我：`about_intro`、`about_*_url`、`about_gallery_images`、`about_gallery_images_full`
- 上传与预览：`max_upload_files`、`preview_quality`、`preview_max_width_limit(_switch)`
- 统计：`umami_host`、`umami_analytics`
- 存储：`alist_*`、`r2_*`、`accesskey_*`/`bucket`/`endpoint`/`storage_folder`、`cos_*` 等

## Tags（`tags`）与 ImagesTagsRelation（`images_tags_relation`）

用于：标签树/分类管理、前台/后台筛选、历史标签补全同步。

- `Tags` 支持树形结构：`parentId` + `children`
- `name` 唯一；可选 `category`
- `ImagesTagsRelation` 记录 `imageId` 与 `tagId` 的关联（unique(imageId,tagId)）

## ImagesAlbumsRelation（`images_albums_relation`）

用于：图片与相册的多对多（当前实现里常用于把图片绑定到某个相册）。

- 复合主键：`(imageId, album_value)`
- `album_value` 关联到 `Albums.album_value`（注意不是 albums.id）

## VisitLog（`visit_log`）

用于：公开接口 `/api/v1/public/visit-log` 写入访问日志；后台统计读取汇总。

- `path`：访问路径
- `pageType`：`home|gallery|album|admin|other`
- `ip/userAgent/referrer/source`
- `createdAt`

## 认证相关（better-auth：`user/account/session/...`）

用于：后台登录、`/api/v1/auth/*`、cookie `auth_token` 的 JWT payload 等。

- `User`：`id/name/email/image`
- `Account`：包含 `password`（密码登录使用）
- `Session`：会话表（项目当前主要使用自签 JWT + cookie；是否与 Session 强绑定取决于其它实现）
- `Passkey` / `TwoFactor` / `Verification`：与 passkey/2FA/校验相关的表

