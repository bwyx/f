import isDocker from 'is-docker'

import build from './index.js'

import { fastifyConfig, env } from './config/index.js'

const app = build(fastifyConfig)

if (isDocker()) {
  app.listen(env.APP_PORT, '0.0.0.0')
} else {
  app.listen(env.APP_PORT)
}
