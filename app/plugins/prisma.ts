import fp from 'fastify-plugin'
import Prisma from '@prisma/client'

import type { FastifyPluginAsync } from 'fastify'
import type { PrismaClient as PrismaClientType } from '@prisma/client'

// PrismaClient not yet support esm
// https://github.com/prisma/prisma/pull/4920
const { PrismaClient } = Prisma

// Use TypeScript module augmentation to declare the type of server.prisma to be PrismaClient
declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    prisma: PrismaClientType
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (server) => {
  const prisma = new PrismaClient()
  await prisma.$connect()
  // Make Prisma Client available through the fastify server instance: server.prisma
  server.decorate('prisma', prisma)
  server.addHook('onClose', async (s) => {
    await s.prisma.$disconnect()
  })
})

export default prismaPlugin
