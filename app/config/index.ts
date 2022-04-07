import { envSchema } from 'env-schema'

import type { FastifyServerOptions } from 'fastify'
import type { ENV, RawEnv } from '../types'

import { parseTime } from '../utils/time.util.js'

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
      TOKEN_ACCESS_EXPIRATION: { type: 'string', default: '1h' },
      TOKEN_REFRESH_EXPIRATION: { type: 'string', default: '7d' },
      TRUST_PROXY: { type: 'boolean', default: false }
    }
  }
})

const convertTemporalEnv = (): ENV => ({
  ...rawEnv,
  TOKEN_ACCESS_EXPIRATION: parseTime(rawEnv.TOKEN_ACCESS_EXPIRATION),
  TOKEN_REFRESH_EXPIRATION: parseTime(rawEnv.TOKEN_REFRESH_EXPIRATION)
})

export const env = convertTemporalEnv()

export const fastifyConfig: FastifyServerOptions = {
  trustProxy: env.TRUST_PROXY,
  ignoreTrailingSlash: true,
  logger: {
    level: env.APP_DEBUG ? 'debug' : 'info'
  }
}
