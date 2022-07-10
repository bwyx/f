import crypto from 'crypto'
import cryptoRandomString from 'crypto-random-string'
import httpErrors from 'http-errors'

import type { FastifyJWT, JWT } from 'fastify-jwt'

import { env, TokenTypes } from '../config/index.js'

const key32 = (key: string) => key.substring(0, 32)

export class TokenService {
  private algorithm = 'aes-256-ctr'

  constructor(private jwt: JWT, private key = env.APP_KEY) {}

  // eslint-disable-next-line class-methods-use-this
  generateNonce = () => cryptoRandomString({ length: 16, type: 'base64' })

  encrypt = (text: string, iv = this.generateNonce()) => {
    const cipher = crypto.createCipheriv(this.algorithm, key32(this.key), iv)

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()])

    return { iv, content: encrypted.toString('base64') }
  }

  decrypt = (hash: { iv: string; content: string }) => {
    const iv = Buffer.from(hash.iv)
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key32(this.key),
      iv
    )

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(hash.content, 'base64')),
      decipher.final()
    ])

    return decrypted.toString()
  }

  createSignature = (payload: string) => {
    const hmac = crypto.createHmac('sha256', this.key)
    hmac.update(payload)

    return hmac.digest('base64')
  }

  verifySignature = (payload: string, signature: string) => {
    const authenticSignature = this.createSignature(payload)
    if (authenticSignature.length !== signature.length) {
      return false
    }

    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(authenticSignature),
      Buffer.from(signature)
    )

    return isAuthentic
  }

  createOpaqueToken = (payload: string, nonce: string) => {
    // convert payload to base64 to disguise . (dot) and other symbols
    const base64Payload = Buffer.from(payload).toString('base64')

    // sign payload
    const signature = this.createSignature(base64Payload)
    const signedPayload = `${base64Payload}.${signature}`

    // encrypt signed payload
    const { content, iv } = this.encrypt(signedPayload, nonce)
    return `${content}.${iv}`
  }

  parseOpaqueToken = (token: string) => {
    // decrypt
    const [content, iv] = token.split('.')
    const signedPayload = this.decrypt({ content, iv })

    // verify signature
    const [base64Payload, signature] = signedPayload.split('.')
    if (!this.verifySignature(base64Payload, signature)) {
      throw new httpErrors.Unauthorized('Invalid token signature')
    }

    // return parsed utf8 payload
    return Buffer.from(base64Payload, 'base64').toString('utf-8')
  }

  generateRefreshToken = ({
    sessionId,
    nonce
  }: {
    sessionId: string
    nonce: string
  }) => {
    const nextNonce = this.generateNonce()
    const payload = `${sessionId}.${nextNonce}`

    return this.createOpaqueToken(payload, nonce)
  }

  verifyRefreshToken = (refreshToken: string) => {
    try {
      const tokenNonce = refreshToken.split('.')[1]
      const payload = this.parseOpaqueToken(refreshToken)

      const [sessionId, nextNonce] = payload.split('.')

      return { sessionId, nextNonce, tokenNonce }
    } catch (e) {
      throw new httpErrors.Unauthorized('Invalid refresh token')
    }
  }

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
