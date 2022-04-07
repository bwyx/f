import type { JWT } from 'fastify-jwt'

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
