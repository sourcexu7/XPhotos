const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:756357wx.@1.15.172.217:5432/xphotos?schema=public&client_encoding=utf8'
    },
  },
})

async function main() {
  const contents = await prisma.guideModuleContents.findMany({
    where: { type: 'module_data' },
    include: {
      module: {
        select: {
          id: true,
          name: true,
          template: true,
        }
      }
    }
  })
  
  for (const content of contents) {
    console.log('=== Module:', content.module.name, '(' + content.module.template + ') ===')
    console.log('Content type:', typeof content.content)
    console.log('Content preview:', JSON.stringify(content.content, null, 2).substring(0, 300))
    console.log('')
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(console.error)
