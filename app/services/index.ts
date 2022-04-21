import fp from 'fastify-plugin'

import { SessionService } from './session.service.js'
import { TokenService } from './token.service.js'
import { UserService } from './user.service.js'
import { MailService } from './mail.service.js'

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    services: {
      mail: MailService
      session: SessionService
      token: TokenService
      user: UserService
    }
  }
}

export default fp(async (f) => {
  f.decorate('services', {
    mail: new MailService(f.mailer),
    session: new SessionService(f.prisma.session),
    token: new TokenService(f.jwt, f.redis),
    user: new UserService(f.prisma.user)
  })
})
