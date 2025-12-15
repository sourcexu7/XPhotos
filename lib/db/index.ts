import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

declare const globalThis: {
  prisma: ReturnType<typeof prismaClientSingleton>
} & typeof global

const prisma = globalThis.prisma ?? prismaClientSingleton()

export const db = prisma

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}