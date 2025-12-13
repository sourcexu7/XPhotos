import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start migrating categories -> parentId')
  // 1. find distinct non-empty categories
  const categories = await prisma.$queryRaw<Array<{ category: string }>>`SELECT DISTINCT category FROM tags WHERE category IS NOT NULL AND category <> ''`
  const mapping: Record<string, string> = {}
  for (const row of categories) {
    const cat = row['category'] as string
    // upsert parent tag
    const p = await prisma.tags.upsert({ where: { name: cat }, update: {}, create: { name: cat, category: '' } })
    mapping[cat] = p.id
    console.log(`Created/ensured parent ${cat} -> ${p.id}`)
  }

  // 2. update tags having category set, set parentId accordingly (skip when tag.name === category)
  for (const cat of Object.keys(mapping)) {
    const parentId = mapping[cat]
    const updated = await prisma.$executeRaw`UPDATE tags SET parentId = ${parentId} WHERE category = ${cat} AND name <> ${cat}`
    console.log(`Updated ${String(updated)} rows for category ${cat}`)
  }

  console.log('Migration completed.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
