import httpErrors from 'http-errors'
import { hash } from 'bcrypt'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/index.js'

import type { Prisma, PrismaClient } from '@prisma/client'

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

  getUserByEmail = (
    email: string,
    opts: Omit<Prisma.UserFindUniqueArgs, 'where'> = {}
  ) => this.user.findUnique({ where: { email }, ...opts })

  queryUsers = (args?: Prisma.UserFindManyArgs) => this.user.findMany(args)

  createUser = async ({ name, email, password }: IUserCreate) => {
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

  deleteUserById = async (id: string) => {
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
