import type { JWT } from 'fastify-jwt'
import type { Transporter } from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport.js'

export const prismaModel = {
  findUnique: () => <any>{},
  findFirst: () => <any>{},
  findMany: () => <any>{},
  create: () => <any>{},
  createMany: () => <any>{},
  delete: () => <any>{},
  update: () => <any>{},
  deleteMany: () => <any>{},
  updateMany: () => <any>{},
  upsert: () => <any>{},
  count: () => <any>{},
  aggregate: () => <any>{},
  groupBy: () => <any>{}
}

export const jwt: JWT = {
  sign: () => <any>{},
  verify: () => <any>{},
  decode: () => <any>{},
  options: {
    decode: {},
    sign: {},
    verify: {}
  }
}

export const mailTransport: Partial<
  Transporter<SMTPTransport.SentMessageInfo>
> = {
  sendMail: () => <any>{}
}
