import fp from 'fastify-plugin'
import jwt, { FastifyJWTOptions } from 'fastify-jwt'

import type { FastifyReply, FastifyRequest } from 'fastify'

import { extractToken } from './jwtCookie.js'
import { env, tokenTypes } from '../config/index.js'

const verifyJwt =
  (type: string = tokenTypes.ACCESS, checkBlacklisted = true) =>
  async (req: FastifyRequest, rep: FastifyReply) => {
    try {
      await req.jwtVerify()
    } catch (e) {
      rep.unauthorized((<Error>e).message)
      return
    }

    if (req.user.type !== type) {
      rep.unauthorized('Invalid token type')
    }

    if (checkBlacklisted) {
      await req.server.services.token.checkBlacklisted(
        req.user.sub,
        req.user.jti
      )
    }
  }

/**
 * This will decorate your fastify instance with the following methods: decode, sign, and verify;
 * refer to their documentation to find how to use the utilities.
 * It will also register request.jwtVerify and reply.jwtSign.
 * You must pass a secret when registering the plugin.
 *
 * @see https://github.com/fastify/fastify-jwt
 */
export default fp<FastifyJWTOptions>(async (f) => {
  f.register(jwt, {
    secret: env.APP_KEY,
    jwtDecode: true,
    verify: { extractToken }
  })
  f.decorate('verifyJwt', verifyJwt)
})

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars, no-shadow
  interface FastifyInstance {
    verifyJwt: typeof verifyJwt
  }
}

declare module 'fastify-jwt' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyJWT {
    // payload type is used for signing and verifying
    payload: {
      sub: string
      jti: string
      type: string
    }

    user: {
      sub: string
      iat: number
      exp: number
      jti: string
      type: string
    }
  }
}
