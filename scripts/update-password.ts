import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const newPassword = process.argv[3]

  if (!email || !newPassword) {
    console.log('Usage: npx tsx scripts/update-password.ts <email> <new_password>')
    console.log('Example: npx tsx scripts/update-password.ts admin@example.com 123456')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true }
  })

  if (!user) {
    console.error(`User with email ${email} not found.`)
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // 更新所有关联的 credential 账户密码
  let updatedCount = 0
  for (const acc of user.accounts) {
    if (acc.providerId === 'credential') { // 或者根据实际情况判断
      await prisma.account.update({
        where: { id: acc.id },
        data: { password: hashedPassword }
      })
      updatedCount++
    }
  }

  if (updatedCount === 0) {
     // 如果没有找到 credential 账户，可能需要创建一个
     console.log('No credential account found. Creating one...')
     await prisma.account.create({
       data: {
         id: crypto.randomUUID(),
         accountId: email,
         providerId: 'credential',
         userId: user.id,
         password: hashedPassword,
         createdAt: new Date(),
         updatedAt: new Date()
       }
     })
     console.log('Created new credential account.')
  } else {
    console.log(`Updated password for user ${email}`)
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
