import fp from 'fastify-plugin'
import fastifySensible from 'fastify-sensible'

export default fp(async (app) => app.register(fastifySensible))
