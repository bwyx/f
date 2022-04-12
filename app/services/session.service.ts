import fp from 'fastify-plugin'

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/index.js'
import type { Prisma, PrismaClient } from '@prisma/client'

import { env } from '../config/index.js'

type SessionCompoundUnique = Prisma.SessionUserIdNonceCompoundUniqueInput
interface UpdateSession {
  sessionId: string
  nonce: string
  nextNonce: string
}

export class SessionService {
  private session

  constructor(_session: PrismaClient['session']) {
    this.session = _session
  }

  createSession = async ({ userId, nonce }: SessionCompoundUnique) => {
    const expires = new Date(Date.now() + env.TOKEN_REFRESH_EXPIRATION)

    return this.session.create({
      data: { userId, nonce, expires }
    })
  }

  refreshSession = async ({ sessionId, nonce, nextNonce }: UpdateSession) => {
    const expires = new Date(Date.now() + env.TOKEN_REFRESH_EXPIRATION)

    const session = await this.session.findUnique({
      where: { id: sessionId },
      rejectOnNotFound: () => new Error('Please login again')
    })

    if (session.nonce !== nonce) {
      // TODO: end this whole session, nonce mismatch is a sign session has been compromised
      throw new Error('It seems like you are not logged in')
    }

    return this.session.update({
      where: { id: sessionId },
      data: { nonce: nextNonce, expires }
    })
  }

  listSessions = async ({ userId }: { userId: string }) =>
    this.session.findMany({
      where: { userId }
    })

  deleteSession = async ({ userId, nonce }: SessionCompoundUnique) => {
    try {
      return await this.session.delete({
        where: { userId_nonce: { userId, nonce } }
      })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') return undefined
      }

      throw e
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
