import { envSchema } from 'env-schema'

import type { FastifyServerOptions } from 'fastify'
import type { ENV, BaseEnv } from '../types'

import { parseTime } from '../utils/time.util.js'

export enum TokenTypes {
  ACCESS = 'access',
  VERIFY_EMAIL = 'verify_email',
  RESET_PASSWORD = 'reset_password'
}

const baseEnv: BaseEnv = envSchema({
  dotenv: true,
  expandEnv: true,
  schema: {
    type: 'object',
    required: ['APP_KEYS'],
    properties: {
      APP_NAME: { type: 'string', default: 'f' },
      APP_KEYS: { type: 'string' },
      APP_ENV: { type: 'string', default: 'production' },
      APP_PORT: { type: 'number', default: 5000 },
      APP_DEBUG: { type: 'boolean', default: false },
      FRONTEND_DOMAIN: { type: 'string' },
      FRONTEND_URL: { type: 'string' },
      SMTP_HOST: { type: 'string' },
      SMTP_PORT: { type: 'number' },
      SMTP_SECURE: { type: 'boolean', default: true },
      SMTP_USER: { type: 'string' },
      SMTP_PASS: { type: 'string' },
      SMTP_FROM_NAME: { type: 'string', default: 'f' },
      SMTP_FROM_EMAIL: { type: 'string' },
      TRUST_PROXY: { type: 'boolean', default: false },
      EXP_ACCESS: { type: 'string', default: '15m' },
      EXP_REFRESH: { type: 'string', default: '30d' },
      EXP_VERIFY_EMAIL: { type: 'string', default: '5m' },
      EXP_RESET_PASSWORD: { type: 'string', default: '5m' }
    }
  }
})

const processEnv = (env: BaseEnv): ENV => ({
  ...env,
  KEYS: env.APP_KEYS.split(',').map((key) => Buffer.from(key, 'base64')),
  EXP_MS_ACCESS: parseTime(env.EXP_ACCESS),
  EXP_MS_REFRESH: parseTime(env.EXP_REFRESH),
  EXP_MS_VERIFY_EMAIL: parseTime(env.EXP_VERIFY_EMAIL),
  EXP_MS_RESET_PASSWORD: parseTime(env.EXP_RESET_PASSWORD)
})

export const env = processEnv(baseEnv)

export const fastifyConfig: FastifyServerOptions = {
  trustProxy: env.TRUST_PROXY,
  ignoreTrailingSlash: true,
  logger: {
    level: env.APP_DEBUG ? 'debug' : 'info'
  }
}

export const COOKIES = {
  PAYLOAD: `${env.APP_NAME}_user`,
  HEADER_SIGNATURE: `${env.APP_NAME}_token`,
  SESSION: `${env.APP_NAME}_session`
}
