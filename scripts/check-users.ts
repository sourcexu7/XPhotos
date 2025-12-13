import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    include: {
      accounts: true
    }
  })

  console.log(`Found ${users.length} users.`)

  for (const user of users) {
    console.log(`User: ${user.email} (ID: ${user.id})`)
    if (user.accounts.length === 0) {
      console.log('  No accounts found.')
    } else {
      for (const acc of user.accounts) {
        console.log(`  Account: ${acc.providerId}`)
        if (acc.password) {
          console.log(`    Password Hash: ${acc.password.substring(0, 10)}... (Length: ${acc.password.length})`)
        } else {
          console.log('    Password: (null)')
        }
      }
    }
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
