import { envSchema } from 'env-schema'

import type { FastifyServerOptions } from 'fastify'
import type { ENV, RawEnv } from '../types'

import { parseTime } from '../utils/time.util.js'

export * as tokenTypes from './tokenTypes.js'

const rawEnv: RawEnv = envSchema({
  dotenv: true,
  expandEnv: true,
  schema: {
    type: 'object',
    required: ['APP_KEY'],
    properties: {
      APP_NAME: { type: 'string', default: 'f' },
      APP_KEY: { type: 'string' },
      APP_ENV: { type: 'string', default: 'production' },
      APP_PORT: { type: 'number', default: 5000 },
      APP_DEBUG: { type: 'boolean', default: false },
      FRONTEND_DOMAIN: { type: 'string' },
      FRONTEND_URL: { type: 'string' },
      REDIS_HOST: { type: 'string' },
      REDIS_PORT: { type: 'number', default: 6379 },
      REDIS_PASSWORD: { type: 'string' },
      SMTP_HOST: { type: 'string' },
      SMTP_PORT: { type: 'number' },
      SMTP_SECURE: { type: 'boolean', default: true },
      SMTP_USER: { type: 'string' },
      SMTP_PASS: { type: 'string' },
      SMTP_FROM_NAME: { type: 'string', default: 'f' },
      SMTP_FROM_EMAIL: { type: 'string' },
      TOKEN_ACCESS_EXPIRATION: { type: 'string', default: '1h' },
      TOKEN_REFRESH_EXPIRATION: { type: 'string', default: '7d' },
      TOKEN_VERIFY_EMAIL_EXPIRATION: { type: 'string', default: '5m' },
      TRUST_PROXY: { type: 'boolean', default: false }
    }
  }
})

const convertTemporalEnv = (): ENV => ({
  ...rawEnv,
  TOKEN_ACCESS_EXPIRATION: parseTime(rawEnv.TOKEN_ACCESS_EXPIRATION),
  TOKEN_REFRESH_EXPIRATION: parseTime(rawEnv.TOKEN_REFRESH_EXPIRATION),
  TOKEN_VERIFY_EMAIL_EXPIRATION: parseTime(rawEnv.TOKEN_VERIFY_EMAIL_EXPIRATION)
})

export const env = convertTemporalEnv()

export const fastifyConfig: FastifyServerOptions = {
  trustProxy: env.TRUST_PROXY,
  ignoreTrailingSlash: true,
  logger: {
    level: env.APP_DEBUG ? 'debug' : 'info'
  }
}
