import httpErrors from 'http-errors'
import { hash } from 'bcrypt'
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

  create = async ({ name, email, password }: IUserCreate) => {
    const passwordHash = await hash(password, 10)

    try {
      return await this.user.create({
        data: { name, email, passwordHash },
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

export default UserService
