import { join } from 'path'

import fastify from 'fastify'
import autoload from 'fastify-autoload'

import type { FastifyInstance, FastifyServerOptions } from 'fastify'

const build = (opts: FastifyServerOptions = {}) => {
  const app: FastifyInstance = fastify(opts)

  app.register(autoload, {
    dir: join(__dirname, 'plugins')
  })

  app.register(autoload, {
    dir: join(__dirname, 'routes')
  })

  return app
}

export default build
