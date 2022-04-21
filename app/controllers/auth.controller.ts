import { compare } from 'bcrypt'

import type { FastifyInstance, RouteHandler } from 'fastify'
import type { FromSchema } from 'json-schema-to-ts'

import { registerBody, loginBody } from '../validations/auth.schema.js'

export class AuthController {
  private userService

  private sessionService

  private tokenService

  private mailService

  constructor(_services: FastifyInstance['services']) {
    this.userService = _services.user
    this.sessionService = _services.session
    this.tokenService = _services.token
    this.mailService = _services.mail
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
    try {
      // TODO: blacklist access token jti (tokenNonce)
      const refreshToken = req.getRefreshToken()
      const { sessionId } = this.tokenService.verifyRefreshToken(refreshToken)

      await this.sessionService.deleteSessionById(sessionId)
    } catch (e) {
      // do nothing
    }

    rep.destroyFrontendAuthCookies()
    rep.code(200).send()
  }

  getSessions: RouteHandler = async (req, rep) => {
    const { sub } = req.user

    rep.send(await this.sessionService.listSessions({ userId: sub }))
  }

  refreshTokens: RouteHandler = async (req, rep) => {
    const refreshToken = req.getRefreshToken()

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

  sendVerificationEmail: RouteHandler = async (req, rep) => {
    const { sub } = req.user
    const user = await this.userService.getUserById(sub)

    if (!user) {
      rep.notFound('User not found')
    } else if (user.verifiedAt) {
      rep.badRequest('User already verified')
    } else {
      const verifyEmailToken = this.tokenService.generateVerifyEmailToken(sub)
      await this.mailService.sendVerificationEmail(user.email, verifyEmailToken)

      rep.send()
    }
  }

  verifyEmail: RouteHandler = async (req, rep) => {
    const { sub, jti, exp } = req.user
    await this.tokenService.checkThenBlacklistToken(sub, jti, exp)

    const user = await this.userService.getUserById(sub, {
      select: { verifiedAt: true }
    })

    if (!user) {
      rep.notFound('User not found')
    } else if (user.verifiedAt) {
      rep.badRequest('User already verified')
    } else {
      const verifiedUser = await this.userService.updateUserById(sub, {
        data: { verifiedAt: new Date() },
        select: {
          name: true,
          email: true,
          verifiedAt: true
        }
      })

      rep.send(verifiedUser)
    }
  }
}

export default AuthController
