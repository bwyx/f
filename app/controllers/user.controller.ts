import fp from 'fastify-plugin'

import type { FastifyInstance, RouteHandler } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'

import { createUserBody, deleteUserParams } from '../validations/user.schema.js'

class UserController {
  private userService

  constructor(app: FastifyInstance) {
    this.userService = app.userService
  }

  list: RouteHandler = async (req, rep) => {
    rep.send(await this.userService.query())
  }

  create: RouteHandler<{
    Body: FromSchema<typeof createUserBody>
  }> = async (req, rep) => {
    rep.send(await this.userService.create(req.body))
  }

  delete: RouteHandler<{
    Params: FromSchema<typeof deleteUserParams>
    Reply: undefined // 204
  }> = async (req, rep) => {
    const { userId } = req.params
    await this.userService.remove(userId)

    rep.code(204)
  }
}

declare module 'fastify' {
  // eslint-disable-next-line no-shadow, no-unused-vars
  interface FastifyInstance {
    userController: UserController
  }
}

export default fp(async (app) =>
  app.decorate('userController', new UserController(app))
)
