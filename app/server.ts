import isDocker from 'is-docker'

import build from './index.js'

import { fastifyConfig, env } from './config/index.js'

const f = build(fastifyConfig)

const start = async () => {
  try {
    if (isDocker()) {
      await f.listen({ port: env.APP_PORT, host: '0.0.0.0' })
    } else {
      await f.listen({ port: env.APP_PORT })
    }
  } catch (err) {
    f.log.fatal(err)
    process.exit(1)
  }

  f.blipp()
}

start()
