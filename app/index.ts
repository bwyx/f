import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import fastify from 'fastify'
import autoload from 'fastify-autoload'
import blipp from 'fastify-blipp'

import type { FastifyInstance, FastifyServerOptions } from 'fastify'

const dir = dirname(fileURLToPath(import.meta.url))

const build = (opts: FastifyServerOptions = {}) => {
  const app: FastifyInstance = fastify(opts)

  app.register(blipp)

  app.register(autoload, {
    dir: join(dir, 'plugins')
  })

  app.register(autoload, {
    dir: join(dir, 'services'),
    ignorePattern: /.*(test|spec).js/
  })

  app.register(autoload, {
    dir: join(dir, 'controllers'),
    ignorePattern: /.*(test|spec).js/
  })

  app.register(autoload, {
    dir: join(dir, 'routes'),
    ignorePattern: /.*(test|spec).js/
  })

  return app
}

export default build
