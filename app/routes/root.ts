import { FastifyPluginAsync } from 'fastify'

const routes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async () => 'hello world')
}

export default routes
