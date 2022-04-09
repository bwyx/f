import fp from 'fastify-plugin'
import httpErrors from 'http-errors'
import { validate, version } from 'uuid'

import type { JWT } from 'fastify-jwt'
import type { PrismaClient, Token } from '@prisma/client'

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/index.js'
import { createOpaqueToken, parseOpaqueToken } from '../utils/token.util.js'
import { env } from '../config/index.js'

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
    const userId = TokenService.verifyRefreshToken(token)
    let tokenFound: Token | null

    try {
      tokenFound = await this.token.findUnique({
        where: { userId_token: { userId, token } }
      })
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          throw new httpErrors.Unauthorized(
            'Oops! Looks like the user has been deleted.'
          )
        }
      }

      throw e
    }

    if (tokenFound && !TokenService.validateToken(tokenFound)) {
      throw new httpErrors.Unauthorized(
        'You have logged out or your session has expired. Please log in again.'
      )
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
      // A numeric value is interpreted as a seconds count.
      // If you use a string be sure you provide the time units (days, hours, etc.),
      // otherwise milliseconds unit is used by default ("120" is equal to "120ms").
      // https://github.com/fastify/fastify-jwt#sign
      { expiresIn: env.TOKEN_ACCESS_EXPIRATION.toString() }
    )

    return accessToken
  }

  generateRefreshToken = async (
    userId: string,
    { replaceToken }: { replaceToken?: string } = {}
  ) => {
    try {
      const newRefreshToken = createOpaqueToken(userId)
      const expires = Date.now() + env.TOKEN_REFRESH_EXPIRATION
      const newToken = {
        userId,
        token: newRefreshToken,
        expires: new Date(expires)
      }

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
              create: newToken
            }
          }
        })
      } else {
        await this.token.create({
          data: newToken
        })
      }

      return newRefreshToken
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2003' || e.code === 'P2025') {
          throw new httpErrors.Unauthorized(
            'You have logged out or your session has expired. Please log in again.'
          )
        }
      }

      throw e
    }
  }

  revokeRefreshToken = async (token: string) => {
    const userId = TokenService.verifyRefreshToken(token)
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

  static verifyRefreshToken = (token: string) => {
    let userId

    try {
      userId = parseOpaqueToken(token)
    } catch (e) {
      throw new httpErrors.Unauthorized('Invalid refresh token.')
    }

    if (!validate(userId) || version(userId) !== 4) {
      throw new httpErrors.Unauthorized('Invalid refresh token.')
    }

    return userId
  }

  static validateToken = ({ replacedBy, revokedAt, expires }: Token) => {
    const isExpired = expires < new Date()
    const isRevoked = revokedAt !== null
    const isReplaced = replacedBy !== null

    return !isExpired && !isRevoked && !isReplaced
  }
}

export default fp(async (app) => {
  const { prisma, jwt } = app
  app.decorate('tokenService', new TokenService(prisma.token, jwt))
})

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    tokenService: TokenService
  }
}
