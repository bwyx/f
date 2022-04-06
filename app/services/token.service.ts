import fp from 'fastify-plugin'
import httpErrors from 'http-errors'

import type { FastifyRequest } from 'fastify'
import type { JWT } from 'fastify-jwt'
import type { PrismaClient, Token } from '@prisma/client'

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/index.js'
import { createOpaqueToken, parseOpaqueToken } from '../utils/token.util.js'

export class TokenService {
  private token

  private jwt

  constructor(_token: PrismaClient['token'], _jwt: JWT) {
    this.token = _token
    this.jwt = _jwt
  }

  generateAuthTokens = async (userId: string) => {
    const accessToken = this.generateAccessToken(userId)
    const refreshToken = await this.generateRefreshToken(userId)

    return { accessToken, refreshToken }
  }

  refreshAuthTokens = async (token: string) => {
    const userId = parseOpaqueToken(token)
    let tokenFound: Token | null

    try {
      tokenFound = await this.token.findUnique({
        where: { userId_token: { userId, token } }
      })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new httpErrors.Unauthorized()
        }
      }

      throw e
    }

    if (!tokenFound || !TokenService.verifyRefreshToken(tokenFound)) {
      throw new httpErrors.Unauthorized()
    }

    const accessToken = this.generateAccessToken(userId)
    const refreshToken = await this.generateRefreshToken(userId, {
      replaceToken: token
    })

    return { accessToken, refreshToken }
  }

  generateAccessToken = (userId: string) => {
    const accessToken = this.jwt.sign(
      { sub: userId, type: 'access' },
      { expiresIn: '30m' }
    )

    return accessToken
  }

  generateRefreshToken = async (
    userId: string,
    { replaceToken }: { replaceToken?: string } = {}
  ) => {
    try {
      const DAY = 1000 * 60 * 60 * 24
      const newRefreshToken = createOpaqueToken(userId)
      const expires = new Date(Date.now() + DAY * 7)
      const newTokenData = { userId, token: newRefreshToken, expires }

      if (replaceToken) {
        await this.token.update({
          where: {
            userId_token: {
              userId,
              token: replaceToken
            }
          },
          data: {
            revokedAt: new Date(),
            replacedByToken: {
              create: newTokenData
            }
          }
        })
      } else {
        await this.token.create({
          data: newTokenData
        })
      }

      return newRefreshToken
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2003' || e.code === 'P2025') {
          throw new httpErrors.Unauthorized()
        }
      }

      throw e
    }
  }

  revokeRefreshToken = async (token: string) => {
    const userId = parseOpaqueToken(token)
    try {
      await this.token.delete({
        where: { userId_token: { userId, token } }
      })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          return
        }
      }

      throw e
    }
  }

  getUserTokens = (userId: string) => this.token.findMany({ where: { userId } })

  static verifyJwt = (req: FastifyRequest) => req.jwtVerify()

  static verifyRefreshToken = ({ replacedBy, revokedAt, expires }: Token) => {
    const isExpired = expires < new Date()
    const isRevoked = revokedAt !== null
    const isReplaced = replacedBy !== null

    return !isExpired && !isRevoked && !isReplaced
  }
}

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars, no-shadow
  interface FastifyInstance {
    tokenService: TokenService
    verifyJwt: () => Promise<void>
  }
}

export default fp(async (app) => {
  const { prisma, jwt } = app
  app.decorate('tokenService', new TokenService(prisma.token, jwt))
  app.decorate('verifyJwt', TokenService.verifyJwt)
})
