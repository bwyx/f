import fp from 'fastify-plugin'

import { AuthController } from './auth.controller.js'
import { UserController } from './user.controller.js'

declare module 'fastify' {
  interface FastifyInstance {
    controllers: {
      auth: AuthController
      user: UserController
    }
  }
}

export default fp(async (f) => {
  const { user, session, token, mail } = f.services

  f.decorate('controllers', {
    auth: new AuthController(user, session, token, mail),
    user: new UserController(user)
  })
})
