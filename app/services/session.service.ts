import fp from 'fastify-plugin'
import httpErrors from 'http-errors'

import type { PrismaClient } from '@prisma/client'

import { env } from '../config/index.js'

import type { TokenModule } from '../modules/token.module.js'

export class SessionService {
  private session

  private tokenModule

  constructor(_session: PrismaClient['session'], _tokenModule: TokenModule) {
    this.session = _session
    this.tokenModule = _tokenModule
  }

  createSession = async (userId: string) => {
    const nonce = this.tokenModule.generateNonce()
    const expires = Date.now() + env.TOKEN_REFRESH_EXPIRATION

    await this.session.create({
      data: {
        userId,
        nonce,
        expires: new Date(expires)
      }
    })

    const newAccessToken = this.tokenModule.generateAccessToken(userId)
    const newRefreshToken = this.tokenModule.generateRefreshToken(userId, nonce)

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  }

  refreshSession = async (refreshToken: string) => {
    const { userId, nextNonce, tokenNonce } =
      this.tokenModule.verifyRefreshToken(refreshToken)
    // TODO need to verify refresh token expires ^

    try {
      await this.session.update({
        where: { userId_nonce: { userId, nonce: tokenNonce } },
        data: { nonce: nextNonce }
      })
    } catch (e) {
      throw new httpErrors.Unauthorized('invalid refresh token')
    }

    const newAccessToken = this.tokenModule.generateAccessToken(userId)
    const newRefreshToken = this.tokenModule.generateRefreshToken(
      userId,
      nextNonce
    )

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  }
}

export default fp(async (app) => {
  const { prisma, tokenModule } = app
  app.decorate(
    'sessionService',
    new SessionService(prisma.session, tokenModule),
    ['prisma', 'tokenModule']
  )
})

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    sessionService: SessionService
  }
}
