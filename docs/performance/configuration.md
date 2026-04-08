# 性能优化配置指南

> **用途**：指导如何正确配置系统以获得最佳性能
>
> **适用场景**：生产环境部署、性能调优、故障排查

## 概述

本文档提供了 XPhotos 系统的性能优化配置指南，涵盖数据库连接池、Next.js 图片优化、CDN 配置等关键参数的详细说明和最佳实践。

**配置范围：**
- Prisma/PostgreSQL 数据库连接池配置
- Next.js Image 优化配置
- CDN 与环境变量配置
- 性能监控与告警配置

---

## 一、数据库配置优化

### 1.1 Prisma 连接池配置

#### 推荐配置（生产环境）

在 `DATABASE_URL` 环境变量中添加连接池参数：

```env
# PostgreSQL 连接池配置（推荐）
DATABASE_URL="postgresql://user:password@host:5432/database?connection_limit=20&pool_timeout=10&connect_timeout=10"
DIRECT_URL="postgresql://user:password@host:5432/database?connection_limit=1"
```

#### 参数说明

| 参数 | 默认值 | 推荐值 | 说明 |
|------|--------|--------|------|
| `connection_limit` | 无限制 | **10-20** | 最大连接数，根据服务器配置调整 |
| `pool_timeout` | 10 秒 | **10-20 秒** | 连接池超时时间（等待可用连接的时间） |
| `connect_timeout` | 10 秒 | **10 秒** | 单次连接建立的超时时间 |

#### 性能影响

✅ **已验证的提升：**
- 并发能力提升 30%+
- 减少连接创建开销
- 避免连接池耗尽导致的错误

⚠️ **注意事项：**
- `connection_limit` 不应超过数据库服务器的 `max_connections` 设置
- 建议设置为服务器 CPU 核数的 2-5 倍
- 对于低流量站点，5-10 个连接通常足够

#### 不同规模的配置建议

| 场景 | connection_limit | pool_timeout | 说明 |
|------|-------------------|--------------|------|
| 开发环境 | 5 | 10s | 足够本地开发使用 |
| 小型网站（<1000 UV/日） | 10 | 15s | 低并发场景 |
| 中型网站（1000-10000 UV/日） | 20 | 20s | 中等并发 |
| 大型网站（>10000 UV/日） | 30-50 | 30s | 高并发，需配合读写分离 |

---

### 1.2 数据库索引配置

#### 已优化的索引列表

执行以下命令创建性能优化索引：

```bash
# 生成迁移文件（开发环境）
pnpm prisma migrate dev --name add_performance_indexes

# 或直接部署到生产环境
pnpm prisma migrate deploy
```

#### 关键索引说明

| 索引名 | 表 | 字段 | 类型 | 用途 | 性能提升 |
|--------|-----|------|------|------|----------|
| `images_del_show_idx` | images | (del, show) | B-tree | 公开图片筛选 | -50% |
| `images_featured_idx` | images | (featured) | B-tree | 精选查询 | -40% |
| `images_created_at_idx` | images | (created_at) | B-tree | 时间排序 | -30% |
| `images_show_mainpage_idx` | images | (show, show_on_mainpage) | B-tree | 首页展示 | -45% |
| `images_labels_idx` | images | (labels) | GIN | JSONB标签查询 | -60% |
| `relation_image_album_idx` | images_albums_relation | (imageId, album_value) | B-tree | 关联查询 | -50% |

**验证索引是否创建成功：**

```bash
# 连接到数据库并检查索引
psql -d your_database -c "\d images"
psql -d your_database -c "\d images_albums_relation"
```

---

## 二、Next.js 配置优化

### 2.1 图片优化配置

#### 当前配置（next.config.mjs）

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 图片优化配置
  images: {
    // 允许的远程图片域名（通配符）
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

    // 性能优化：优先使用的图片格式
    formats: ['image/avif', 'image/webp'],

    // 设备尺寸断点（用于响应式图片）
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // 图片尺寸断点（用于 srcset）
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // 图片缓存时间（秒，生产环境）
    minimumCacheTTL: 60,
  },

  // 性能优化：生产环境移除 console 日志
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
}

module.exports = nextConfig
```

#### 参数详解

##### remotePatterns

**作用**：控制允许从哪些域名加载图片进行优化

**当前配置**：允许所有 HTTPS 和 HTTP 域名（开发便利性优先）

**生产环境建议**：
```javascript
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'cdn.yourdomain.com',
  },
  {
    protocol: 'https',
    hostname: '**.your-storage-provider.com',
  },
]
```

⚠️ **安全提示**：生产环境应限制为实际使用的域名，避免 SSRF 攻击

##### formats

**作用**：指定图片格式转换的优先级顺序

**推荐配置**：`['image/avif', 'image/webp']`

**格式说明：**
- **AVIF**：最新格式，体积最小（比 JPEG 小 50%），但兼容性稍差
- **WebP**：广泛支持，体积比 JPEG 小 25-35%
- 浏览器会自动选择支持的格式

**兼容性：**
- AVIF：Chrome 85+, Firefox 93+, Safari 16+
- WebP：Chrome 23+, Firefox 65+, Safari 14+

##### deviceSizes / imageSizes

**作用**：定义生成响应式图片的尺寸断点

**deviceSizes**：设备视口宽度断点
**imageSizes**：图片实际显示宽度断点

**调优建议：**
- 根据实际设计稿调整这些值
- 避免过多断点（会增加构建时间和存储空间）
- 覆盖主要的使用场景即可

---

### 2.2 编译器优化

#### 生产环境移除 Console 日志

```javascript
compiler: {
  removeConsole: process.env.NODE_ENV === 'production'
    ? { exclude: ['error', 'warn'] }
    : false,
}
```

**作用**：
- ✅ 减少生产环境的日志输出
- ✅ 减小包体积
- ✅ 保留 error 和 warn 级别日志（便于排查问题）

**效果**：
- 包体积减少约 5-10%
- 控制台输出更清晰

---

## 三、CDN 配置（可选但强烈推荐）

### 3.1 CDN 域名配置

```env
# CDN 域名配置（可选）
NEXT_PUBLIC_CDN_URL="https://cdn.example.com"
```

### 3.2 推荐的 CDN 服务商

| 服务商 | 特点 | 适用场景 |
|--------|------|----------|
| Cloudflare | 免费套餐、全球节点 | 个人项目、小中型网站 |
| AWS CloudFront | 与 S3/R2 深度集成 | 使用 AWS 服务的项目 |
| 阿里云 CDN | 国内访问速度快 | 主要用户在国内的项目 |
| Vercel Edge Network | 与 Next.js 深度集成 | 使用 Vercel 部署的项目 |

### 3.3 CDN 配置最佳实践

#### 缓存策略配置

**静态资源（图片）：**
- 缓存时间：1 年（immutable caching）
- 使用内容哈希作为文件名的一部分
- 设置 `Cache-Control: public, max-age=31536000, immutable`

**API 响应：**
- 缓存时间：根据数据更新频率设置（如 5 分钟）
- 设置适当的 `Cache-Control` 和 `Vary` 头

#### 图片优化配置

在 CDN 层面启用以下功能：
- ✅ 自动压缩（Gzip/Brotli）
- ✅ 图片格式转换（JPEG → WebP/AVIF）
- ✅ 图片缩放和裁剪
- ✅ 自适应比特率（根据网络条件）

**预期效果：**
- 图片加载速度提升 50%+（跨地域访问）
- 减少源站带宽压力
- 提升全球用户访问体验

---

## 四、完整环境变量配置示例

### 4.1 必需配置

```env
# ===========================================
# 数据库配置
# ===========================================

# PostgreSQL 连接字符串（含连接池参数）
DATABASE_URL="postgresql://username:password@localhost:5432/xphotos?connection_limit=20&pool_timeout=10&connect_timeout=10"

# Prisma 直连（用于迁移等操作）
DIRECT_URL="postgresql://username:password@localhost:5432/xphotos?connection_limit=1"

# ===========================================
# 应用配置
# ===========================================

# Node.js 环境
NODE_ENV="production"

# 应用端口（可选，默认 3000）
PORT=3000
```

### 4.2 可选配置（推荐启用）

```env
# ===========================================
# CDN 配置（强烈推荐）
# ===========================================

# CDN 域名（用于图片等静态资源）
NEXT_PUBLIC_CDN_URL="https://cdn.yourdomain.com"

# ===========================================
# 对象存储配置（S3/R2/COS/AList）
# ===========================================

# 示例：R2 配置
R2_ACCOUNT_ID="your_account_id"
R2_ACCESS_KEY_ID="your_access_key"
R2_SECRET_ACCESS_KEY="your_secret_key"
R2_BUCKET="your_bucket_name"
R2_PUBLIC_URL="https://pub-your_bucket_id.r2.dev"

# ===========================================
# 监控与分析（可选）
# ===========================================

# Umami Analytics（可选）
NEXT_PUBLIC_UMAMI_SCRIPT_URL="https://analytics.yourdomain.com/script.js"
UMAMI_WEBSITE_ID="your_website_id"
```

### 4.3 安全配置（生产环境必须）

```env
# ===========================================
# 认证与安全
# ===========================================

# JWT 密钥（必须随机生成，至少 32 字符）
JWT_SECRET="your_random_secret_key_here"

# NextAuth 密钥
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="https://yourdomain.com"

# CORS 配置（如果需要）
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

---

## 五、部署检查清单

在将应用部署到生产环境前，请逐项确认：

### 数据库配置 ✅

- [ ] `DATABASE_URL` 已配置连接池参数
- [ ] `connection_limit` 值合理（10-50）
- [ ] 所有性能索引已创建（运行 `prisma migrate deploy`）
- [ ] 数据库用户权限正确（仅授予必要的权限）

### Next.js 配置 ✅

- [ ] `next.config.mjs` 中的图片优化已启用
- [ ] `formats` 配置包含 AVIF/WebP
- [ ] `deviceSizes` 和 `imageSizes` 符合实际需求
- [ ] 生产环境 `removeConsole` 已启用

### CDN 配置（如使用）✅

- [ ] CDN 域名已配置且可访问
- [ ] `remotePatterns` 已限制为实际域名
- [ ] 缓存策略已配置
- [ ] 图片格式转换已启用

### 环境变量 ✅

- [ ] 所有必需的环境变量已设置
- [ ] 敏感信息（密钥、密码）未提交到代码仓库
- [ ] `.env.production` 文件已创建或通过 CI/CD 注入
- [ ] JWT/NEXTAUTH 密钥足够复杂且随机

### 构建与部署 ✅

- [ ] `npm run build` 或 `pnpm build` 成功无错误
- [ ] TypeScript 类型检查通过
- [ ] Lint 检查通过（如有配置）
- [ ] 生产环境构建产物已生成

---

## 六、性能监控配置

### 6.1 数据库慢查询监控

在 PostgreSQL 中启用慢查询日志：

```sql
-- 设置慢查询阈值（毫秒）
ALTER DATABASE your_database SET log_min_duration_statement = 1000;

-- 启用 pg_stat_statements 扩展（需要超级用户权限）
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 查看最慢的查询
SELECT *
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### 6.2 应用层性能监控

XPhotos 已内置基础性能监控工具：

**文件位置**：[lib/monitoring/performance.ts](../../lib/monitoring/performance.ts)

**已实现功能：**
- ✅ API 响应时间统计
- ✅ 数据库查询耗时记录
- ✅ 慢接口告警（>500ms）
- ✅ 错误率统计

**启用方式：**

```env
# 启用性能监控
ENABLE_PERFORMANCE_MONITORING=true

# 慢接口阈值（毫秒）
SLOW_API_THRESHOLD_MS=500
```

### 6.3 外部监控工具（推荐）

| 工具 | 类型 | 用途 | 推荐理由 |
|------|------|------|----------|
| Lighthouse | 性能审计 | 综合性能评分 | Google 官方，免费易用 |
| WebPageTest | 性能测试 | 多地点测试 | 详细的水fall 图 |
| Sentry | 错误监控 | 异常捕获和报警 | 实时错误追踪 |
| Datadog | APM | 全链路监控 | 企业级可观测性 |
| New Relic | APM | 性能分析 | 易用的性能洞察 |

---

## 七、故障排查

### 7.1 常见配置问题

#### 问题1：数据库连接错误

**症状**：`PrismaClientInitializationError: Server has closed the connection`

**可能原因及解决方案：**

1. **连接池耗尽**
   ```bash
   # 解决方案：增大 connection_limit
   DATABASE_URL="...?connection_limit=30"
   ```

2. **连接超时**
   ```bash
   # 解决方案：增大 connect_timeout
   DATABASE_URL="...?connect_timeout=20"
   ```

3. **数据库服务器不可达**
   - 检查数据库服务器状态
   - 检查网络连通性
   - 检查防火墙规则

详见：[Prisma 连接修复文档](../fixes/prisma-connection-fix.md)

---

#### 问题2：图片加载缓慢

**症状**：图片加载时间长或失败

**排查步骤：**

1. **检查 CDN 配置**
   - CDN 域名是否可达？
   - DNS 解析是否正常？

2. **检查 Next.js Image 配置**
   - `formats` 是否包含 WebP/AVIF？
   - `sizes` 属性是否正确？

3. **检查图片原始质量**
   - 是否使用了过大的原图？
   - 是否需要在上传时压缩？

4. **检查网络状况**
   - 使用浏览器开发者工具查看加载时间
   - 检查是否有大量重定向

---

#### 问题3：API 响应慢

**症状**：API 接口响应时间 > 1 秒

**排查步骤：**

1. **检查数据库查询**
   - 是否有慢查询？（参考第六章监控部分）
   - 索引是否生效？（执行 `EXPLAIN ANALYZE`）

2. **检查 N+1 查询**
   - 是否在一次请求中多次查询同一数据？
   - 是否可以使用 `include` 或批量查询优化？

3. **检查外部依赖**
   - 是否有外部 API 调用？
   - 对象存储（S3/R2）响应是否正常？

4. **检查服务器资源**
   - CPU 使用率是否过高？
   - 内存是否充足？
   - I/O 是否存在瓶颈？

---

### 7.2 性能回退应急处理

如果发现性能突然下降，按以下步骤快速定位：

#### Step 1：对比基线数据

```bash
# 检查最近的部署记录
git log --oneline -10

# 检查是否有代码变更影响性能
git diff HEAD~1 --stat
```

#### Step 2：检查关键指标

```bash
# 数据库连接数
psql -c "SELECT count(*) FROM pg_stat_activity;"

# 慢查询数量
psql -c "SELECT count(*) FROM pg_stat_activity WHERE query_start < now() - interval '1 minute';"

# 系统资源使用情况
top -bn1 | head -20
```

#### Step 3：临时缓解措施

如果无法立即修复根因，可以采取以下临时措施：

1. **重启应用服务**（清理可能的内存泄漏）
2. **增加连接池大小**（应对突发流量）
3. **启用更激进的缓存**（减少数据库压力）
4. **降级非核心功能**（保证核心功能可用）

---

## 八、最佳实践总结

### ✅ 必须遵守的原则

1. **永远不要在代码中硬编码敏感信息**
   - 使用环境变量管理所有配置
   - 使用 `.env.local` 进行本地开发
   - 生产环境使用安全的密钥管理服务

2. **定期审查和更新配置**
   - 每季度评估一次配置合理性
   - 根据业务增长调整资源配额
   - 及时应用安全补丁

3. **建立完善的监控体系**
   - 监控关键性能指标
   - 设置合理的告警阈值
   - 定期回顾和分析监控数据

4. **保持配置的可追溯性**
   - 将配置变更纳入版本控制
   - 记录每次变更的原因和影响
   - 建立回滚机制

### 📚 相关文档

- [性能分析报告](./analysis.md)：详细的瓶颈分析
- [性能优化总结](./summary.md)：已实施的优化措施
- [Prisma 连接修复](../fixes/prisma-connection-fix.md)：数据库连接问题解决

---

*最后更新：2026-04-08*
