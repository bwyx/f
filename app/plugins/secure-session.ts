import fp from 'fastify-plugin'
import secureSession, {
  SecureSessionPluginOptions
} from '@fastify/secure-session'
import { env, COOKIES } from '../config/index.js'

/**
 * Create a secure stateless cookie session for Fastify,
 * based on libsodium's Secret Key Box Encryption and @fastify/cookie.
 *
 * @see https://github.com/fastify/fastify-secure-session
 */

export default fp<SecureSessionPluginOptions>(async (fastify) => {
  fastify.register(secureSession, {
    cookieName: COOKIES.SESSION,
    key: env.KEYS
  })
})

declare module '@fastify/secure-session' {
  interface SessionData {
    sessionId: string
  }
}
