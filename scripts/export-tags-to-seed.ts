import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 读取当前所有标签及层级
  const tags = await prisma.tags.findMany({ orderBy: [{ parentId: 'asc' }, { name: 'asc' }] })
  // 构建 seed 结构
  const seedTags = tags.map(tag => ({
    name: tag.name,
    category: tag.category,
    detail: tag.detail,
    parentId: tag.parentId,
  }))
  // 输出为 JSON 文件
  const fs = await import('fs')
  fs.writeFileSync('prisma/exported-tags.json', JSON.stringify(seedTags, null, 2), 'utf-8')
  console.log('标签已导出到 prisma/exported-tags.json')
}

main().finally(async () => {
  await prisma.$disconnect()
})
