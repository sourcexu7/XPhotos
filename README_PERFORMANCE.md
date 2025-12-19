# XPhotos 性能优化指南

## 快速开始

### 1. 配置环境变量

在 `.env.local` 中添加：

```env
# 数据库连接池配置
DATABASE_URL="postgresql://user:password@host:5432/database?connection_limit=20&pool_timeout=10"
DIRECT_URL="postgresql://user:password@host:5432/database?connection_limit=1"
```

### 3. 创建数据库索引

```bash
# 生成迁移文件
pnpm prisma migrate dev --name add_performance_indexes

# 或直接执行 SQL
psql -d your_database -f prisma/migrations/add_performance_indexes.sql
```

### 4. 验证优化效果

```bash
# 启动开发服务器
pnpm dev

# 检查性能指标
# - 数据库查询时间
# - 图片加载速度
# - 筛选响应时间
```

## 性能优化详情

### 数据库查询优化

- ✅ 消除 SELECT * 全字段查询
- ✅ 添加联合索引和 GIN 索引
- ✅ 使用 React.cache 缓存服务端查询结果
- ✅ 优化批量操作

**预期提升：** 查询时间减少 50-70%

### 图片加载优化

- ✅ 使用 Next.js Image 组件
- ✅ 支持 WebP/AVIF 格式
- ✅ 启用懒加载和尺寸优化
- ✅ 配置响应式 sizes

**预期提升：** 图片体积减少 50-70%，加载速度提升 30-50%

### 筛选逻辑优化

- ✅ 筛选条件防抖（300ms）
- ✅ 优化查询逻辑
- ✅ 优化查询逻辑

**预期提升：** 筛选响应时间减少 60-80%，请求次数减少 70%+（通过防抖）

## 文档

- [性能瓶颈分析](./docs/PERFORMANCE_OPTIMIZATION_ANALYSIS.md)
- [配置文件说明](./docs/PERFORMANCE_OPTIMIZATION_CONFIG.md)
- [优化总结](./docs/PERFORMANCE_OPTIMIZATION_SUMMARY.md)

## 故障排查

### 数据库索引未创建

执行迁移命令创建索引：

```bash
pnpm prisma migrate deploy
```

### 图片加载慢

检查：
1. CDN 配置是否正确
2. 图片格式是否支持 WebP/AVIF
3. `sizes` 属性是否配置正确

## 性能监控

使用浏览器开发者工具监控性能：
- Network 面板：查看数据库查询和图片加载时间
- Performance 面板：分析首屏渲染时间
- Lighthouse：综合性能评分

## 后续优化方向

- [ ] 图片上传时自动生成多尺寸缩略图
- [ ] 实现服务端查询结果缓存优化
- [ ] 实现读写分离（主从复制）
- [ ] 实现虚拟列表（react-window）

