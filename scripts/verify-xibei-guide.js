const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const guideId = 'cmo1jz02q0000jf7cytybj1iy'
  
  const guide = await prisma.guides.findUnique({
    where: { id: guideId }
  })
  
  console.log('=== 攻略信息 ===')
  console.log('标题:', guide.title)
  console.log('国家:', guide.country)
  console.log('城市:', guide.city)
  console.log('天数:', guide.days)
  
  const modules = await prisma.guideModules.findMany({
    where: { guide_id: guideId },
    orderBy: { sort: 'asc' }
  })
  
  console.log('\n=== 模块列表 ===')
  for (const mod of modules) {
    console.log(`\n--- ${mod.name} (${mod.template}) ---`)
    
    const moduleData = await prisma.guideModuleContents.findFirst({
      where: { module_id: mod.id, type: 'module_data' }
    })
    
    if (moduleData && moduleData.content) {
      const content = moduleData.content
      if (Array.isArray(content)) {
        console.log(`数据条数: ${content.length}`)
        if (content.length > 0) {
          const firstItem = content[0]
          console.log('第一条数据字段:', Object.keys(firstItem).join(', '))
          console.log('第一条数据:', JSON.stringify(firstItem, null, 2))
        }
      }
    }
  }
  
  console.log('\n✅ 验证完成')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
