import fp from 'fastify-plugin'

import type { FastifyRequest, FastifyReply } from 'fastify'

import { env } from '../config/index.js'

/**
 * This lib securely implement JWT on cookies using best practices
 *
 */

interface AuthTokens {
  access: string
  refresh: string
}

const COOKIE = {
  HEADER_PAYLOAD: 'user',
  SIGNATURE: 'sign',
  REFRESH: 'refresh'
}

const isFromFrontend = (req: FastifyRequest) =>
  req.headers['x-requested-with'] === 'XMLHttpRequest'

const splitJwt = (jwtToken: string) => {
  const [headers, payload, signature] = jwtToken.split('.')
  const headersPayload = `${headers}.${payload}`

  return { headersPayload, signature }
}

function sendAuthTokens(this: FastifyReply, tokens: AuthTokens) {
  if (isFromFrontend(this.request)) {
    const { headersPayload, signature } = splitJwt(tokens.access)

    // HttpOnly disabled, acessible from javascript client
    this.setCookie(COOKIE.HEADER_PAYLOAD, headersPayload, {
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'strict',
      maxAge: env.TOKEN_REFRESH_EXPIRATION // long expiration
    })

    // HttpOnly, not accessible from javascript client
    this.setCookie(COOKIE.SIGNATURE, signature, {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: env.TOKEN_ACCESS_EXPIRATION // short expiration
    })

    // HttpOnly, not accessible from javascript client
    this.setCookie(COOKIE.REFRESH, tokens.refresh, {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: env.TOKEN_REFRESH_EXPIRATION // long expiration
    })

    this.send()
    return
  }

  this.send(tokens)
}

export default fp(async (f) => {
  f.decorateReply('sendAuthTokens', sendAuthTokens)
})

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars, no-shadow
  interface FastifyReply {
    sendAuthTokens: typeof sendAuthTokens
  }
}
