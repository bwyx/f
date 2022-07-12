import type { FastifyPluginAsync } from 'fastify'

import authSchema from '../../validations/auth.schema.js'

const routes: FastifyPluginAsync = async (f) => {
  const { authenticate } = f
  const { auth } = f.controllers

  f.route({
    method: 'POST',
    url: '/register',
    schema: authSchema.register,
    handler: auth.register
  })

  f.route({
    method: 'POST',
    url: '/login',
    schema: authSchema.login,
    handler: auth.login
  })

  f.route({
    method: 'POST',
    url: '/logout',
    onRequest: authenticate({ ignoreExpiration: true }),
    handler: auth.logout
  })

  f.route({
    method: 'GET',
    url: '/sessions',
    schema: authSchema.sessions,
    onRequest: authenticate(),
    handler: auth.getSessions
  })

  f.route({
    method: 'POST',
    url: '/refresh-tokens',
    onRequest: authenticate({ ignoreExpiration: true }),
    handler: auth.refreshTokens
  })

  f.route({
    method: 'POST',
    url: '/send-verification-email',
    onRequest: authenticate(),
    handler: auth.sendVerificationEmail
  })

  f.route({
    method: 'POST',
    url: '/verify-email',
    schema: authSchema.verifyEmail,
    handler: auth.verifyEmail
  })

  f.route({
    method: 'POST',
    url: '/forgot-password',
    schema: authSchema.forgotPassword,
    handler: auth.sendResetPasswordEmail
  })

  f.route({
    method: 'POST',
    url: '/reset-password',
    schema: authSchema.resetPassword,
    handler: auth.resetPassword
  })
}

export default routes
