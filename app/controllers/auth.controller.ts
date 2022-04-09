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
  private deviceService

  private userService

  private tokenService

  constructor(app: FastifyInstance) {
    this.deviceService = app.deviceService
    this.userService = app.userService
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
    const userAgent = req.headers['user-agent']
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

    const device = await this.deviceService.authenticateUserFromDevice(
      user.id,
      userAgent
    )

    rep.send(
      await this.tokenService.generateAuthTokens({
        userId: user.id,
        deviceId: device.id
      })
    )
  }

  logout: RouteHandler<{
    Headers: FromSchema<typeof authorizationHeaders>
  }> = async (req, rep) => {
    const refreshToken = req.headers.authorization.split(' ')[1]
    await this.tokenService.revokeRefreshToken(refreshToken)

    rep.code(204)
  }

  getSessions: RouteHandler = async (req, rep) => {
    const { sub } = req.user

    rep.send(await this.tokenService.getUserTokens(sub))
  }

  getDevices: RouteHandler = async (req, rep) => {
    const { sub } = req.user

    rep.send(await this.deviceService.getUserDevices(sub))
  }

  refreshTokens: RouteHandler<{
    Headers: FromSchema<typeof authorizationHeaders>
  }> = async (req, rep) => {
    const refreshToken = req.headers.authorization.split(' ')[1]

    const tokens = await this.tokenService.refreshAuthTokens(refreshToken)

    rep.send(tokens)
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
