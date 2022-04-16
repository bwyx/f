import fp from 'fastify-plugin'
import httpErrors from 'http-errors'

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CookieSerializeOptions } from 'fastify-cookie'

import { env } from '../config/index.js'

/**
 * This lib securely implement JWT on cookies using best practices
 *
 */

interface AuthTokens {
  access: string
  refresh: string
}

interface JWTCookieOptions {
  path?: string
  accessibleFromJavascript?: boolean
  lifespan: 'access' | 'refresh' | 'destroy'
}

const COOKIE = {
  PAYLOAD: 'user',
  HEADER_SIGNATURE: 'sign',
  REFRESH: 'refresh'
}

const cookieOptions = ({
  path = '/',
  accessibleFromJavascript = false,
  lifespan
}: JWTCookieOptions): CookieSerializeOptions => {
  const age =
    lifespan === 'access'
      ? env.TOKEN_ACCESS_EXPIRATION
      : env.TOKEN_REFRESH_EXPIRATION

  return {
    path,
    secure: true,
    httpOnly: !accessibleFromJavascript,
    sameSite: 'lax',
    maxAge: lifespan === 'destroy' ? 0 : age,
    expires: lifespan === 'destroy' ? new Date(0) : undefined
  }
}

const isFromFrontend = (req: FastifyRequest) =>
  req.headers['x-requested-with'] === 'XMLHttpRequest'

const splitJwt = (jwtToken: string) => {
  const [headers, payload, signature] = jwtToken.split('.')
  const headersAndSignature = `${headers}.${signature}`

  return { payload, headersAndSignature }
}

const joinJwt = (payload: string, headersAndSignature: string) => {
  const [headers, signature] = headersAndSignature.split('.')
  return `${headers}.${payload}.${signature}`
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
    const payload = cookies[COOKIE.PAYLOAD]
    const headersAndSignature = cookies[COOKIE.HEADER_SIGNATURE]

    if (!payload || !headersAndSignature) {
      throw httpErrors(401, 'No Authorization was found in request.cookies')
    }

    return joinJwt(payload, headersAndSignature)
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
    const { payload, headersAndSignature } = splitJwt(tokens.access)

    this.setCookie(
      COOKIE.PAYLOAD,
      payload,
      cookieOptions({
        accessibleFromJavascript: true,
        lifespan: 'refresh'
      })
    )

    this.setCookie(
      COOKIE.HEADER_SIGNATURE,
      headersAndSignature,
      cookieOptions({ lifespan: 'access' })
    )

    this.setCookie(
      COOKIE.REFRESH,
      tokens.refresh,
      cookieOptions({ lifespan: 'refresh' })
    )

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
    const EMPTY = ''

    this.setCookie(
      COOKIE.PAYLOAD,
      EMPTY,
      cookieOptions({
        accessibleFromJavascript: true,
        lifespan: 'destroy'
      })
    )

    this.setCookie(
      COOKIE.HEADER_SIGNATURE,
      EMPTY,
      cookieOptions({ lifespan: 'destroy' })
    )

    this.setCookie(
      COOKIE.REFRESH,
      EMPTY,
      cookieOptions({ lifespan: 'destroy' })
    )
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
