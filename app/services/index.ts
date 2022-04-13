import fp from 'fastify-plugin'

import { SessionService } from './session.service.js'
import { TokenService } from './token.service.js'
import { UserService } from './user.service.js'

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    services: {
      session: SessionService
      token: TokenService
      user: UserService
    }
  }
}

export default fp(async (f) => {
  f.decorate('services', {
    session: new SessionService(f.prisma.session),
    token: new TokenService(f.jwt),
    user: new UserService(f.prisma.user)
  })
})
