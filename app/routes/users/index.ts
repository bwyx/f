import type { FastifyPluginAsync } from 'fastify'

import {
  createUserBody,
  deleteUserParams
} from '../../validations/user.schema.js'

const routes: FastifyPluginAsync = async (f) => {
  const { user } = f.controllers

  f.route({
    method: 'GET',
    url: '/',
    handler: user.list
  })

  f.route({
    method: 'POST',
    url: '/',
    schema: { body: createUserBody },
    handler: user.create
  })

  f.route({
    method: 'DELETE',
    url: '/:userId',
    schema: { params: deleteUserParams },
    handler: user.delete
  })
}

export default routes
