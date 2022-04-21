import crypto from 'crypto'
import cryptoRandomString from 'crypto-random-string'
import httpErrors from 'http-errors'

import type { JWT } from 'fastify-jwt'
import type { Redis } from 'ioredis'

import { env, tokenTypes } from '../config/index.js'

const key32 = (key: string) => key.substring(0, 32)

export class TokenService {
  private jwt

  private redis

  private key

  private algorithm = 'aes-256-ctr'

  constructor(_jwt: JWT, _redis: Redis, _key = env.APP_KEY) {
    this.jwt = _jwt
    this.redis = _redis
    this.key = _key
  }

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

  generateAccessToken = ({
    userId,
    nonce
  }: {
    userId: string
    nonce: string
  }) => {
    const accessToken = this.jwt.sign(
      { sub: userId, type: tokenTypes.ACCESS, jti: nonce },
      // A numeric value is interpreted as a seconds count.
      // If you use a string be sure you provide the time units (days, hours, etc.),
      // otherwise milliseconds unit is used by default ("120" is equal to "120ms").
      // https://github.com/fastify/fastify-jwt#sign
      { expiresIn: env.TOKEN_ACCESS_EXPIRATION.toString() }
    )

    return accessToken
  }

  generateVerifyEmailToken = (userId: string) =>
    this.jwt.sign(
      { sub: userId, type: tokenTypes.VERIFY_EMAIL, jti: this.generateNonce() },
      { expiresIn: env.TOKEN_VERIFY_EMAIL_EXPIRATION.toString() }
    )

  checkThenBlacklistToken = async (
    userId: string,
    jti: string,
    tokenExpires: number
  ) => {
    const BLACKLISTED = '1'
    const key = `blacklist:${userId}:${jti}`

    if ((await this.redis.get(key)) !== null) {
      throw httpErrors(401, 'Authorization token expired')
    }

    const now = Math.floor(Date.now() / 1000)
    const ttl = tokenExpires - now + 5 // 5 plus seconds to be sure
    return this.redis.setex(key, ttl, BLACKLISTED)
  }
}

export default TokenService
