import type { SinonMock } from 'sinon'

declare module 'mocha' {
  export interface Context {
    jwt: SinonMock
    session: SinonMock
    user: SinonMock
  }
}
