import { FastifyPluginAsync } from 'fastify'

const example: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async () => 'hello world')
}

export default example
