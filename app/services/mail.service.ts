import type { FastifyInstance } from 'fastify'

import { env } from '../config/index.js'

export class MailService {
  private mailer

  constructor(_mailer: FastifyInstance['mailer']) {
    this.mailer = _mailer
  }

  sendVerificationEmail = async (to: string, token: string) => {
    const subject = 'Verify your email'
    const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`
    const text = `Welcome to ${env.APP_NAME}!
    To verify your email, click on this link: ${verificationUrl}
    If you did not create an account, ignore this email.`

    return this.mailer.sendMail({ to, subject, text })
  }
}

export default MailService
