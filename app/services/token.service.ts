import fp from 'fastify-plugin'
import httpErrors from 'http-errors'

import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { FastifyJWT } from 'fastify-jwt'

export class TokenService {
  private jwt

  constructor(app: FastifyInstance) {
    this.jwt = app.jwt
  }

  generateAuthTokens = (sub: FastifyJWT['payload']['sub']) => {
    const accessToken = this.jwt.sign(
      { sub, type: 'access' },
      { expiresIn: '30m' }
    )

    const refreshToken = this.jwt.sign(
      { sub, type: 'refresh' },
      { expiresIn: '1d' }
    )

    return { accessToken, refreshToken }
  }

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
