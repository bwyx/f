/* eslint-disable func-names */
import sinon from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import httpErrors from 'http-errors'

import { prismaModel, jwt } from '../mocks.js'
import { prismaError } from '../fixtures.js'
import { TokenModule } from '../../modules/token.module.js'

import { SessionService } from '../../services/session.service.js'

chai.use(chaiAsPromised)

describe('[Service: Session]', () => {
  const tokenModule = new TokenModule(jwt)
  const sessionService = new SessionService(prismaModel, tokenModule)

  beforeEach(function () {
    this.session = sinon.mock(prismaModel)
    this.tokenModule = sinon.mock(tokenModule)
  })

  afterEach(function () {
    this.session.verify()
    this.session.restore()
    this.tokenModule.verify()
    this.tokenModule.restore()
  })

  const userId = '77976d43-c76e-4b0c-943c-342b0f7d6cc4'

  describe('createSession()', () => {
    it('should call `create()` once', async function () {
      this.session.expects('create').once()

      await expect(sessionService.createSession(userId)).to.be.fulfilled
    })
  })

  describe('refreshSession()', () => {
    it('should call `update()` once', async function () {
      // valid refresh token
      this.tokenModule.expects('verifyRefreshToken').once().returns(true)

      this.session.expects('update').once()

      await expect(sessionService.refreshSession('validRefreshToken')).to.be
        .fulfilled
    })

    it('should throw [Unauthorized] if refresh token is not found (nonce mismatch)', async function () {
      // valid refresh token
      this.tokenModule.expects('verifyRefreshToken').once().returns(true)

      this.session.expects('update').throws(prismaError('P2025'))

      await expect(
        sessionService.refreshSession('invalidRefreshToken')
      ).to.be.rejectedWith(httpErrors.Unauthorized)
    })
  })
})
