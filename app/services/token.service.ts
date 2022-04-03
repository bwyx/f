import fp from 'fastify-plugin'
import httpErrors from 'http-errors'
import cryptoRandomString from 'crypto-random-string'

import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { FastifyJWT } from 'fastify-jwt'

export class TokenService {
  private jwt

  private token

  constructor(app: FastifyInstance) {
    this.jwt = app.jwt
    this.token = app.prisma.token
  }

  generateAuthTokens = async (userId: string) => {
    const accessToken = this.generateAccessToken(userId)
    const refreshToken = await this.generateRefreshToken(userId)

    return { accessToken, refreshToken }
  }

  generateAccessToken = (sub: FastifyJWT['payload']['sub']) => {
    const accessToken = this.jwt.sign(
      { sub, type: 'access' },
      { expiresIn: '30m' }
    )

    return accessToken
  }

  generateRefreshToken = async (userId: string) => {
    const token = cryptoRandomString({ length: 64, type: 'base64' })

    const t = await this.token.create({ data: { userId, token } })
    const u = Buffer.from(userId).toString('base64')

    return `${t.token}.${u}`
  }

  getToken = async (userToken: string) => {
    const t = userToken.split('.')
    const token = t[0]
    const userId = Buffer.from(t[1], 'base64').toString()

    const refreshToken = await this.token.findUnique({
      where: {
        userId_token: { userId, token }
      }
    })

    if (!refreshToken) {
      throw new httpErrors.Unauthorized('Invalid token')
    }

    return refreshToken
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
