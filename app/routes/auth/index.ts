import type { FastifyPluginAsync } from 'fastify'

import { registerBody, loginBody } from '../../validations/auth.schema.js'

const routes: FastifyPluginAsync = async (app): Promise<void> => {
  const { authController, verifyJwt } = app

  app.route({
    method: 'POST',
    url: '/register',
    schema: { body: registerBody },
    handler: authController.register
  })

  app.route({
    method: 'POST',
    url: '/login',
    schema: { body: loginBody },
    handler: authController.login
  })

  app.route({
    method: 'POST',
    url: '/refresh-tokens',
    onRequest: verifyJwt,
    handler: authController.refreshTokens
  })
}

export default routes
