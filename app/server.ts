import isDocker from 'is-docker'

import build from './index.js'

import { fastifyConfig, env } from './config/index.js'

const f = build(fastifyConfig)

const start = async () => {
  try {
    if (isDocker()) {
      await f.listen(env.APP_PORT, '0.0.0.0')
    } else {
      await f.listen(env.APP_PORT)
    }
  } catch (err) {
    f.log.fatal(err)
    process.exit(1)
  }

  f.blipp()
}

start()
