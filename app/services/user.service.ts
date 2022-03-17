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
    let createdUser

    try {
      createdUser = await this.user.create({
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
    }

    return createdUser
  }

  async query(args?: Prisma.UserFindManyArgs) {
    const users = await this.user.findMany(args)

    return users
  }

  async remove(id: User['id']) {
    let deletedUser

    try {
      deletedUser = await this.user.delete({ where: { id } })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new Error('User to delete does not exist')
        }
      }
    }

    return deletedUser
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    userService: UserService
  }
}

export default fp(async (fastify) => {
  fastify.decorate('userService', new UserService(fastify.prisma.user))
})
