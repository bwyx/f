import fp from 'fastify-plugin'
import Redis from 'ioredis'

import { env } from '../config/index.js'

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    redis: Redis
  }
}

export default fp(async (f) => {
  const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD
  })

  f.decorate('redis', redis)
  f.addHook('onClose', async (self) => self.redis.quit())
})
