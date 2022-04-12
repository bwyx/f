/* eslint-disable func-names */
import sinon from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import httpErrors from 'http-errors'

import { prismaModel } from '../mocks.js'
import { prismaError } from '../fixtures.js'

import { SessionService } from '../../services/session.service.js'

chai.use(chaiAsPromised)

describe('[Service: Session]', () => {
  const sessionService = new SessionService(prismaModel)

  beforeEach(function () {
    this.session = sinon.mock(prismaModel)
  })

  afterEach(function () {
    this.session.verify()
    this.session.restore()
  })

  const userId = '77976d43-c76e-4b0c-943c-342b0f7d6cc4'
  const nonce = 'WiNcmEgU+0n3GOdf'

  describe('createSession()', () => {
    it('should call `create()` once', async function () {
      this.session.expects('create').once()

      await expect(sessionService.createSession({ userId, nonce })).to.be
        .fulfilled
    })
  })

  describe('updateSession()', () => {
    it('should call `update()` once', async function () {
      this.session.expects('update').once()

      await expect(
        sessionService.updateSession({ userId, nonce, nextNonce: nonce })
      ).to.be.fulfilled
    })

    it('should throw [Unauthorized] if refresh token is not found (nonce mismatch)', async function () {
      this.session.expects('update').throws(prismaError('P2025'))

      await expect(
        sessionService.updateSession({ userId, nonce, nextNonce: nonce })
      ).to.be.rejectedWith(httpErrors.Unauthorized)
    })
  })

  describe('deleteSession()', () => {
    it('should call `delete()` once', async function () {
      this.session.expects('delete').once()

      await expect(sessionService.deleteSession({ userId, nonce })).to.be
        .fulfilled
    })

    it('should not throw if no session record found', async function () {
      this.session.expects('delete').throws(prismaError('P2025'))

      await expect(sessionService.deleteSession({ userId, nonce })).to.be
        .fulfilled
    })
  })
})
