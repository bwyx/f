import fp from 'fastify-plugin'
import httpErrors from 'http-errors'

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

const getAuthorizationBearer = (req: FastifyRequest) => {
  const { authorization } = req.headers
  if (!authorization) {
    throw httpErrors(401, 'No Authorization was found in request.headers')
  }

  const parts = authorization.split(' ')
  const [scheme, token] = parts

  if (parts.length !== 2 || !/^Bearer$/i.test(scheme)) {
    throw httpErrors(401, 'Format is Authorization: Bearer [token]')
  }

  return token
}

export const extractToken = (req: FastifyRequest) => {
  if (isFromFrontend(req)) {
    const { cookies } = req
    const headerPayload = cookies[COOKIE.HEADER_PAYLOAD]
    const signature = cookies[COOKIE.SIGNATURE]

    if (!headerPayload || !signature) {
      throw httpErrors(401, 'No Authorization was found in request.cookies')
    }

    return `${headerPayload}.${signature}`
  }

  return getAuthorizationBearer(req)
}

// eslint-disable-next-line no-unused-vars
export function getRefreshToken(this: FastifyRequest) {
  if (isFromFrontend(this)) {
    const refreshToken = this.cookies[COOKIE.REFRESH]

    if (!refreshToken) {
      throw httpErrors(401, 'No Authorization was found in request.cookies')
    }

    return refreshToken
  }

  return getAuthorizationBearer(this)
}

export function sendAuthTokens(this: FastifyReply, tokens: AuthTokens) {
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

// Remove cookie server side
// https://tools.ietf.org/search/rfc6265
// eslint-disable-next-line no-unused-vars
export function destroyFrontendAuthCookies(this: FastifyReply) {
  if (isFromFrontend(this.request)) {
    this.setCookie(COOKIE.HEADER_PAYLOAD, '', {
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'strict',
      expires: new Date(0)
    })

    this.setCookie(COOKIE.SIGNATURE, '', {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      expires: new Date(0)
    })

    this.setCookie(COOKIE.REFRESH, '', {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      expires: new Date(0)
    })
  }
}

export default fp(async (f) => {
  f.decorateRequest('getRefreshToken', getRefreshToken)
  f.decorateReply('sendAuthTokens', sendAuthTokens)
  f.decorateReply('destroyFrontendAuthCookies', destroyFrontendAuthCookies)
})

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars, no-shadow
  interface FastifyRequest {
    getRefreshToken: typeof getRefreshToken
  }

  // eslint-disable-next-line no-unused-vars, no-shadow
  interface FastifyReply {
    sendAuthTokens: typeof sendAuthTokens
    destroyFrontendAuthCookies: typeof destroyFrontendAuthCookies
  }
}
