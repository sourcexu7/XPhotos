import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  client.$on('error' as never, (e: unknown) => {
    console.error('Prisma Client Error:', e)
  })

  return client
}

declare const globalThis: {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
  prismaShutdownListenersAdded: boolean | undefined
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
if (typeof process !== 'undefined' && !globalThis.prismaShutdownListenersAdded) {
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
  
  // 标记监听器已添加，避免重复添加
  globalThis.prismaShutdownListenersAdded = true
}

export const db = prisma

export async function checkDatabaseHealth() {
  try {
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Database health check failed:', error)
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

export async function getConnectionPoolInfo() {
  try {
    const result = await prisma.$queryRaw<Array<{ count: number }>>`
      SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
    `

    const activeConnections = Number(result[0]?.count) || 0

    const dbUrl = process.env.DATABASE_URL || ''
    const connectionLimitMatch = dbUrl.match(/connection_limit=(\d+)/)
    const connectionLimit = connectionLimitMatch ? parseInt(connectionLimitMatch[1], 10) : 13

    return {
      activeConnections,
      connectionLimit,
      utilization: `${Math.round((activeConnections / connectionLimit) * 100)}%`,
      status: activeConnections >= connectionLimit * 0.8 ? 'warning' : 'ok',
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Failed to get connection pool info:', error)
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}