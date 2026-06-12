# 变更记录：图片排序功能重构（相册内独立排序）

> **状态**：✅ 已完成（2026-04-07）
>
> **目标**：实现相册级别的图片独立排序，替代旧的全局排序

---

## 一、为什么改

原系统图片排序依赖 `images.sort` 字段——**每张图片只有一个全局排序值**。当同一张图片被加入多个相册时，无法在不同相册中保持不同的排序；后台也没有"按相册管理图片顺序"的入口。

问题拆解：

1. **排序粒度太粗**：全局排序无法体现相册内的展示顺序；相册 A 和相册 B 中同一张图片的排序必然一致。
2. **缺乏后台管理入口**：无法在相册页面对图片进行置顶、置底、上移、下移、批量重排。
3. **前台展示与后台管理不一致**：前台相册页按 `images.sort` 排序，但后台无法调整。
4. **缺少迁移路径**：存量 `images.sort` 数据需要平滑迁移到关联表。

---

## 二、改了什么

### 1. 数据库模型改造

- **关联表新增排序字段**：在 `ImagesAlbumsRelation` 中新增 `sort` 列（Int, default 0），存储相册内图片排序权重。
- **新增排序索引**：为 `ImagesAlbumsRelation` 增加 `(album_value, sort)` 联合索引，加速相册内排序查询。
- **迁移脚本**：`prisma/migrations/20260407120000_add_album_image_sort/migration.sql`
  - 添加列与索引
  - 将原 `images.sort` 同步到每个相册内图片的关联表记录
  - 为每个相册内图片重新计算连续排序值

### 2. 服务端新增接口与操作函数

- **数据库操作层**（`lib/db/operate/images.ts`）：
  - `updateImagesAlbumSort(imageId, albumValue, sort)`
  - `batchUpdateImagesAlbumSort(operations[])` — 支持批量置顶/置底/移动到指定位置
  - `fetchAllImagesByAlbum(albumValue)` — 排序管理界面使用
  - `fetchImageCountByAlbum(albumValue)`
  - `resetAlbumImagesSort(albumValue)` — 按 `created_at DESC` 重置排序
- **API 路由**（`server/images.ts`）：
  - `PUT /api/v1/images/album-sort`
  - `PUT /api/v1/images/batch-album-sort`
  - `GET /api/v1/images/album-images/:albumValue`
  - `GET /api/v1/images/album-image-count/:albumValue`
  - `POST /api/v1/images/reset-album-sort/:albumValue`

> 接口路由清单与请求/响应格式见参考文档，不重复展开。

### 3. 前台展示逻辑

- 修改 `lib/db/query/images.ts` 中 `fetchClientImagesListByAlbum` 的排序依据：
  - 从 `images.sort` 改为 `relation.sort ASC, images.created_at DESC`
  - 当相册配置了非默认 `image_sorting` 策略时叠加该策略的排序字段
- 兼容未排序的历史相册：`sort` 未设置时按 `created_at DESC` 展示

### 4. 后台管理界面

- **排序管理面板**（`components/admin/album/album-sort-panel.tsx`）
  - 显示相册内所有图片的缩略图列表
  - 支持单张图片：上移 / 下移 / 置顶 / 置底
  - 支持批量：批量置顶 / 批量置底
  - 支持"重置排序"一键按创建时间降序
  - 保存前检测变更状态，展示"未保存更改"提示

- **相册列表接入**（`components/admin/album/album-list.tsx`）
  - 每个相册卡片增加"管理排序"按钮（Settings2 图标）
  - 按钮旁显示相册内图片数量
  - 点击后打开排序管理面板

### 5. 国际化文案

- `messages/zh.json` / `messages/en.json` 新增：
  - `manageSort`、`sortDescription`、`images`、`selected`、`selectAll`
  - `batchTop`、`batchBottom`、`resetSort`、`noImages`
  - `moveToTop`、`moveUp`、`moveDown`、`moveToBottom`
  - `featured`、`unsavedChanges`

---

## 三、影响范围

1. **数据库 schema 有破坏性变更吗？**
   - 无：`ImagesAlbumsRelation.sort` 为新增列，默认值 0，原有数据通过迁移脚本自动填充。
2. **前台展示受影响吗？**
   - 有：前台相册页图片顺序由新的 `relation.sort` 决定；由于迁移脚本会将旧 `images.sort` 同步过来，视觉上顺序与之前一致。
3. **API 兼容性？**
   - 旧的全局排序 API 保留以兼容前台筛选；新的 `album-sort` 系列 API 由后台排序面板与管理脚本使用。

---

## 四、涉及的代码与脚本

- **数据模型**：`prisma/schema.prisma`（ImagesAlbumsRelation 模型）
- **迁移脚本**：`prisma/migrations/20260407120000_add_album_image_sort/migration.sql`
- **数据库操作层**：`lib/db/operate/images.ts`
- **查询层（前台）**：`lib/db/query/images.ts`
- **API 路由**：`server/images.ts`
- **后台 UI**：
  - `components/admin/album/album-sort-panel.tsx`
  - `components/admin/album/album-list.tsx`
- **国际化**：`messages/zh.json` / `messages/en.json`

---

## 五、怎么验证

1. **数据库迁移**：
   - 运行 `pnpm prisma migrate dev`（或直接执行迁移脚本）
   - 确认 `images_albums_relation.sort` 列存在且有值
   - 确认 `images_albums_relation(album_value, sort)` 索引存在

2. **后台排序管理**：
   - 登录后台 → 相册管理 → 打开某相册的"管理排序"
   - 拖动或使用按钮调整图片顺序 → 保存
   - 再次打开面板，确认排序已持久化
   - 测试"重置排序"按钮 → 全部图片应回到按创建时间降序

3. **前台展示**：
   - 访问前台相册页，图片顺序应与后台排序结果一致
   - 对同一图片加入多个相册，各相册中的排序互不影响

4. **TypeScript 与编译**：
   - `pnpm build` 不报错
   - 新增文件无类型错误

5. **国际化**：
   - 切换语言（zh / en），排序面板文案随之变化

---

## 六、怎么回滚

### 1. 数据层面回滚

- 如发现排序结果异常，可执行：
  ```sql
  -- 重置所有相册的 sort 为 0（此后前台按 created_at 展示）
  UPDATE images_albums_relation SET sort = 0;
  ```
- 若需完全移除该列（不推荐），执行：
  ```sql
  DROP INDEX IF EXISTS images_albums_relation_album_value_sort_idx;
  ALTER TABLE images_albums_relation DROP COLUMN sort;
  ```

### 2. 代码层面回滚

- 回退 `server/images.ts` 中新增的 `album-sort` 路由
- 回退 `lib/db/operate/images.ts` / `lib/db/query/images.ts` 对 `sort` 的读写
- 回退后台 `album-sort-panel.tsx` 与 `album-list.tsx` 中的排序入口

### 3. 关键回滚点

- 前台查询使用 `images.sort` 的逻辑被替换为 `relation.sort`；如需紧急回退，恢复 `lib/db/query/images.ts` 的 ORDER BY 语句即可。

---

## 七、相关文档链接

- **接口路由清单与请求/响应参数** → [`reference/api-reference.md`](../reference/api-reference.md)（第 4.x 排序小节）
- **ImagesAlbumsRelation 字段与索引说明** → [`reference/data-model.md`](../reference/data-model.md)（2.3 关联表章节）
- **后台排序面板交互细节** → [`reference/admin-ui.md`](../reference/admin-ui.md)
- **总变更记录** → [`project-notes/changelog.md`](./changelog.md)

---

*最后更新：2026-06-12*
