import fp from 'fastify-plugin'
import httpErrors from 'http-errors'
import cryptoRandomString from 'crypto-random-string'

import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { FastifyJWT } from 'fastify-jwt'

import { splitRefreshToken } from '../utils/index.js'

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

  refreshAuthTokens = async (refreshToken: string) => {
    const { userId, token } = splitRefreshToken(refreshToken)
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
    await this.revokeRefreshToken(refreshToken, { replacedBy: createdToken.id })

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
    const token = cryptoRandomString({ length: 64, type: 'base64' })
    const expires = new Date(Date.now() + DAY * 7)

    const t = await this.token.create({ data: { userId, token, expires } })
    const u = Buffer.from(userId).toString('base64')

    return { createdToken: t, refreshToken: `${t.token}.${u}` }
  }

  revokeRefreshToken = async (
    refreshToken: string,
    { replacedBy }: { replacedBy?: string } = {}
  ) => {
    const { userId, token } = splitRefreshToken(refreshToken)
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

  static verifyJwt = async (req: FastifyRequest) => {
    try {
      await req.jwtVerify()
    } catch (e) {
      throw new httpErrors.BadRequest((<Error>e).message)
    }
  }
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
