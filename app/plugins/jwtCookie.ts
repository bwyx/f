import fp from 'fastify-plugin'
import httpErrors from 'http-errors'

import type { FastifyRequest, FastifyReply } from 'fastify'
import type { CookieSerializeOptions } from 'fastify-cookie'

import { env } from '../config/index.js'

/**
 * This lib securely implement JWT on cookies using best practices
 *
 */

interface JWTCookieOptions {
  path?: string
  accessibleFromJavascript?: boolean
  lifespan: 'access' | 'refresh' | 'destroy'
}

const COOKIE = {
  PAYLOAD: `${env.APP_NAME}_user`,
  HEADER_SIGNATURE: `${env.APP_NAME}_token`,
  SESSION: `${env.APP_NAME}_session`
}

const cookieOptions = ({
  path = '/',
  accessibleFromJavascript = false,
  lifespan
}: JWTCookieOptions): CookieSerializeOptions => {
  const age = lifespan === 'access' ? env.EXP_MS_ACCESS : env.EXP_MS_REFRESH

  return {
    path,
    secure: true,
    sameSite: 'lax',
    domain: env.FRONTEND_DOMAIN ? `.${env.FRONTEND_DOMAIN}` : undefined,
    httpOnly: !accessibleFromJavascript,
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
  let token

  try {
    token = getAuthorizationBearer(req)
  } catch (e) {
    if (isFromFrontend(req)) {
      const { cookies } = req
      const payload = cookies[COOKIE.PAYLOAD]
      const headersAndSignature = cookies[COOKIE.HEADER_SIGNATURE]

      if (!payload || !headersAndSignature) {
        throw httpErrors(401, 'No Authorization was found in request.cookies')
      }

      token = joinJwt(payload, headersAndSignature)
    } else {
      throw e
    }
  }

  return token
}

export function getSessionId(this: FastifyRequest) {
  if (typeof this.body === 'object' && this.body !== null) {
    const { sessionId } = this.body as Record<string, string | undefined>
    if (sessionId) return sessionId
  }

  if (isFromFrontend(this)) {
    const cookieSession = this.cookies[COOKIE.SESSION]
    if (cookieSession) return cookieSession
  }

  throw httpErrors(401, 'No session was found in request body or cookies')
}

export function sendAccessTokenAndSessionId(
  this: FastifyReply,
  access: string,
  sessionId: string
) {
  if (isFromFrontend(this.request)) {
    const { payload, headersAndSignature } = splitJwt(access)

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
      cookieOptions({ lifespan: 'refresh' })
    )

    this.setCookie(
      COOKIE.SESSION,
      sessionId,
      cookieOptions({ lifespan: 'refresh' })
    )

    this.send()
    return
  }

  this.send({ access, sessionId })
}

// Remove cookie server side
// https://tools.ietf.org/search/rfc6265
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
      COOKIE.SESSION,
      EMPTY,
      cookieOptions({ lifespan: 'destroy' })
    )
  }
}

export default fp(async (f) => {
  f.decorateRequest('getSessionId', getSessionId)
  f.decorateReply('sendAccessTokenAndSessionId', sendAccessTokenAndSessionId)
  f.decorateReply('destroyFrontendAuthCookies', destroyFrontendAuthCookies)
})

declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  interface FastifyRequest {
    getSessionId: typeof getSessionId
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  interface FastifyReply {
    sendAccessTokenAndSessionId: typeof sendAccessTokenAndSessionId
    destroyFrontendAuthCookies: typeof destroyFrontendAuthCookies
  }
}
