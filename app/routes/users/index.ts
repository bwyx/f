import type { FastifyPluginAsync } from 'fastify'

import {
  createUserBody,
  deleteUserParams
} from '../../validations/user.schema.js'

const routes: FastifyPluginAsync = async (app): Promise<void> => {
  const { userController } = app

  app.route({
    method: 'GET',
    url: '/',
    handler: userController.list
  })

  app.route({
    method: 'POST',
    url: '/',
    schema: { body: createUserBody },
    handler: userController.create
  })

  app.route({
    method: 'DELETE',
    url: '/:userId',
    schema: { params: deleteUserParams },
    handler: userController.delete
  })
}

export default routes
