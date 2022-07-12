import cryptoRandomString from 'crypto-random-string'
import httpErrors from 'http-errors'

import type { FastifyJWT, JWT } from 'fastify-jwt'

import { env, TokenTypes } from '../config/index.js'

export class TokenService {
  constructor(private jwt: JWT) {}

  // eslint-disable-next-line class-methods-use-this
  generateNonce = () => cryptoRandomString({ length: 16, type: 'base64' })

  verifyJwt = (token: string, type: TokenTypes) => {
    let payload

    try {
      payload = this.jwt.verify<FastifyJWT['user']>(token)
    } catch (e) {
      if (e instanceof Error) {
        throw new httpErrors.Unauthorized(e.message)
      }

      throw e
    }

    if (payload.type !== type) {
      throw new httpErrors.Unauthorized('Invalid token type')
    }

    return payload
  }

  generateAccessToken = ({
    userId,
    nonce
  }: {
    userId: string
    nonce: string
  }) => {
    const accessToken = this.jwt.sign(
      { sub: userId, type: TokenTypes.ACCESS, jti: nonce },
      { expiresIn: env.EXP_ACCESS }
    )

    return accessToken
  }

  generateVerifyEmailToken = (userId: string) =>
    this.jwt.sign(
      {
        sub: userId,
        type: TokenTypes.VERIFY_EMAIL,
        jti: this.generateNonce()
      },
      { expiresIn: env.EXP_VERIFY_EMAIL }
    )

  generateResetPasswordToken = (userId: string) =>
    this.jwt.sign(
      {
        sub: userId,
        type: TokenTypes.RESET_PASSWORD,
        jti: this.generateNonce()
      },
      { expiresIn: env.EXP_RESET_PASSWORD }
    )
}

export default TokenService
