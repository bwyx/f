import build from './index.js'

import config from './config/index.js'

const app = build({
  logger: {
    level: 'info',
    prettyPrint: false
  }
})

app.listen(config.PORT, (err, address) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
