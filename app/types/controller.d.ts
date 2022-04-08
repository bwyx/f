import { AuthController } from '../controllers/auth.controller.js'
import { UserController } from '../controllers/user.controller.js'

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    authController: AuthController
    userController: UserController
  }
}
