# Prisma 连接错误修复说明

## 问题描述

在 Next.js 15 应用中，出现了 `PrismaClientInitializationError: Server has closed the connection` 错误。这个错误通常发生在：

1. **服务器组件中调用数据库查询时**：`generateMetadata` 函数在服务器端执行，但 Prisma 客户端可能还没有完全初始化
2. **连接池耗尽**：多个请求同时创建新的 Prisma 客户端实例，导致连接池耗尽
3. **连接超时**：数据库连接在长时间不活跃后被服务器关闭

## 解决方案

### 1. 改进 Prisma 客户端初始化 (`lib/db/index.ts`)

**关键改进：**
- ✅ 确保在开发和生产环境中都复用 Prisma 客户端实例
- ✅ 添加连接错误处理
- ✅ 添加优雅关闭逻辑，确保连接正确释放

```typescript
// 在开发和生产环境中都复用 Prisma 客户端实例
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
} else {
  // 生产环境也复用，避免连接池耗尽
  globalThis.prisma = prisma
}
```

### 2. 改进数据库查询错误处理 (`lib/db/query/configs.ts`)

**关键改进：**
- ✅ 在查询前确保数据库连接正常
- ✅ 添加连接错误检测和缓存清理
- ✅ 返回空数组而不是抛出错误，避免阻塞应用

```typescript
try {
  // 确保数据库连接正常
  await db.$connect().catch(() => {
    // 如果连接已存在，忽略错误
  })
  
  const data = await db.configs.findMany({...})
  // ...
} catch (error) {
  // 如果是连接错误，清理缓存，下次重试
  if (error instanceof Error && error.message.includes('connection')) {
    CONFIG_CACHE.delete(cacheKey)
  }
  return []
}
```

### 3. 改进 `generateMetadata` 错误处理 (`app/layout.tsx`)

**关键改进：**
- ✅ 添加 try-catch 错误处理
- ✅ 使用默认值继续执行，避免阻塞页面渲染
- ✅ 记录错误日志，便于排查问题

```typescript
export async function generateMetadata(): Promise<Metadata> {
  let data: ConfigItem[] = []
  
  try {
    data = await fetchConfigsByKeys(['custom_title', 'custom_favicon_url'])
  } catch (error) {
    console.error('Failed to fetch configs in generateMetadata:', error)
    // 使用默认值继续执行，避免阻塞页面渲染
  }

  return {
    title: getConfigValue(data, 'custom_title', DEFAULT_TITLE),
    // ...
  }
}
```

## 最佳实践

### 1. Prisma 客户端单例模式

在 Next.js 应用中，应该始终使用单例模式创建 Prisma 客户端：

```typescript
const prisma = globalThis.prisma ?? prismaClientSingleton()
```

这样可以确保：
- 避免连接池耗尽
- 提高性能（复用连接）
- 减少数据库连接数

### 2. 错误处理策略

在服务器组件中调用数据库查询时，应该：

1. **添加 try-catch**：捕获可能的连接错误
2. **提供默认值**：确保应用可以继续运行
3. **记录错误日志**：便于排查问题
4. **清理缓存**：连接错误时清理相关缓存

### 3. 连接池配置

如果仍然遇到连接问题，可以在 `DATABASE_URL` 中添加连接池参数：

```
DATABASE_URL="postgresql://user:password@host:5432/db?connection_limit=10&pool_timeout=20"
```

参数说明：
- `connection_limit`: 最大连接数（默认：无限制）
- `pool_timeout`: 连接池超时时间（秒）

## 验证修复

修复后，应该：

1. ✅ 不再出现 `PrismaClientInitializationError` 错误
2. ✅ 页面可以正常加载，即使数据库查询失败也会使用默认值
3. ✅ 控制台不再有连接错误日志（除非确实有数据库问题）

## 相关文件

- `lib/db/index.ts` - Prisma 客户端初始化
- `lib/db/query/configs.ts` - 配置查询函数
- `app/layout.tsx` - 根布局组件

## 注意事项

1. **开发环境**：如果使用热重载，可能需要重启开发服务器才能应用更改
2. **生产环境**：确保数据库连接配置正确，包括连接池大小和超时设置
3. **监控**：建议添加数据库连接监控，及时发现连接问题

