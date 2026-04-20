const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:756357wx.@1.15.172.217:5432/xphotos?schema=public&client_encoding=utf8'
    },
  },
})

async function main() {
  const guides = await prisma.guides.findMany({
    where: { del: 0 },
    include: {
      modules: {
        include: {
          contents: true
        }
      }
    }
  })
  
  console.log('=== 攻略列表 ===')
  for (const guide of guides) {
    console.log('ID:', guide.id)
    console.log('标题:', guide.title)
    console.log('国家:', guide.country)
    console.log('城市:', guide.city)
    console.log('天数:', guide.days)
    console.log('模块数量:', guide.modules.length)
    
    for (const mod of guide.modules) {
      console.log('  - 模块:', mod.name, '(' + mod.template + ')')
      console.log('    内容数量:', mod.contents.length)
      if (mod.contents.length > 0) {
        const firstContent = mod.contents[0]
        console.log('    内容类型:', firstContent.type)
        console.log('    内容预览:', JSON.stringify(firstContent.content).substring(0, 100) + '...')
      }
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(console.error)
