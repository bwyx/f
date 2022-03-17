import fp from 'fastify-plugin'

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

class UserController {
  async list(this: FastifyInstance, req: FastifyRequest, rep: FastifyReply) {
    const users = await this.userService.query()

    rep.send(users)
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    userController: UserController
  }
}

export default fp(async (fastify) =>
  fastify.decorate('userController', new UserController())
)
