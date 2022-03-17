import { envSchema } from 'env-schema'

import type { FastifyServerOptions } from 'fastify'
import type { ENV } from '../types'

export const env: ENV = envSchema({
  dotenv: true,
  expandEnv: true,
  schema: {
    type: 'object',
    properties: {
      APP_NAME: { type: 'string', default: 'f' },
      APP_ENV: { type: 'string', default: 'production' },
      APP_PORT: { type: 'number', default: 5000 },
      APP_DEBUG: { type: 'boolean', default: false },
      TRUST_PROXY: { type: 'boolean', default: false }
    }
  }
})

export const fastifyConfig: FastifyServerOptions = {
  trustProxy: env.TRUST_PROXY,
  ignoreTrailingSlash: true,
  logger: {
    level: env.APP_DEBUG ? 'debug' : 'info'
  }
}
