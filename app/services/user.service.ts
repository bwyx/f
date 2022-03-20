import fp from 'fastify-plugin'
import httpErrors from 'http-errors'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/index.js'

import type { Prisma, PrismaClient, User } from '@prisma/client'

interface IUserCreate {
  name: string
  email: string
  password: string
}

export class UserService {
  private user

  constructor(_user: PrismaClient['user']) {
    this.user = _user
  }

  getUnique = (args: Prisma.UserFindUniqueArgs) => this.user.findUnique(args)

  getFirst = (args: Prisma.UserFindFirstArgs) => this.user.findFirst(args)

  query = (args?: Prisma.UserFindManyArgs) => this.user.findMany(args)

  create = async (data: IUserCreate) => {
    try {
      return await this.user.create({
        data,
        select: {
          id: true,
          name: true,
          email: true
        }
      })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new httpErrors.BadRequest('Email already registered')
        }
      }

      throw e
    }
  }

  remove = async (id: User['id']) => {
    try {
      return await this.user.delete({ where: { id } })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          return null
        }
      }

      throw e
    }
  }
}

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    userService: UserService
  }
}

export default fp(async (fastify) => {
  fastify.decorate('userService', new UserService(fastify.prisma.user))
})
