import fp from 'fastify-plugin'
import jwt, { FastifyJWTOptions } from 'fastify-jwt'

import type { FastifyReply, FastifyRequest } from 'fastify'

import { extractToken } from './jwtCookie.js'
import { env, TokenTypes } from '../config/index.js'

const authenticate = async (req: FastifyRequest, rep: FastifyReply) => {
  try {
    await req.jwtVerify()
  } catch (e) {
    rep.unauthorized((<Error>e).message)
  }

  if (req.user.type !== TokenTypes.ACCESS) {
    rep.unauthorized('Invalid token type')
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
    verify: { extractToken }
  })
  f.decorate('authenticate', authenticate)
})

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: typeof authenticate
  }
}

declare module 'fastify-jwt' {
  interface FastifyJWT {
    // payload type is used for signing and verifying
    payload: {
      sub: string
      jti: string
      type: TokenTypes
    }

    user: {
      sub: string
      jti: string
      type: TokenTypes
      iat: number
      exp: number
    }
  }
}
