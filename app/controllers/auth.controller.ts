import fp from 'fastify-plugin'
import { compare } from 'bcrypt'

import type { FastifyInstance, RouteHandler } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'

import {
  registerBody,
  loginBody,
  authorizationHeaders
} from '../validations/auth.schema.js'

class AuthController {
  private userService

  private sessionService

  private tokenService

  constructor(app: FastifyInstance) {
    this.userService = app.userService
    this.sessionService = app.sessionService
    this.tokenService = app.tokenService
  }

  register: RouteHandler<{
    Body: FromSchema<typeof registerBody>
  }> = async (req, rep) => {
    const { name, email, password } = req.body

    await this.userService.create({ name, email, password })

    rep.code(201).send()
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

    const match = await compare(password, user.passwordHash)

    if (!match) {
      rep.unauthorized("The password that you've entered is incorrect.")
      return
    }

    const nonce = this.tokenService.generateNonce()
    await this.sessionService.createSession({ userId: user.id, nonce })

    rep.send({
      accessToken: this.tokenService.generateAccessToken(user.id, nonce),
      refreshToken: this.tokenService.generateRefreshToken(user.id, nonce)
    })
  }

  logout: RouteHandler = async (req, rep) => {
    // TODO: blacklist access token
    const { sub, jti } = req.user
    await this.sessionService.deleteSession({ userId: sub, nonce: jti })

    rep.code(204)
  }

  getSessions: RouteHandler = async (req, rep) => {
    const { sub } = req.user

    rep.send(await this.sessionService.listSessions(sub))
  }

  refreshTokens: RouteHandler<{
    Headers: FromSchema<typeof authorizationHeaders>
  }> = async (req, rep) => {
    const refreshToken = req.headers.authorization.split(' ')[1]

    const { userId, nextNonce, tokenNonce } =
      this.tokenService.verifyRefreshToken(refreshToken)

    await this.sessionService.updateSession({
      userId,
      nonce: tokenNonce,
      nextNonce
    })

    rep.send({
      accessToken: this.tokenService.generateAccessToken(userId, nextNonce),
      refreshToken: this.tokenService.generateRefreshToken(userId, nextNonce)
    })
  }
}

export default fp(async (app) =>
  app.decorate('authController', new AuthController(app))
)

declare module 'fastify' {
  // eslint-disable-next-line no-shadow, no-unused-vars
  interface FastifyInstance {
    authController: AuthController
  }
}
