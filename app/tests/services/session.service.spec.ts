/* eslint-disable func-names */
import sinon from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import type { Session } from '@prisma/client'

import { prismaModel } from '../mocks.js'

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

  const session: Session = {
    id: UUID,
    userId: UUID,
    createdAt: new Date(),
    nonce: NONCE,
    expires: new Date()
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

      this.session.expects('findMany').once().returns(sessions)

      await expect(
        sessionService.listSessions({ userId: UUID })
      ).to.eventually.equal(sessions)
    })
  })

  describe('updateSession()', () => {
    it('should update a session', async function () {
      this.session.expects('findUnique').once().returns(session)
      this.session.expects('update').once().returns(session)

      await expect(
        sessionService.updateSession({
          sessionId: UUID,
          nonce: NONCE,
          nextNonce: NONCE
        })
      ).to.eventually.equal(session)
    })
  })

  describe('deleteSession()', () => {
    it('should delete a session', async function () {
      this.session.expects('delete').once().returns(session)

      await expect(
        sessionService.deleteSession({ userId: UUID, nonce: NONCE })
      ).to.eventually.equal(session)
    })
  })
})
