import fp from 'fastify-plugin'
import httpErrors from 'http-errors'

import type { PrismaClient } from '@prisma/client'

import { env } from '../config/index.js'

interface CreateSession {
  userId: string
  nonce: string
}

interface UpdateSession extends CreateSession {
  nextNonce: string
}

export class SessionService {
  private session

  constructor(_session: PrismaClient['session']) {
    this.session = _session
  }

  createSession = async ({ userId, nonce }: CreateSession) => {
    const expires = new Date(Date.now() + env.TOKEN_REFRESH_EXPIRATION)

    return this.session.create({
      data: { userId, nonce, expires }
    })
  }

  updateSession = async ({ userId, nonce, nextNonce }: UpdateSession) => {
    const expires = new Date(Date.now() + env.TOKEN_REFRESH_EXPIRATION)

    try {
      await this.session.update({
        where: { userId_nonce: { userId, nonce } },
        data: { nonce: nextNonce, expires }
      })
    } catch (e) {
      throw new httpErrors.Unauthorized('Session Not Found')
    }
  }
}

export default fp(async (app) => {
  app.decorate('sessionService', new SessionService(app.prisma.session))
})

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    sessionService: SessionService
  }
}
