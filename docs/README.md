# XPhotos 项目文档中心

> 本文档中心提供 XPhotos 项目的完整技术文档，包括 API 接口、UI 功能、数据模型及各类实施指南。

## 📚 文档导航

### 接口文档（API Reference）

详细的接口定义、请求参数和响应格式。

- [API 总览与约定](api/README.md) - 基础前缀、鉴权机制、响应规范
- [认证接口](api/v1-auth.md) - 登录、注册、Token 管理
- [设置接口](api/v1-settings.md) - 系统配置、标签管理
- [文件接口](api/v1-file.md) - 文件上传、预签名 URL
- [图片接口](api/v1-images.md) - 图片 CRUD、排序、筛选
- [相册接口](api/v1-albums.md) - 相册管理、封面设置
- [存储接口](api/v1-storage.md) - AList/S3/R2/COS 配置
- [统计接口](api/v1-analytics.md) - 数据统计与分析
- [公开接口](api/public.md) - 前台展示相关接口

### UI 功能文档（UI Reference）

按钮级交互说明，覆盖前后台所有页面功能。

- [前台 UI 文档](ui/frontend.md) - 首页、相册、预览等公开页面
- [后台 UI 文档](ui/admin.md) - 管理后台所有页面与操作

### 数据模型（Data Models）

数据库表结构与字段说明。

- [Prisma 模型摘要](data/prisma-models.md) - Images、Albums、Tags 等核心模型

### 实施指南（Implementation Guides）

功能重构、优化改进的实施记录与技术细节。

#### 🎨 UI/UX 优化

- [后台 UI 优化](guides/admin-ui-optimization.md)
  - 统一页面结构与视觉语言
  - 导航修复与用户体验提升
  - 国际化与可访问性增强

#### ⚡ 功能重构

- [图片排序功能](guides/image-sorting-refactor.md)
  - 相册级独立排序实现
  - 数据库模型改造
  - 前后台排序管理界面

- [标签管理重构](guides/tag-management-refactor.md)
  - 二级标签移动功能
  - 图片标签自动关联
  - 历史数据补全检查

#### 🔧 Bug 修复

- [Prisma 连接错误修复](fixes/prisma-connection-fix.md)
  - 连接池耗尽问题解决
  - 服务端查询容错处理

### 性能优化（Performance Optimization）

系统性能分析与优化实施记录。

- [性能分析报告](performance/analysis.md)
  - 数据库查询瓶颈分析
  - 图片加载速度问题
  - 筛选条件性能瓶颈

- [优化实施总结](performance/summary.md)
  - 已完成的优化项
  - 性能提升数据
  - 配置调整说明

- [配置指南](performance/configuration.md)
  - 数据库连接池配置
  - Next.js 图片优化配置
  - CDN 与环境变量配置

---

## 📂 目录结构

```
docs/
├── README.md                      # 本文档
├── api/                           # API 接口文档
│   ├── README.md                  # API 总览
│   ├── v1-auth.md                 # 认证接口
│   ├── v1-settings.md             # 设置接口
│   ├── v1-file.md                 # 文件接口
│   ├── v1-images.md               # 图片接口
│   ├── v1-albums.md               # 相册接口
│   ├── v1-storage.md              # 存储接口
│   ├── v1-analytics.md            # 统计接口
│   └── public.md                  # 公开接口
├── ui/                            # UI 功能文档
│   ├── frontend.md                # 前台 UI
│   └── admin.md                   # 后台 UI
├── data/                          # 数据模型
│   └── prisma-models.md           # Prisma 模型
├── guides/                        # 实施指南
│   ├── admin-ui-optimization.md   # UI 优化
│   ├── image-sorting-refactor.md  # 排序重构
│   └── tag-management-refactor.md # 标签重构
├── fixes/                         # Bug 修复记录
│   └── prisma-connection-fix.md   # 连接修复
└── performance/                   # 性能优化
    ├── analysis.md                # 分析报告
    ├── summary.md                 # 优化总结
    └── configuration.md           # 配置指南
```

## 🔄 更新日志

### 2026-04-08

- ✅ 重新组织文档结构，按类型分文件夹管理
- ✅ 统一命名规范，使用清晰的英文命名
- ✅ 更新所有文档内容，确保与代码同步
- ✅ 添加本文档作为导航入口

## 💡 使用建议

1. **开发新功能前**：先阅读相关的 API 和 UI 文档
2. **排查问题时**：查看 `fixes/` 目录下的修复记录
3. **性能调优时**：参考 `performance/` 目录下的分析和配置文档
4. **了解架构演进**：查看 `guides/` 目录下的实施指南

## 📝 维护规范

- 所有文档使用 Markdown 格式
- 代码示例标注文件路径和行号范围
- 重要变更需更新本文档的更新日志
- 保持中英文术语一致性
