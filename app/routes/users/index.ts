import { FastifyPluginAsync } from 'fastify'

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/', async (req, rep) => {
    const users = await fastify.userController.query()

    return users
  })
}

export default example
