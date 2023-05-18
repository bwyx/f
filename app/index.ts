import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import fastify from 'fastify'
import autoload from 'fastify-autoload'
import blipp from 'fastify-blipp'
import helmet from '@fastify/helmet'

import type { FastifyInstance, FastifyServerOptions } from 'fastify'

import services from './services/index.js'
import controllers from './controllers/index.js'

const dir = dirname(fileURLToPath(import.meta.url))

const build = (opts: FastifyServerOptions = {}) => {
  const f: FastifyInstance = fastify(opts)

  f.register(helmet)

  f.register(blipp)

  f.register(autoload, {
    dir: join(dir, 'plugins')
  })

  f.register(services)

  f.register(controllers)

  f.register(autoload, {
    dir: join(dir, 'routes')
  })

  return f
}

export default build
