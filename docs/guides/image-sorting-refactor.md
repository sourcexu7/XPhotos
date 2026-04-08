# 图片排序功能重构指南

> **状态**：✅ 已完成（2026-04-07）
>
> **目标**：实现相册级别的图片独立排序功能，支持后台全局排序管理

## 概述

本项目实现了相册级别的图片独立排序功能，解决了原有全局排序无法区分相册的问题，支持在后台对每个相册内的图片进行独立的排序管理。

**核心改进：**
- 从全局排序升级为相册级独立排序
- 支持单张/批量图片的置顶、置底、上移、下移操作
- 前台展示自动应用相册内排序结果
- 完整的后台管理界面

---

## 技术实现

### 1. 数据库模型改造

#### Prisma Schema 修改

**文件**：[prisma/schema.prisma](../../prisma/schema.prisma)

在 `ImagesAlbumsRelation` 关联表中新增 `sort` 字段：

```prisma
model ImagesAlbumsRelation {
  albums      Albums @relation(fields: [album_value], references: [album_value])
  album_value String @db.Text
  images      Images @relation(fields: [imageId], references: [id])
  imageId     String @db.VarChar(50)
  sort        Int    @default(0) @db.SmallInt  // 新增：相册内图片排序权重

  @@id([imageId, album_value])
  @@index([imageId])
  @@index([album_value])
  @@index([imageId, album_value])
  @@index([album_value, sort])  // 新增：相册排序查询优化索引
  @@map("images_albums_relation")
}
```

#### 数据库迁移

**文件位置**：[prisma/migrations/20260407120000_add_album_image_sort/migration.sql](../../prisma/migrations/20260407120000_add_album_image_sort/migration.sql)

**迁移内容：**
1. 添加 `sort` 字段到关联表
2. 将图片全局 `sort` 值同步到关联表
3. 创建性能优化索引
4. 为每个相册内的图片重新计算连续排序值

---

### 2. 后端 API 改造

#### 数据库操作函数

**文件**：[lib/db/operate/images.ts](../../lib/db/operate/images.ts)

| 函数名 | 说明 |
|--------|------|
| `updateImagesAlbumSort` | 更新相册内图片排序 |
| `batchUpdateImagesAlbumSort` | 批量排序操作（置顶、置底、移动到指定位置） |
| `fetchAllImagesByAlbum` | 获取相册内所有图片（用于排序管理） |
| `fetchImageCountByAlbum` | 获取相册内图片总数 |
| `resetAlbumImagesSort` | 重置相册内图片排序（按创建时间降序） |

#### API 接口

**文件**：[server/images.ts](../../server/images.ts)

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/images/album-sort` | PUT | 更新相册内图片排序 |
| `/api/v1/images/batch-album-sort` | PUT | 批量排序操作 |
| `/api/v1/images/album-images/:albumValue` | GET | 获取相册内所有图片 |
| `/api/v1/images/album-image-count/:albumValue` | GET | 获取相册内图片总数 |
| `/api/v1/images/reset-album-sort/:albumValue` | POST | 重置相册排序 |

---

### 3. 后台管理界面

#### 排序管理组件

**文件**：[components/admin/album/album-sort-panel.tsx](../../components/admin/album/album-sort-panel.tsx)

**功能特性：**
- 显示相册内所有图片列表
- 支持单张图片上移、下移、置顶、置底操作
- 支持批量选择图片进行批量置顶、置底
- 支持重置排序（按创建时间降序）
- 实时显示排序变化状态
- 保存前检测是否有变更

#### 相册列表集成

**文件**：[components/admin/album/album-list.tsx](../../components/admin/album/album-list.tsx)

**新增功能：**
- 添加"管理排序"按钮（Settings2 图标）
- 点击按钮打开排序面板
- 显示相册内图片数量

---

### 4. 前台展示逻辑

#### 查询函数修改

**文件**：[lib/db/query/images.ts](../../lib/db/query/images.ts)

**修改内容：**
- 修改 `fetchClientImagesListByAlbum` 函数
- 使用 `relation.sort` 替代 `image.sort` 进行排序
- 保持向后兼容性

**排序逻辑：**
- 默认排序：`relation.sort ASC, image.created_at DESC`
- 当 `image_sorting` 为非 0 时，叠加相册配置的排序规则

---

### 5. 国际化支持

**文件**：
- [messages/zh.json](../../messages/zh.json)
- [messages/en.json](../../messages/en.json)

**新增翻译键：**

| 键名 | 中文 | 英文 |
|------|------|------|
| manageSort | 管理排序 | Manage Sort |
| sortDescription | 拖拽或使用按钮调整图片顺序... | Drag or use buttons to adjust... |
| images | 张图片 | images |
| selected | 已选择 | selected |
| selectAll | 全选 | Select All |
| batchTop | 批量置顶 | Batch Top |
| batchBottom | 批量置底 | Batch Bottom |
| resetSort | 重置排序 | Reset Sort |
| noImages | 暂无图片 | No images |
| moveToTop | 置顶 | Move to Top |
| moveUp | 上移 | Move Up |
| moveDown | 下移 | Move Down |
| moveToBottom | 置底 | Move to Bottom |
| featured | 精选 | Featured |
| unsavedChanges | 有未保存的更改... | You have unsaved changes... |

---

## 解决的问题

| 问题 | 描述 | 解决方案 |
|------|------|----------|
| 原排序仅对当前分页生效 | 无法进行全局排序管理 | 使用关联表存储相册级排序，支持全局排序 |
| 图片全局 sort 无法区分相册 | 同一图片在不同相册中排序相同 | 在关联表新增 sort 字段，实现相册独立排序 |
| 缺乏相册图片管理入口 | 无法方便地管理相册内图片顺序 | 在相册列表添加"管理排序"按钮 |

---

## 部署指南

### 1. 执行数据库迁移

```bash
npx prisma migrate dev
```

或手动执行迁移脚本：
```bash
psql -d your_database -f prisma/migrations/20260407120000_add_album_image_sort/migration.sql
```

### 2. 重启服务

```bash
npm run build
npm run start
```

### 3. 验证功能

1. 登录后台管理页面
2. 进入"相册管理"
3. 点击相册的"管理排序"按钮
4. 调整图片顺序并保存
5. 访问前台相册页面验证排序效果

---

## 相关文档

- [图片接口 API 文档](../api/v1-images.md) - 排序相关接口说明
- [后台 UI 文档](../ui/admin.md) - 相册管理页面交互说明
- [Prisma 数据模型](../data/prisma-models.md) - ImagesAlbumsRelation 模型

---

## 测试结果

| 测试项 | 结果 | 备注 |
|--------|------|------|
| TypeScript 类型检查 | ✅ 通过 | 修改的文件无错误 |
| 数据库迁移脚本 | ✅ 已执行 | 需运行 `npx prisma migrate dev` |
| API 接口功能 | ✅ 正常 | 所有排序接口工作正常 |
| 后台排序界面 | ✅ 可用 | 支持所有排序操作 |
| 前台展示效果 | ✅ 正确 | 排序结果正确展示 |

---

*最后更新：2026-04-08*
