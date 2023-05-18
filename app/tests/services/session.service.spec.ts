/* eslint-disable func-names */
import sinon from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import httpErrors from 'http-errors'

import type { Session } from '@prisma/client'

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

  const UUID = '77976d43-c76e-4b0c-943c-342b0f7d6cc4'
  const NONCE = 'WiNcmEgU+0n3GOdf'
  const OLD_INVALID_NONCE = 'o1DInv4l1d-nO7c3'
  const NOW = Date.now()
  const ONE_SECOND = 1000

  const session: Session = {
    id: UUID,
    userId: UUID,
    createdAt: new Date(NOW - ONE_SECOND),
    nonce: NONCE,
    expires: new Date(NOW + ONE_SECOND)
  }

  describe('createSession()', () => {
    it('should create a new session', async function () {
      this.session.expects('create').once().returns(session)

      await expect(
        sessionService.createSession({ userId: UUID, nonce: NONCE })
      ).to.eventually.equal(session)
    })
  })

  describe('listSessions()', () => {
    it('should list sessions', async function () {
      const sessions: Session[] = [session, session]

      this.session.expects('findMany').once().resolves(sessions)

      await expect(
        sessionService.listSessions({ userId: UUID })
      ).to.be.fulfilled.and.eventually.equal(sessions)
    })
  })

  describe('refreshSession()', () => {
    it('should refresh a session', async function () {
      this.session.expects('findUnique').once().resolves(session)
      this.session.expects('update').once().resolves(session)

      await expect(
        sessionService.refreshSession({
          sessionId: UUID,
          nonce: NONCE,
          nextNonce: NONCE
        })
      ).to.be.fulfilled.and.eventually.equal(session)
    })

    it('should not refresh the session if no session record is found', async function () {
      this.session.expects('findUnique').once().resolves(null)
      this.session.expects('update').never()

      await expect(
        sessionService.refreshSession({
          sessionId: UUID,
          nonce: NONCE,
          nextNonce: NONCE
        })
      ).to.be.rejectedWith(httpErrors.Unauthorized)
    })

    it('should not refresh the session if the nonce is not the same as in the database', async function () {
      this.session.expects('findUnique').once().resolves(session)
      this.session.expects('update').never()

      await expect(
        sessionService.refreshSession({
          sessionId: UUID,
          nonce: OLD_INVALID_NONCE,
          nextNonce: NONCE
        })
      ).to.be.rejectedWith(httpErrors.Unauthorized)
    })

    it('should delete the session if the nonce is not the same as in the database', async function () {
      this.session.expects('findUnique').once().resolves(session)
      this.session.expects('delete').once().resolves(session)

      await expect(
        sessionService.refreshSession({
          sessionId: UUID,
          nonce: OLD_INVALID_NONCE,
          nextNonce: NONCE
        })
      ).to.be.rejectedWith(httpErrors.Unauthorized)
    })

    it('should not refresh the session if it has expired', async function () {
      const expiredSession = {
        ...session,
        expires: new Date(Date.now() - ONE_SECOND)
      }

      this.session.expects('findUnique').once().resolves(expiredSession)
      this.session.expects('update').never()

      await expect(
        sessionService.refreshSession({
          sessionId: UUID,
          nonce: NONCE,
          nextNonce: NONCE
        })
      ).to.be.rejectedWith(httpErrors.Unauthorized)
    })
  })

  describe('deleteSessionById()', () => {
    it('should delete a session', async function () {
      this.session.expects('delete').once().resolves(session)

      await expect(sessionService.deleteSessionById(UUID)).to.eventually.equal(
        session
      )
    })

    it('should not throw an error if no session record is found', async function () {
      this.session.expects('delete').once().rejects(prismaError('P2025'))

      await expect(
        sessionService.deleteSessionById(UUID)
      ).to.be.fulfilled.and.eventually.equal(null)
    })
  })
})
