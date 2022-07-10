import type { FastifyPluginAsync } from 'fastify'

import userSchema from '../../validations/user.schema.js'

const routes: FastifyPluginAsync = async (f) => {
  const { user } = f.controllers

  f.route({
    method: 'GET',
    url: '/',
    schema: userSchema.list,
    handler: user.list
  })

  f.route({
    method: 'POST',
    url: '/',
    schema: userSchema.create,
    handler: user.create
  })

  f.route({
    method: 'DELETE',
    url: '/:userId',
    schema: userSchema.deleteUser,
    handler: user.delete
  })
}

export default routes
