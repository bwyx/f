import { FastifyPluginAsync } from 'fastify'

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/example', async (req, rep) => {
    return req.query
  })
}

export default example
