import fp from 'fastify-plugin'
import httpErrors from 'http-errors'

import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { FastifyJWT } from 'fastify-jwt'

import { createOpaqueToken, verifyOpaqueToken } from '../utils/token.util.js'

export class TokenService {
  private jwt

  private token

  constructor(app: FastifyInstance) {
    this.jwt = app.jwt
    this.token = app.prisma.token
  }

  generateAuthTokens = async (userId: string) => {
    const accessToken = this.generateAccessToken(userId)
    const { refreshToken } = await this.generateRefreshToken(userId)

    return { accessToken, refreshToken }
  }

  refreshAuthTokens = async (token: string) => {
    const userId = verifyOpaqueToken(token)
    // Find the refresh token in the database
    const tokenFound = await this.token.findUnique({
      where: { userId_token: { userId, token } }
    })

    // If the refresh token is not found, expired or revoked then throw an error
    const invalidToken =
      !tokenFound || tokenFound.expires < new Date() || tokenFound.revokedAt
    if (invalidToken) {
      throw new httpErrors.Unauthorized('Please login again')
    }

    // If the refresh token is found and not revoked then generate new tokens
    const accessToken = this.generateAccessToken(userId)
    const { createdToken, refreshToken: newRefreshToken } =
      await this.generateRefreshToken(userId)

    // Then revoke the old refresh token replacing it with the new one
    await this.revokeRefreshToken(token, { replacedBy: createdToken.id })

    return { accessToken, refreshToken: newRefreshToken }
  }

  generateAccessToken = (sub: FastifyJWT['payload']['sub']) => {
    const accessToken = this.jwt.sign(
      { sub, type: 'access' },
      { expiresIn: '30m' }
    )

    return accessToken
  }

  generateRefreshToken = async (userId: string) => {
    const DAY = 1000 * 60 * 60 * 24

    const refreshToken = createOpaqueToken(userId)
    const expires = new Date(Date.now() + DAY * 7)

    const createdToken = await this.token.create({
      data: { userId, token: refreshToken, expires }
    })

    return { createdToken, refreshToken }
  }

  revokeRefreshToken = async (
    token: string,
    { replacedBy }: { replacedBy?: string } = {}
  ) => {
    const userId = verifyOpaqueToken(token)
    if (replacedBy) {
      await this.token.update({
        where: { userId_token: { userId, token } },
        data: { revokedAt: new Date(), replacedBy }
      })
    } else {
      await this.token.delete({
        where: { userId_token: { userId, token } }
      })
    }
  }

  getUserTokens = (userId: string) => this.token.findMany({ where: { userId } })

  static verifyJwt = (req: FastifyRequest) => req.jwtVerify()
}

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars, no-shadow
  interface FastifyInstance {
    tokenService: TokenService
    verifyJwt: () => Promise<void>
  }
}

export default fp(async (app) => {
  app.decorate('tokenService', new TokenService(app))
  app.decorate('verifyJwt', TokenService.verifyJwt)
})
