import fp from 'fastify-plugin'

import { AuthController } from './auth.controller.js'
import { UserController } from './user.controller.js'

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    controllers: {
      auth: AuthController
      user: UserController
    }
  }
}

export default fp(async (f) => {
  f.decorate('controllers', {
    auth: new AuthController(f.services),
    user: new UserController(f.services)
  })
})
