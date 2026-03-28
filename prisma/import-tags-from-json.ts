import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const fs = require('fs')

async function main() {
  const tags = JSON.parse(fs.readFileSync('prisma/exported-tags.json', 'utf-8'))
  // 先 upsert 一级分类（无 parentId）
  const parentMap: Record<string, string> = {}
  for (const tag of tags.filter((t: any) => !t.parentId)) {
    const parent = await prisma.tags.upsert({
      where: { name: tag.name },
      update: {},
      create: { name: tag.name, category: tag.category, detail: tag.detail || '' },
    })
    parentMap[tag.name] = parent.id
  }
  // 再 upsert 二级及以下分类（有 parentId）
  for (const tag of tags.filter((t: any) => t.parentId)) {
    await prisma.tags.upsert({
      where: { name: tag.name },
      update: {},
      create: {
        name: tag.name,
        category: tag.category,
        detail: tag.detail || '',
        parentId: tag.parentId,
      },
    })
  }
  console.log('标签已导入')
}

main().finally(async () => {
  await prisma.$disconnect()
})
