import fp from 'fastify-plugin'
import cookie, { FastifyCookieOptions } from 'fastify-cookie'

/**
 * A plugin for Fastify that adds support for reading and setting cookies.
 *
 * @see https://github.com/fastify/fastify-cookie
 */
export default fp<FastifyCookieOptions>(async (fastify) => {
  fastify.register(cookie)
})
