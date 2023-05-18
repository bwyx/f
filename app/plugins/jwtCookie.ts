import fp from 'fastify-plugin'
import httpErrors from 'http-errors'

import type { FastifyRequest, FastifyReply } from 'fastify'

import { env, COOKIES } from '../config/index.js'

/**
 * This lib securely implement JWT on cookies using best practices
 *
 */

interface JWTCookieOptions {
  path?: string
  accessibleFromJavascript?: boolean
  lifespan: 'access' | 'refresh' | 'destroy'
}

const cookieOptions = ({
  path = '/',
  accessibleFromJavascript = false,
  lifespan
}: JWTCookieOptions) => {
  const age = lifespan === 'access' ? env.EXP_MS_ACCESS : env.EXP_MS_REFRESH

  return {
    path,
    secure: env.APP_ENV !== 'development',
    sameSite: 'lax',
    domain: env.FRONTEND_DOMAIN ? `.${env.FRONTEND_DOMAIN}` : undefined,
    httpOnly: !accessibleFromJavascript,
    maxAge: lifespan === 'destroy' ? 0 : age / 1000,
    expires: lifespan === 'destroy' ? new Date(0) : undefined
  } as const
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
      const payload = cookies[COOKIES.PAYLOAD]
      const headersAndSignature = cookies[COOKIES.HEADER_SIGNATURE]

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
  const cookieSession = this.session.get('sessionId')
  if (cookieSession) return cookieSession

  throw httpErrors(401, 'No session was found in request body or cookies')
}

interface SendAccessTokenAndSessionId {
  accessToken: string
  sessionId: string
  redirectTo?: string
}

export function sendAccessTokenAndSessionId(
  this: FastifyReply,
  { accessToken, sessionId, redirectTo }: SendAccessTokenAndSessionId
) {
  this.request.session.set('sessionId', sessionId)

  if (isFromFrontend(this.request) || redirectTo) {
    const { payload, headersAndSignature } = splitJwt(accessToken)

    this.setCookie(
      COOKIES.PAYLOAD,
      payload,
      cookieOptions({
        accessibleFromJavascript: true,
        lifespan: 'refresh'
      })
    )

    this.setCookie(
      COOKIES.HEADER_SIGNATURE,
      headersAndSignature,
      cookieOptions({ lifespan: 'refresh' })
    )

    if (redirectTo) this.redirect(redirectTo)
    else this.send()
    return
  }

  this.send({ accessToken })
}

// Remove cookie server side
// https://tools.ietf.org/search/rfc6265
export function destroyAuthCookies(this: FastifyReply) {
  this.request.session.delete()

  if (isFromFrontend(this.request)) {
    this.setCookie(
      COOKIES.PAYLOAD,
      '',
      cookieOptions({
        accessibleFromJavascript: true,
        lifespan: 'destroy'
      })
    )

    this.setCookie(
      COOKIES.HEADER_SIGNATURE,
      '',
      cookieOptions({ lifespan: 'destroy' })
    )
  }
}

export default fp(async (f) => {
  f.decorateRequest('getSessionId', getSessionId)
  f.decorateReply('sendAccessTokenAndSessionId', sendAccessTokenAndSessionId)
  f.decorateReply('destroyAuthCookies', destroyAuthCookies)
})

declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  interface FastifyRequest {
    getSessionId: typeof getSessionId
  }

  // eslint-disable-next-line @typescript-eslint/no-shadow
  interface FastifyReply {
    sendAccessTokenAndSessionId: typeof sendAccessTokenAndSessionId
    destroyAuthCookies: typeof destroyAuthCookies
  }
}
