import fp from 'fastify-plugin'

import controllers from '../controllers/index.js'

type Controllers = {
  [key in keyof typeof controllers]: ReturnType<typeof controllers[key]>
}

declare module 'fastify' {
  export interface FastifyInstance extends Controllers {}
}

export default fp(async (fastify) => {
  const controllersName = Object.keys(controllers) as (keyof Controllers)[]

  controllersName.forEach((name) => {
    fastify.decorate(name, controllers[name](fastify.prisma))
  })
})
