import { TokenService } from '../services/token.service.js'
import { UserService } from '../services/user.service.js'

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    tokenService: TokenService
    userService: UserService
  }
}
