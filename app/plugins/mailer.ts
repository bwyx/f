import fp from 'fastify-plugin'
import { createTransport, Transporter } from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

import { env } from '../config/index.js'

declare module 'fastify' {
  interface FastifyInstance {
    mailer: Transporter<SMTPTransport.SentMessageInfo>
  }
}

export default fp(async (server) => {
  const options: SMTPTransport.Options = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  }

  const defaults: SMTPTransport.Options = {
    from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`
  }

  const transport = createTransport(options, defaults)

  server.decorate('mailer', transport)
})
