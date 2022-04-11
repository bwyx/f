import type { SinonMock } from 'sinon'

declare module 'mocha' {
  export interface Context {
    jwt: SinonMock
    session: SinonMock
    tokenModule: SinonMock
    user: SinonMock
  }
}
