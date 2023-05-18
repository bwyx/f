import httpErrors from 'http-errors'

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js'
import type { Prisma, PrismaClient } from '@prisma/client'

import { env } from '../config/index.js'

type SessionCompoundUnique = Prisma.SessionUserIdNonceCompoundUniqueInput
interface UpdateSession {
  sessionId: string
  nonce: string
  nextNonce: string
}

export class SessionService {
  constructor(private session: PrismaClient['session']) {}

  createSession = async ({ userId, nonce }: SessionCompoundUnique) => {
    const expires = new Date(Date.now() + env.EXP_MS_REFRESH)

    return this.session.create({
      data: { userId, nonce, expires }
    })
  }

  refreshSession = async ({ sessionId, nonce, nextNonce }: UpdateSession) => {
    const now = new Date()
    const newExpires = new Date(Date.now() + env.EXP_MS_REFRESH)

    let session

    try {
      session = await this.session.findUnique({
        where: { id: sessionId }
      })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2023') {
          throw new httpErrors.Unauthorized(
            'It seems like you have been logged out. Please login again'
          )
        }
      }

      throw e
    }

    if (!session) {
      throw new httpErrors.Unauthorized(
        'It seems like you have been logged out. Please login again'
      )
    }

    if (session.nonce !== nonce) {
      // a nonce mismatch is a sign of session has been compromised
      // end this whole session since probably the malicious user has the current session,
      // and this attempt is from the legitimate user instead that needs to refresh the session
      await this.session.delete({ where: { id: sessionId } })
      throw new httpErrors.Unauthorized('It seems like you are not logged in')
    }

    if (session.expires < now) {
      // TODO: should delete this session(?) or preserve it for session history?
      throw new httpErrors.Unauthorized(
        'Session has expired. Please login again'
      )
    }

    return this.session.update({
      where: { id: sessionId },
      data: { nonce: nextNonce, expires: newExpires }
    })
  }

  listSessions = async ({ userId }: { userId: string }) =>
    this.session.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        expires: true
      }
    })

  deleteSessionById = async (sessionId: string) => {
    try {
      return await this.session.delete({
        where: { id: sessionId }
      })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') return null
      }

      throw e
    }
  }
}

export default SessionService
