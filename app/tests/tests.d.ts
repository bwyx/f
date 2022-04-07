import type { SinonMock } from 'sinon'

declare module 'mocha' {
  export interface Context {
    user: SinonMock
    token: SinonMock
    jwt: SinonMock
  }
}
