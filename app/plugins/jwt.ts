import fp from 'fastify-plugin'
import jwt, { FastifyJWTOptions } from 'fastify-jwt'

import type { FastifyReply, FastifyRequest } from 'fastify'

import { env } from '../config/index.js'

/**
 * This will decorate your fastify instance with the following methods: decode, sign, and verify;
 * refer to their documentation to find how to use the utilities.
 * It will also register request.jwtVerify and reply.jwtSign.
 * You must pass a secret when registering the plugin.
 *
 * @see https://github.com/fastify/fastify-sensible
 */
export default fp<FastifyJWTOptions>(async (fastify) => {
  fastify.register(jwt, {
    secret: env.APP_KEY
  })

  fastify.decorate(
    'verifyJwt',
    async (req: FastifyRequest, rep: FastifyReply) => {
      try {
        await req.jwtVerify()
      } catch (err) {
        rep.send(err)
      }
    }
  )
})

declare module 'fastify-jwt' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyJWT {
    payload: { sub: string } // payload type is used for signing and verifying
    user: {
      sub: string
    } // user type is return type of `request.user` object
  }
}
