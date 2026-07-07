# 变更记录：标签管理功能重构（二级标签移动、图片标签同步、历史数据补全）

> **状态**：✅ 已完成
>
> **目标**：完善标签层级管理、自动关联、数据完整性校验

---

## 一、为什么改

原系统标签管理存在以下缺陷：

1. **二级标签无法移动**：只能在一级标签下创建/删除二级标签，无法将其升级为一级、或迁移到其他一级标签下。
2. **图片标签关联不同步**：为图片绑定一个二级标签时，不会自动关联其对应的一级标签，导致按一级标签筛选时漏图片。
3. **标签移动后数据不一致**：修改标签层级后，已绑定该标签的图片的关联记录未同步调整。
4. **缺少历史数据检查**：无法识别并修复"图片只绑了二级标签但未绑一级标签"的存量问题。
5. **数据校验不充分**：未检查循环引用、重复标签名称等错误结构。
6. **性能不足**：批量操作使用线性遍历，大量图片场景下卡顿。

---

## 二、改了什么

### 1. 标签移动服务（`lib/services/tag-move-service.ts`）

- **`validateTagMove(tagId, targetParentId)`**
  - 检查标签与目标父标签是否存在
  - 检查循环引用（递归向上查找父标签链）
  - 检查目标父标签下是否存在同名二级标签
  - 通过后返回 `{ ok: true }`，失败返回错误原因

- **`moveTag(tagId, targetParentId)`**
  - 场景 A：`targetParentId = null` → 将二级标签升级为一级标签
    - 先更新 `tags.parentId = null`，`tags.category = tag.name`
    - 对所有绑定了该标签的图片：移除其与原一级标签的关联，保留升级后的一级标签关联
  - 场景 B：`targetParentId = <其他一级标签 id>` → 将二级标签迁移到其他一级下
    - 更新 `tags.parentId` 与 `tags.category`
    - 对所有绑定了该标签的图片：移除旧一级关联 + 添加新一级关联

### 2. 图片标签同步服务（`lib/services/image-tag-sync-service.ts`）

- **`syncImageTagsForImage(imageId, tagIds[])`**
  - 遍历传入的 tagIds；若某 tagId 是二级标签，自动将其 parentId 加入关联集合
  - 批量写入 `images_tags_relation` 时同时写入二级标签和其一级标签
  - 使用 `skipDuplicates: true` 避免重复关联

- **`syncImageTagsAfterTagMove(tagId, oldParentId, newParentId)`**
  - 在 `updateTag` 检测到 `parentId` 变化时调用
  - 对所有绑定了该 tagId 的图片：移除旧一级关联 + 添加新一级关联
  - 使用事务保证一致性；单张图片处理失败不影响其他图片

- **`checkAndFixImageTagCompleteness(options?)`**
  - 分批（默认每批 100 张）遍历所有绑定了标签的图片
  - 对每张图片：查询其所有关联标签 → 检查每个标签是否有父标签 → 若图片未关联父标签则补齐
  - 同时检测"父标签已不存在"的无效关联，自动清理
  - 返回 `{ totalProcessed, fixedCount, orphanRemoved, failed }` 统计信息

### 3. 新增 API 路由（`server/settings.ts`）

- `POST /api/v1/settings/tags/move`
  - 参数：`{ tagId, targetParentId }`
  - 流程：先调用 `validateTagMove`，再调用 `moveTag`，最后返回 `{ ok, movedTag, affectedImageCount }`

- `POST /api/v1/settings/tags/check-completeness`
  - 参数：`{ batchSize? }`
  - 触发 `checkAndFixImageTagCompleteness`，返回处理统计

> 详细请求/响应格式见参考文档，此处不重复。

### 4. 前端组件更新（`components/admin/tags/tag-manager.tsx`）

- 二级标签右侧新增"移动"按钮（之前只有一级标签可移动）
- 移动对话框：
  - 显示移动目标选择（"升级为一级标签" 或 "选择目标一级标签"）
  - 显示受影响的图片数量预估
- 历史数据补全检查入口：
  - 单独的"检查并修复标签完整性"按钮
  - 显示进度条与结果统计（处理数/修复数/移除的无效关联数/失败数）

### 5. 性能优化

- 使用 `Set` / `Map` 做 O(1) 查找，替换线性遍历
- 所有批量数据库操作使用 Prisma 事务
- 对大批量图片分批处理，避免单次请求超时

---

## 三、影响范围

1. **数据库 schema**：无变更（复用 `Tags`、`ImagesTagsRelation` 既有结构）。
2. **数据内容**：可能新增一批"一级标签 ↔ 图片"的关联记录（由自动同步与补全产生）。
3. **后台交互**：标签管理页新增移动按钮与补全检查入口。
4. **前台筛选**：一级标签下的图片数量统计更准确（补齐后一级标签覆盖的图片不再遗漏）。

---

## 四、涉及的代码与脚本

- **类型定义**：`types/tags.ts`
- **标签移动服务**：`lib/services/tag-move-service.ts`
- **图片标签同步服务**：`lib/services/image-tag-sync-service.ts`
- **API 路由**：`server/settings.ts`
- **后台 UI**：`components/admin/tags/tag-manager.tsx`
- **自定义 Hook**：`hooks/useTagManagement.ts`（若有封装）
- **数据校验辅助**：`lib/db/operate/tags.ts`（已有 update/delete 操作接入新验证逻辑）

---

## 五、怎么验证

### 1. 标签移动

- 选一个有图片绑定的二级标签 T（父 P1）
- 将 T 升级为一级标签 → 验证：
  - `tags` 表中 `T.parentId = null`，`T.category = T.name`
  - 所有原先绑定 T 的图片：与 P1 的关联被移除，与 T 的关联保留
- 将 T 迁移到另一父 P2 → 验证：
  - `T.parentId = P2.id`，`T.category = P2.name`
  - 所有原先绑定 T 的图片：与 P1 的关联被移除，与 P2 的关联被新增

### 2. 自动关联

- 为一张图片绑定一个二级标签 T（父 P）
- 保存后查看关联记录：应同时存在 `image↔T` 和 `image↔P` 两条

### 3. 历史数据补全

- 在后台标签管理页点击"检查并修复标签完整性"
- 等待处理完成，查看：
  - `totalProcessed` / `fixedCount` 统计正常
  - 之后再点一次（应 0 需要修复）
  - 手动制造"只绑二级未绑一级"的脏数据，再运行，应能检测并修复

### 4. 数据校验

- 构造同名标签名称 → 应被拦截并提示
- 构造循环引用（A 的父是 B，B 的父是 A）→ 应被拦截

### 5. 性能

- 1000+ 图片的相册：标签移动或补全检查耗时应 < 20s
- 观察服务端日志，无大量单条图片串行查询

---

## 六、怎么回滚

1. **服务层**：
   - 回退 `lib/services/tag-move-service.ts` 与 `lib/services/image-tag-sync-service.ts`
   - 回退 `server/settings.ts` 中新增的 `move` / `check-completeness` 路由
2. **前端**：
   - 回退 `components/admin/tags/tag-manager.tsx` 中的移动/补全入口
3. **数据层面（如需撤销补全结果）**：
   - 不提供自动回滚脚本（因补全操作属于"让数据更正确"的修复）。
   - 如需撤销某次特定补全，可以运行前先备份 `images_tags_relation` 表快照，回滚时从快照恢复。

---

## 七、相关文档链接

- **Tags 模型字段与表结构** → [`reference/data-model.md`](../reference/data-model.md)（2.4 标签与关联章节）
- **标签相关 API 请求/响应参数** → [`reference/api-reference.md`](../reference/api-reference.md)（3.7 settings / tags 小节）
- **后台标签管理页面交互** → [`reference/admin-ui.md`](../reference/admin-ui.md)
- **总变更记录** → [`project-notes/changelog.md`](./changelog.md)

---

*最后更新：2026-06-12*
