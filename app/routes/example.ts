import { FastifyPluginAsync } from 'fastify'

const example: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/example', async (req) => req.query)
}

export default example
