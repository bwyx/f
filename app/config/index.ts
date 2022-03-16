import { envSchema } from 'env-schema'

import type { ENV } from 'types'

const env: ENV = envSchema({
  dotenv: { path: '.env.local' },
  schema: {
    type: 'object',
    properties: {
      PORT: {
        type: 'number',
        default: 3000
      }
    }
  }
})

export default env
