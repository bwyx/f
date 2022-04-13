import type { FastifyInstance, RouteHandler } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'

import { createUserBody, deleteUserParams } from '../validations/user.schema.js'

export class UserController {
  private userService

  constructor(_services: FastifyInstance['services']) {
    this.userService = _services.user
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

export default UserController
