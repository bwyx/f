import fp from 'fastify-plugin'
import httpErrors from 'http-errors'

import type { FastifyInstance, RouteHandler } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'

import { registerBody, loginBody } from '../validations/auth.schema.js'

class AuthController {
  private userService

  private tokenService

  constructor(app: FastifyInstance) {
    this.userService = app.userService
    this.tokenService = app.tokenService
  }

  register: RouteHandler<{
    Body: FromSchema<typeof registerBody>
  }> = async (req, rep) => {
    const { name, email, password } = req.body

    const user = await this.userService.create({ name, email, password })
    const tokens = this.tokenService.generateAuthTokens(user.id)

    rep.code(201).send({ user, tokens })
  }

  login: RouteHandler<{
    Body: FromSchema<typeof loginBody>
  }> = async (req, rep) => {
    const { email, password } = req.body
    const user = await this.userService.getUnique({
      where: { email }
    })

    if (!user) {
      rep.unauthorized(
        "The email address you entered isn't connected to an account."
      )
      return
    }

    if (user.password !== password) {
      rep.unauthorized('wrong email/password')
      return
    }

    rep.send(this.tokenService.generateAuthTokens(user.id))
  }

  refreshTokens: RouteHandler = async (req, rep) => {
    const { sub } = req.user
    const user = await this.userService.getUnique({ where: { id: sub } })
    if (!user)
      throw new httpErrors.Unauthorized(
        'Oops!, Looks like this user has been deleted'
      )
    rep.send(this.tokenService.generateAuthTokens(user.id))
  }
}

declare module 'fastify' {
  // eslint-disable-next-line no-shadow, no-unused-vars
  interface FastifyInstance {
    authController: AuthController
  }
}

export default fp(async (app) =>
  app.decorate('authController', new AuthController(app))
)
