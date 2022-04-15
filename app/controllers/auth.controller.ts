import { compare } from 'bcrypt'

import type { FastifyInstance, RouteHandler } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'

import {
  registerBody,
  loginBody,
  authorizationHeaders
} from '../validations/auth.schema.js'

export class AuthController {
  private userService

  private sessionService

  private tokenService

  constructor(_services: FastifyInstance['services']) {
    this.userService = _services.user
    this.sessionService = _services.session
    this.tokenService = _services.token
  }

  register: RouteHandler<{
    Body: FromSchema<typeof registerBody>
  }> = async (req, rep) => {
    const { name, email, password } = req.body

    await this.userService.createUser({ name, email, password })

    rep.code(201).send()
  }

  login: RouteHandler<{
    Body: FromSchema<typeof loginBody>
  }> = async (req, rep) => {
    const { email, password } = req.body
    const user = await this.userService.getUserByEmail(email)

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
    const createdSession = await this.sessionService.createSession({
      userId: user.id,
      nonce
    })

    rep.sendAuthTokens({
      access: this.tokenService.generateAccessToken({
        userId: user.id,
        nonce
      }),
      refresh: this.tokenService.generateRefreshToken({
        sessionId: createdSession.id,
        nonce
      })
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

    rep.send(await this.sessionService.listSessions({ userId: sub }))
  }

  refreshTokens: RouteHandler<{
    Headers: FromSchema<typeof authorizationHeaders>
  }> = async (req, rep) => {
    const refreshToken = req.headers.authorization.split(' ')[1]

    const { sessionId, nextNonce, tokenNonce } =
      this.tokenService.verifyRefreshToken(refreshToken)

    const updatedSession = await this.sessionService.refreshSession({
      sessionId,
      nonce: tokenNonce,
      nextNonce
    })

    rep.sendAuthTokens({
      access: this.tokenService.generateAccessToken({
        userId: updatedSession.userId,
        nonce: nextNonce
      }),
      refresh: this.tokenService.generateRefreshToken({
        sessionId,
        nonce: nextNonce
      })
    })
  }
}

export default AuthController
