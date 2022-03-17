import isDocker from 'is-docker'

import build from './index.js'

import { fastifyConfig, env } from './config/index.js'

const app = build(fastifyConfig)

const start = async () => {
  try {
    if (isDocker()) {
      await app.listen(env.APP_PORT, '0.0.0.0')
    } else {
      await app.listen(env.APP_PORT)
    }
  } catch (err) {
    console.log(err)
    process.exit(1)
  }

  app.blipp()
}

start()
