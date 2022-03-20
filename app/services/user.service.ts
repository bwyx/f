import fp from 'fastify-plugin'
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

  async create(data: IUserCreate) {
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
          throw new Error('Email already registered')
        }
      }

      throw e
    }
  }

  query(args?: Prisma.UserFindManyArgs) {
    return this.user.findMany(args)
  }

  async remove(id: User['id']) {
    try {
      return await this.user.delete({ where: { id } })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new Error('User to delete does not exist')
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
