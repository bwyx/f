import crypto from 'crypto'
import cryptoRandomString from 'crypto-random-string'
import httpErrors from 'http-errors'

import { env } from '../config/index.js'

const algorithm = 'aes-256-ctr'
const key = env.APP_KEY.substring(0, 32)

export const encrypt = (text: string) => {
  const iv = cryptoRandomString({ length: 16, type: 'base64' })
  const cipher = crypto.createCipheriv(algorithm, key, iv)

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()])

  return { iv, content: encrypted.toString('base64') }
}

export const decrypt = (hash: ReturnType<typeof encrypt>) => {
  const iv = Buffer.from(hash.iv)
  const decipher = crypto.createDecipheriv(algorithm, key, iv)

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, 'base64')),
    decipher.final()
  ])

  return decrypted.toString()
}

export const createOpaqueToken = (userId: string) => {
  const { content, iv } = encrypt(userId)
  return `${content}.${iv}`
}

export const verifyOpaqueToken = (token: string) => {
  const [content, iv] = token.split('.')

  try {
    return decrypt({ content, iv })
  } catch (e) {
    throw new httpErrors.BadRequest('Invalid refresh token')
  }
}
