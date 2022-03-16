import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import fastify from 'fastify'
import autoload from 'fastify-autoload'

import type { FastifyInstance, FastifyServerOptions } from 'fastify'

const __dirname = dirname(fileURLToPath(import.meta.url))

const build = (opts: FastifyServerOptions = {}) => {
  const app: FastifyInstance = fastify(opts)

  app.register(autoload, {
    dir: join(__dirname, 'plugins')
  })

  app.register(autoload, {
    dir: join(__dirname, 'routes'),
    ignorePattern: /.*(test|spec).js/
  })

  return app
}

export default build
