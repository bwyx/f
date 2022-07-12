/* eslint-disable func-names */
import sinon from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { jwt } from '../mocks.js'
import { TokenService } from '../../services/token.service.js'

chai.use(chaiAsPromised)

describe('[Service: Token]', () => {
  const tokenService = new TokenService(jwt)

  beforeEach(function () {
    this.jwt = sinon.mock(jwt)
  })

  afterEach(function () {
    this.jwt.verify()
    this.jwt.restore()
  })

  const UUID = '77976d43-c76e-4b0c-943c-342b0f7d6cc4'
  const NONCE = 'pWRHSFiGmlMotmDM'

  describe('generateAccessToken()', () => {
    it('should create a new jwt token', function () {
      this.jwt.expects('sign').once().returns('someRandomJWTToken')

      expect(
        tokenService.generateAccessToken({ userId: UUID, nonce: NONCE })
      ).to.be.a('string')
    })
  })
})
