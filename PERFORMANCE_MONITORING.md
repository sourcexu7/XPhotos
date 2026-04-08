# 持续性能监控方案

> **状态**：✅ 已制定
> **目标**：建立完善的性能监控体系，确保系统长期稳定高效运行

## 一、监控范围与指标

### 1. 系统资源监控

| 指标 | 监控频率 | 告警阈值 | 监控工具 |
|------|----------|----------|----------|
| CPU 使用率 | 1分钟 | >80% 持续5分钟 | Windows 任务管理器/监控软件 |
| 内存占用 | 1分钟 | >85% 持续5分钟 | Windows 任务管理器/监控软件 |
| 磁盘 I/O | 5分钟 | 读写速度持续超过90% | Windows 任务管理器/监控软件 |
| 网络吞吐量 | 5分钟 | 带宽使用率>90% 持续10分钟 | Windows 任务管理器/监控软件 |

### 2. 数据库监控

| 指标 | 监控频率 | 告警阈值 | 监控工具 |
|------|----------|----------|----------|
| 慢查询（>1000ms） | 5分钟 | 出现慢查询 | PostgreSQL pg_stat_statements |
| 连接池使用率 | 1分钟 | >80% 持续5分钟 | PostgreSQL pg_stat_activity |
| 索引使用情况 | 1小时 | 全表扫描频繁 | PostgreSQL 执行计划分析 |
| 数据库连接数 | 1分钟 | >连接池上限的80% | PostgreSQL pg_stat_activity |

### 3. 应用层监控

| 指标 | 监控频率 | 告警阈值 | 监控工具 |
|------|----------|----------|----------|
| API 响应时间 | 1分钟 | >500ms 持续5分钟 | 自定义监控中间件 |
| 错误率 | 1分钟 | >5% 持续5分钟 | 自定义监控中间件 |
| 并发请求数 | 1分钟 | >系统承载能力的80% | 自定义监控中间件 |
| 缓存命中率 | 5分钟 | <70% 持续10分钟 | 自定义监控中间件 |

### 4. 前端性能监控

| 指标 | 监控频率 | 告警阈值 | 监控工具 |
|------|----------|----------|----------|
| 页面加载时间 | 10分钟 | >3秒 持续10分钟 | Lighthouse |
| 图片加载性能 | 10分钟 | 图片加载时间>2秒 | 浏览器开发者工具 |
| 交互响应时间 | 10分钟 | >100ms 持续10分钟 | 浏览器性能API |
| 资源使用情况 | 10分钟 | JS heap 大小>1GB | 浏览器开发者工具 |

## 二、监控工具与实现

### 1. 数据库监控

#### PostgreSQL 慢查询监控

```sql
-- 启用慢查询日志
ALTER DATABASE xphotos SET log_min_duration_statement = 1000;

-- 启用 pg_stat_statements 扩展
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 查看最慢的查询
SELECT *
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

#### 连接池监控

```sql
-- 查看当前活跃连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看连接状态分布
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
```

### 2. 应用层监控

#### 自定义监控中间件

创建 `lib/monitoring/performance.ts` 文件：

```typescript
import { NextRequest, NextResponse } from 'next/server';

interface PerformanceData {
  path: string;
  method: string;
  status: number;
  duration: number;
  timestamp: Date;
  error?: string;
}

const performanceData: PerformanceData[] = [];
const MAX_DATA_POINTS = 1000;

// 清理过期数据
function cleanupOldData() {
  if (performanceData.length > MAX_DATA_POINTS) {
    performanceData.splice(0, performanceData.length - MAX_DATA_POINTS);
  }
}

// 性能监控中间件
export async function performanceMiddleware(request: NextRequest) {
  const start = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;

  try {
    const response = await NextResponse.next();
    const end = Date.now();
    const duration = end - start;

    // 记录性能数据
    performanceData.push({
      path,
      method,
      status: response.status,
      duration,
      timestamp: new Date(),
    });

    // 检查是否需要告警
    if (duration > 500) {
      console.warn(`Slow API: ${method} ${path} - ${duration}ms`);
    }

    cleanupOldData();
    return response;
  } catch (error) {
    const end = Date.now();
    const duration = end - start;

    // 记录错误
    performanceData.push({
      path,
      method,
      status: 500,
      duration,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    cleanupOldData();
    throw error;
  }
}

// 获取性能统计数据
export function getPerformanceStats() {
  const now = Date.now();
  const lastHour = now - 60 * 60 * 1000;
  
  const recentData = performanceData.filter(d => d.timestamp.getTime() > lastHour);
  
  if (recentData.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
      slowRequests: 0,
    };
  }
  
  const totalRequests = recentData.length;
  const totalDuration = recentData.reduce((sum, d) => sum + d.duration, 0);
  const errorCount = recentData.filter(d => d.status >= 400).length;
  const slowCount = recentData.filter(d => d.duration > 500).length;
  
  return {
    totalRequests,
    averageResponseTime: totalDuration / totalRequests,
    errorRate: (errorCount / totalRequests) * 100,
    slowRequests: slowCount,
  };
}
```

### 3. 系统资源监控

#### Windows 监控工具

- **任务管理器**：实时监控 CPU、内存、磁盘和网络使用情况
- **性能监视器**：设置详细的性能计数器和告警
- **事件查看器**：监控系统事件和错误

### 4. 前端性能监控

#### Lighthouse 定期审计

创建 `scripts/performance-audit.js`：

```javascript
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

async function runAudit() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices'],
    port: chrome.port,
  };

  try {
    const results = await lighthouse('http://localhost:3001', options);
    const report = results.report;
    
    // 保存报告
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `lighthouse-report-${timestamp}.json`;
    fs.writeFileSync(reportPath, report);
    
    console.log(`Lighthouse audit completed. Report saved to ${reportPath}`);
    
    // 检查性能得分
    const performanceScore = results.lhr.categories.performance.score * 100;
    if (performanceScore < 70) {
      console.warn(`Performance score is low: ${performanceScore}`);
    }
  } finally {
    await chrome.kill();
  }
}

runAudit().catch(console.error);
```

## 三、告警机制

### 1. 告警级别

| 级别 | 描述 | 通知方式 |
|------|------|----------|
| 低 | 性能轻微下降，不影响用户体验 | 日志记录 |
| 中 | 性能明显下降，可能影响部分用户 | 邮件通知 |
| 高 | 性能严重下降，影响大部分用户 | 邮件 + 短信通知 |
| 紧急 | 系统不可用 | 邮件 + 短信 + 电话通知 |

### 2. 告警阈值设置

#### 数据库告警
- **慢查询**：出现执行时间 > 1000ms 的查询
- **连接池**：连接数 > 连接池上限的 80%
- **错误率**：数据库错误率 > 1%

#### 应用告警
- **响应时间**：API 响应时间 > 500ms 持续 5 分钟
- **错误率**：API 错误率 > 5% 持续 5 分钟
- **并发请求**：并发请求数 > 系统承载能力的 80%

#### 系统资源告警
- **CPU**：使用率 > 80% 持续 5 分钟
- **内存**：使用率 > 85% 持续 5 分钟
- **磁盘**：使用率 > 90%
- **网络**：带宽使用率 > 90% 持续 10 分钟

## 四、定期性能评估

### 1. 性能基准建立

- **初始基准**：系统上线前的性能测试结果
- **定期基准**：每月进行一次全面性能测试
- **变更基准**：每次重大代码变更后进行性能测试

### 2. 性能测试计划

| 测试类型 | 频率 | 测试内容 |
|----------|------|----------|
| 负载测试 | 每月 | 模拟 100-500 并发用户 |
| 压力测试 | 每季度 | 测试系统极限承载能力 |
| 稳定性测试 | 每季度 | 72 小时持续负载测试 |
| 回归测试 | 每次代码变更 | 确保性能不下降 |

### 3. 性能分析流程

1. **数据收集**：收集监控数据和测试结果
2. **数据分析**：识别性能瓶颈和异常
3. **问题定位**：确定性能问题的根本原因
4. **优化方案**：制定并实施优化措施
5. **效果验证**：测试优化效果
6. **文档更新**：更新性能监控方案和基准数据

## 五、优化建议回顾

### 已实施的优化

1. **SQL 查询优化**：
   - 优化 COALESCE 函数使用，避免索引失效
   - 使用原生 SQL 批量更新，减少数据库交互次数
   - 为常用查询添加 React.cache 缓存

2. **索引优化**：
   - 已添加关键索引，包括 `images(del, show)`、`images(featured)`、`images(created_at)` 等
   - 为 JSONB 字段 `labels` 添加 GIN 索引

3. **缓存策略**：
   - 配置查询缓存（CONFIG_CACHE）
   - 并发去重（INFLIGHT_QUERIES）
   - React.cache 缓存常用查询结果

4. **并发处理**：
   - Prisma 客户端单例模式
   - 事务优化

### 待实施的优化

1. **图片优化**：
   - 实现图片上传时自动生成多尺寸缩略图
   - 启用图片自动压缩（Sharp）
   - 配置 CDN 加速图片分发

2. **分页优化**：
   - 实现游标分页替代 OFFSET 分页

3. **前端优化**：
   - 实现虚拟列表渲染（react-window）
   - 实现图片预加载策略
   - 启用 Service Worker 缓存

4. **API 优化**：
   - 启用 API 响应压缩
   - 实现 GraphQL 减少数据传输

## 六、监控实施计划

### 第一阶段（1周内）

1. **部署监控工具**：
   - 配置 PostgreSQL 慢查询日志
   - 部署应用层监控中间件
   - 设置系统资源监控

2. **建立基准数据**：
   - 执行初始性能测试
   - 记录基准性能指标
   - 建立性能监控 dashboard

### 第二阶段（2周内）

1. **优化监控策略**：
   - 根据实际情况调整告警阈值
   - 优化监控频率
   - 完善监控报告

2. **实施待优化项**：
   - 实现图片压缩和多尺寸生成
   - 配置 CDN
   - 实现游标分页

### 第三阶段（持续）

1. **定期性能评估**：
   - 每月进行负载测试
   - 每季度进行压力测试
   - 每次代码变更后进行回归测试

2. **持续优化**：
   - 根据监控数据识别新的性能瓶颈
   - 实施针对性优化
   - 更新性能监控方案

## 七、总结

通过建立完善的持续性能监控体系，我们可以：

1. **及时发现性能问题**：通过实时监控和告警机制，及时发现并解决性能瓶颈
2. **优化系统性能**：基于监控数据和测试结果，持续优化系统性能
3. **确保系统稳定性**：通过定期性能评估，确保系统长期稳定高效运行
4. **提升用户体验**：通过优化性能，提升用户体验和系统响应速度

持续性能监控是一个长期的过程，需要不断调整和优化监控策略，以适应系统的变化和业务的增长。

---

*最后更新：2026-04-08*
