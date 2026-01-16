import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    // 性能优化：生产环境关闭日志，减少 I/O 开销
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // 性能优化：连接池配置，适配 Node.js >=20 高并发场景
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
  
  // 添加连接错误处理
  client.$on('error' as never, (e: unknown) => {
    console.error('Prisma Client Error:', e)
  })
  
  return client
}

declare const globalThis: {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
} & typeof global

const prisma = globalThis.prisma ?? prismaClientSingleton()

// 在开发和生产环境中都复用 Prisma 客户端实例，避免连接池耗尽
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
} else {
  // 生产环境也复用
  globalThis.prisma = prisma
}

// 优雅关闭连接
if (typeof process !== 'undefined') {
  const gracefulShutdown = async () => {
    try {
      await prisma.$disconnect()
    } catch (error) {
      console.error('Error disconnecting Prisma:', error)
    }
  }
  
  process.on('beforeExit', gracefulShutdown)
  process.on('SIGINT', async () => {
    await gracefulShutdown()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await gracefulShutdown()
    process.exit(0)
  })
}

export const db = prisma