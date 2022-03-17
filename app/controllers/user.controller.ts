import type { PrismaClient } from '@prisma/client'

const userController = (prisma: PrismaClient) => ({
  query: () => prisma.user.findMany()
})

export default userController
