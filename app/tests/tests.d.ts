import type { FastifyInstance } from 'fastify'
import type { SinonMock } from 'sinon'

declare module 'mocha' {
  export interface Context {
    f: FastifyInstance
    jwt: SinonMock
    session: SinonMock
    user: SinonMock
    mail: SinonMock
  }
}
