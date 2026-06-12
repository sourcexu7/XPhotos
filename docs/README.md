# XPhotos 文档中心

> 项目文档被重新组织为四个主目录，按「开发参考 → 架构 → 运维 → 变更记录」的阅读路径编排。

---

## 一、你想做什么？→ 从这里开始

| 场景 | 建议先读 |
| --- | --- |
| 刚加入项目，想快速了解系统全貌 | `architecture/system-architecture.md` |
| 开发新功能，需要查阅接口 / 表字段 | `reference/api-reference.md` + `reference/data-model.md` |
| 修改后台页面（上传 / 列表 / 相册 / 设置） | `reference/admin-ui.md` |
| 修改前台页面（首页 / 封面 / 预览 / 主题相册） | `reference/frontend-ui.md` |
| 做性能优化 / 调参 / 索引 | `operations/performance-playbook.md` |
| 部署上线 / 故障排查 | `operations/deployment-troubleshooting.md` |
| 想了解某项功能「为什么这样设计、怎么验证、怎么回滚」 | `project-notes/` 下对应的变更记录文档 |
| 想浏览过往版本的功能迭代 | `project-notes/changelog.md` |
| 想了解前台视觉对标与改造计划 | `architecture/samalive-migration-strategy.md` |

---

## 二、目录结构

```
docs/
├── README.md                          # 本文档（索引页）
├── reference/                         # 开发日常查（权威参考）
│   ├── api-reference.md               # API 接口总览（合并原 api/ 下 11 份文档）
│   ├── data-model.md                  # 数据模型总览（合并原 data/prisma-models.md）
│   ├── admin-ui.md                    # 后台 UI 参考（合并原 ui/admin.md + guides/admin-ui-optimization.md 的页面说明）
│   └── frontend-ui.md                 # 前台 UI 参考（合并原 ui/frontend.md）
├── architecture/                      # 架构与迁移策略
│   ├── system-architecture.md         # 项目地图：目录结构 / 分层 / 鉴权 / 数据模型 / 路由 / 管线
│   └── samalive-migration-strategy.md # 合并 SamAlive 两份文档的对标与改造路线图
├── operations/                        # 运维与性能
│   ├── performance-playbook.md        # 性能与优化操作手册（合并 performance/analysis/summary/configuration）
│   └── deployment-troubleshooting.md  # 部署与故障排查手册（合并 fixes/prisma-connection-fix.md + 配置段）
└── project-notes/                     # 变更记录（为什么改、改了什么、怎么验证、怎么回滚）
    ├── changelog.md                   # 按时间倒序的总变更记录
    ├── admin-ui-optimization.md       # 变更记录：后台 UI 优化
    ├── image-sorting-refactor.md      # 变更记录：图片排序功能重构
    └── tag-management-refactor.md     # 变更记录：标签管理功能重构
```

### 命名约定

- `reference/`：名词性文档，表达「查什么」——api-reference / data-model / admin-ui / frontend-ui
- `architecture/`：名词性文档，表达「系统长什么样」——system-architecture / samalive-migration-strategy
- `operations/`：操作手册，表达「运维与性能怎么做」——performance-playbook / deployment-troubleshooting
- `project-notes/`：名词性文档，表达「变更过程与历史」——changelog / xxx-refactor

### 文档之间的信息唯一原则

- **API 参数、路由前缀、错误码** — 唯一来源：`reference/api-reference.md`
- **表名、字段、索引、关系** — 唯一来源：`reference/data-model.md`（最终权威仍为 `prisma/schema.prisma`）
- **前后台页面交互、按钮触发的 API、组件职责** — 唯一来源：`reference/admin-ui.md` / `reference/frontend-ui.md`
- **连接池参数、环境变量、部署步骤、故障排查路径** — 唯一来源：`operations/deployment-troubleshooting.md`
- **已实施的优化项、性能瓶颈、后续优化方向** — 唯一来源：`operations/performance-playbook.md`
- **为什么这样设计、变更原因、验证/回滚流程** — 唯一来源：`project-notes/*.md`

> 如果你在两份文档中发现对同一事实给出了不同描述，请以「`reference/` > `operations/` > `project-notes/` > `architecture/`」的优先级为准，并提出 PR 修正低优先级文档。

---

## 三、本次重构说明（2026-06）

原有 `docs/` 目录存在 10+ 个分散的子目录与约 25 份独立 Markdown，信息重复严重（同一接口在 3 份文档里各自写一遍、同一性能优化建议在 3 份文档里各自写一遍、同一 Prisma 模型字段在 4 份文档里各自列一遍）。

本次重构：

- 合并 `api/` 下的 11 份分散文档为单份 `reference/api-reference.md`
- 合并 `ui/` 下两份文档为 `reference/admin-ui.md` 与 `reference/frontend-ui.md`，并剥离其重复的 API 参数说明
- 合并 `data/prisma-models.md` 与各 guides 中的模型改造段为单份 `reference/data-model.md`
- 合并 `performance/analysis.md` + `performance/summary.md` + `performance/configuration.md` 为单份 `operations/performance-playbook.md`
- 合并 `fixes/prisma-connection-fix.md` + 各配置文档的部署/排查段为单份 `operations/deployment-troubleshooting.md`
- 合并 `SamAlive-Analysis-and-Migration-Strategy.md` + `SamAlive-UI-Design-Report.md` 为单份 `architecture/samalive-migration-strategy.md`
- `guides/` 下的三份 refactor 文档重命名为「变更记录：xxx」，剥离与 reference 文档重复的内容，迁移到 `project-notes/`，只保留「为什么改、改了什么、怎么验证、怎么回滚」的变更叙事
- 新增 `architecture/system-architecture.md` 作为项目地图入口
- 新增 `project-notes/changelog.md` 作为总变更日志

重构后，docs/ 下保留 **4 个子目录 + 13 份 Markdown**（含本 README），信息唯一、跳转清晰、维护成本显著降低。

---

## 四、维护规范

- 新增或修改 API：只更新 `reference/api-reference.md`，在对应的 UI 文档里补一行「见 api-reference.md 第 x.y 节」的引用即可
- 新增或修改数据库字段：先在 `reference/data-model.md` 登记，然后在 `project-notes/changelog.md` 追加一条变更记录
- 重大功能上线：在 `project-notes/` 新增一份 `xxx-refactor.md` 记录变更的「为什么改 / 改了什么 / 怎么验证 / 怎么回滚」，不要把参数细节重复写在 reference 文档里
- 部署/运维相关的调整：只更新 `operations/deployment-troubleshooting.md` 与 `operations/performance-playbook.md`
- 所有文档使用 Markdown；代码示例标注文件路径和行号；中英文术语与项目实际代码一致

---

## 五、快速参考卡

| 目标 | 文件 |
| --- | --- |
| 找某条 API | `reference/api-reference.md` |
| 找某个字段在哪个表里 | `reference/data-model.md` |
| 后台某个按钮调了哪个接口 | `reference/admin-ui.md` |
| 前台某个页面的数据来源 | `reference/frontend-ui.md` |
| 数据库连接池多大合适 | `operations/deployment-troubleshooting.md` 第 3.2 节 |
| 哪些索引已建立 / 尚未建立 | `operations/performance-playbook.md` 第 5 节快速参考卡 |
| 图片排序功能怎么验证、怎么回滚 | `project-notes/image-sorting-refactor.md` |
| 标签移动功能的合法性校验规则 | `project-notes/tag-management-refactor.md` |
| 项目整体分层与目录职责 | `architecture/system-architecture.md` |
| SamAlive 对标改造路线图 | `architecture/samalive-migration-strategy.md` |
| 所有变更时间线 | `project-notes/changelog.md` |
