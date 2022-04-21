import type { FastifyPluginAsync } from 'fastify'

import { registerBody, loginBody } from '../../validations/auth.schema.js'
import { ACCESS, VERIFY_EMAIL } from '../../config/tokenTypes.js'

const routes: FastifyPluginAsync = async (f) => {
  const { verifyJwt } = f
  const { auth } = f.controllers

  f.route({
    method: 'POST',
    url: '/register',
    schema: { body: registerBody },
    handler: auth.register
  })

  f.route({
    method: 'POST',
    url: '/login',
    schema: { body: loginBody },
    handler: auth.login
  })

  f.route({
    method: 'POST',
    url: '/logout',
    handler: auth.logout
  })

  f.route({
    method: 'GET',
    url: '/sessions',
    onRequest: verifyJwt(ACCESS),
    handler: auth.getSessions
  })

  f.route({
    method: 'POST',
    url: '/refresh-tokens',
    handler: auth.refreshTokens
  })

  f.route({
    method: 'POST',
    url: '/send-verification-email',
    onRequest: verifyJwt(ACCESS),
    handler: auth.sendVerificationEmail
  })

  f.route({
    method: 'POST',
    url: '/verify-email',
    onRequest: verifyJwt(VERIFY_EMAIL),
    handler: auth.verifyEmail
  })
}

export default routes
