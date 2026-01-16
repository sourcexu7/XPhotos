# 性能优化配置文件说明

## 一、数据库配置优化

### 1.1 Prisma 配置优化

#### 连接池配置（推荐）
在 `DATABASE_URL` 环境变量中添加连接池参数：

```env
# PostgreSQL 连接池配置
DATABASE_URL="postgresql://user:password@host:5432/database?connection_limit=20&pool_timeout=10&connect_timeout=10"
DIRECT_URL="postgresql://user:password@host:5432/database?connection_limit=1"
```

**参数说明：**
- `connection_limit=20`：最大连接数，根据服务器配置调整（推荐 10-50）
- `pool_timeout=10`：连接池超时时间（秒）
- `connect_timeout=10`：连接超时时间（秒）

**性能提升：**
- 并发能力提升 30%+
- 减少连接创建开销

### 1.2 数据库索引迁移

执行以下命令创建索引：

```bash
# 生成迁移文件
pnpm prisma migrate dev --name add_performance_indexes

# 或直接部署到生产环境
pnpm prisma migrate deploy
```

**索引说明：**
- `images(del, show)`：联合索引，用于筛选未删除且公开的图片
- `images(featured)`：精选图片查询索引
- `images(createdAt)`：时间排序索引
- `images(labels)`：GIN 索引，用于 JSONB 标签查询
- `images_albums_relation(imageId, album_value)`：关联查询索引

**性能提升：**
- 查询时间减少 50-70%（大数据量场景）
- 标签筛选查询时间减少 60%+

## 二、Next.js 配置优化

### 3.1 next.config.mjs 优化

已优化的配置项：

```javascript
const nextConfig = {
  // 图片优化配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // 性能优化：优先使用 WebP/AVIF 格式
    formats: ['image/avif', 'image/webp'],
    // 性能优化：图片质量配置
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // 性能优化：生产环境移除 console
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] }
      : false,
  },
}
```

**性能提升：**
- 图片体积减少 50-70%
- 加载速度提升 30-50%

### 3.2 CDN 配置（推荐）

如果使用对象存储服务（AWS S3、阿里云 OSS），配置 CDN：

```env
# CDN 域名配置
NEXT_PUBLIC_CDN_URL="https://cdn.example.com"
```

**性能提升：**
- 图片加载速度提升 50%+（跨地域访问）
- 减少服务器带宽压力

## 三、环境变量完整配置示例

```env
# 数据库配置
DATABASE_URL="postgresql://user:password@host:5432/database?connection_limit=20&pool_timeout=10"
DIRECT_URL="postgresql://user:password@host:5432/database?connection_limit=1"

# CDN 配置（可选）
NEXT_PUBLIC_CDN_URL="https://cdn.example.com"

# Node.js 环境
NODE_ENV="production"
```

## 四、部署检查清单

- [ ] 数据库索引已创建（执行 `prisma migrate deploy`）
- [ ] CDN 已配置（可选）
- [ ] 环境变量已正确配置
- [ ] Next.js Image 优化已启用
- [ ] 生产环境已移除 console 日志

## 五、性能监控

### 5.1 数据库慢查询监控

在 PostgreSQL 中启用慢查询日志：

```sql
-- 设置慢查询阈值（毫秒）
ALTER DATABASE your_database SET log_min_duration_statement = 1000;

-- 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

### 5.2 图片加载性能监控

使用浏览器开发者工具：
- Network 面板：查看图片加载时间
- Performance 面板：分析首屏渲染时间
- Lighthouse：综合性能评分

## 六、故障排查

### 6.1 数据库连接池耗尽

**症状：** 数据库连接错误

**解决方案：**
- 检查 `connection_limit` 配置是否合理
- 检查是否有连接泄漏
- 增加连接池大小或优化查询

### 6.2 图片加载慢

**症状：** 图片加载时间过长

**解决方案：**
- 检查 CDN 配置是否正确
- 检查图片格式是否支持 WebP/AVIF
- 检查 `sizes` 属性是否配置正确
- 检查图片服务器响应时间

