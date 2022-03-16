import { FastifyPluginAsync } from 'fastify'

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/', async (req, rep) => {
    return req.query
  })
}

export default example
