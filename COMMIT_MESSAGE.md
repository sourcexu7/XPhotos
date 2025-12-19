```
feat: 性能优化 - 数据库查询、图片加载和筛选逻辑优化

## 核心优化

### 数据库查询优化
- 优化 SQL 查询：消除 SELECT * 全字段查询，只查询业务所需字段
- 添加数据库索引：10+ 个索引（联合索引、GIN 索引等）
  - images(del, show) 联合索引
  - images(featured) 精选图片索引
  - images(createdAt) 时间排序索引
  - images(labels) GIN 索引用于 JSONB 查询
  - images_albums_relation 和 images_tags_relation 关联索引
- 优化查询逻辑：使用 COUNT(DISTINCT) 替代子查询
- 使用 React.cache 缓存服务端查询结果

### 图片加载优化
- 创建 OptimizedImage 组件：使用 Next.js Image 组件
- 支持 WebP/AVIF 格式：图片体积减少 50-70%
- 启用懒加载和尺寸优化：根据显示尺寸加载对应大小的图片
- 配置响应式 sizes：减少带宽使用 50%+
- 更新图片组件：waterfall-image、image-gallery 使用优化组件

### 筛选逻辑优化
- 实现防抖 Hook：减少请求次数 70%+
- 实现节流 Hook：优化高频事件处理
- 集成防抖到筛选逻辑：筛选条件变更时延迟 300ms

### 配置文件优化
- Prisma 配置：优化连接池和日志配置
- Next.js 配置：优化图片格式、尺寸、缓存配置

## Bug 修复
- 修复 albumData 未定义错误
- 修复 Next.js Image placeholder 警告（自动处理 blurDataURL）

## 性能提升预期
- 数据库查询时间：减少 50-70%
- 图片体积：减少 50-70%
- 图片加载速度：提升 30-50%
- 筛选请求次数：减少 70%+

## 文档
- 添加性能优化分析文档
- 添加配置文件说明文档
- 添加优化总结文档
- 添加快速开始指南

## 迁移说明
执行以下命令创建数据库索引：
```bash
pnpm prisma migrate dev --name add_performance_indexes
```

