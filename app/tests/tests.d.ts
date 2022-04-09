import type { SinonMock } from 'sinon'

declare module 'mocha' {
  export interface Context {
    user: SinonMock
    device: SinonMock
    token: SinonMock
    jwt: SinonMock
  }
}
