/* eslint-disable func-names */
import sinon from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import httpErrors from 'http-errors'

import type { Token } from '@prisma/client'

import { prismaModel, jwt } from '../mocks.js'
import { prismaError } from '../fixtures.js'
import { TokenService } from '../../services/token.service.js'

chai.use(chaiAsPromised)

describe('[Service: Token]', () => {
  const tokenService = new TokenService(prismaModel, jwt)

  beforeEach(function () {
    this.token = sinon.mock(prismaModel)
    this.jwt = sinon.mock(jwt)
  })

  afterEach(function () {
    this.token.verify()
    this.token.restore()
    this.jwt.verify()
    this.jwt.restore()
  })

  const userId = '4508dec3-0b0a-40b8-8ba7-77eff6e50dbb'
  const deviceId = '0763edfc-b1fd-46f2-bd2e-1968cfb4685e'
  const validRefreshToken = `BLoPuBmb2MvIgeh5EQNzaYNb2c8Gm7r+t9L2MG+GaXfvwgXH.eh/9kq16NH7Cuwqy`
  const invalidRefreshToken = `invalidRefreshToken`

  describe('generateAccessToken()', () => {
    it('should call `jwt.sign()` once', function () {
      this.jwt.expects('sign').once()
      tokenService.generateAccessToken(userId)
    })
  })

  describe('generateRefreshToken()', () => {
    it('should call `create()` once', async function () {
      this.token.expects('create').once()
      this.token.expects('update').never()

      await expect(tokenService.generateRefreshToken({ userId, deviceId })).to
        .be.eventually.fulfilled
    })

    it('should call `update()` once when replacing an old token', async function () {
      this.token.expects('update').once()
      this.token.expects('create').never()

      await expect(
        tokenService.generateRefreshToken({
          userId,
          deviceId,
          replaceToken: 'old_token'
        })
      ).to.be.eventually.fulfilled
    })

    it('should throw [Unauthorized] if related user record is not found', async function () {
      const error = prismaError('P2003')
      this.token.expects('create').throws(error)

      await expect(
        tokenService.generateRefreshToken({
          userId: 'nonExistUserId',
          deviceId
        })
      ).to.be.rejectedWith(httpErrors.Unauthorized)
    })

    it('should throw [Unauthorized] if the token that was to be replaced is not found', async function () {
      const error = prismaError('P2025')
      this.token.expects('update').throws(error)

      await expect(
        tokenService.generateRefreshToken({
          userId,
          deviceId,
          replaceToken: 'nonExistToken'
        })
      ).to.be.rejectedWith(httpErrors.Unauthorized)
    })
  })

  describe('refreshAuthTokens()', () => {
    const ONE_HOUR = 60 * 60 * 1000

    const tokenData = {
      id: '6c92d1b9-bc51-40f6-9a78-fb1e4d7fa976',
      token: validRefreshToken,
      userId,
      deviceId
    }

    const activeToken: Token = {
      ...tokenData,
      expires: new Date(Date.now() + ONE_HOUR),
      createdAt: new Date(Date.now() - ONE_HOUR * 2),
      revokedAt: null,
      replacedBy: null
    }

    const revokedToken: Token = {
      ...tokenData,
      expires: new Date(Date.now() - ONE_HOUR),
      createdAt: new Date(Date.now() - ONE_HOUR * 2),
      revokedAt: new Date(Date.now() - ONE_HOUR),
      replacedBy: 'd38edbe9-f6a4-4ffd-be11-118c29fcf81a'
    }

    it('should create a new token replacing the old one', async function () {
      this.token.expects('findUnique').once().returns(activeToken)
      this.token.expects('update').once()

      await expect(tokenService.refreshAuthTokens(validRefreshToken)).to.be
        .fulfilled
    })

    it('should throw [Unauthorized] if the provided refresh token is already revoked', async function () {
      this.token.expects('findUnique').once().returns(revokedToken)
      this.token.expects('update').never()

      await expect(
        tokenService.refreshAuthTokens(validRefreshToken)
      ).to.be.rejectedWith(httpErrors.Unauthorized)
    })
  })

  describe('revokeRefreshToken()', () => {
    it('should call `delete()` only and once', async function () {
      this.token.expects('delete').once()
      this.token.expects('findUnique').never()
      this.token.expects('findFirst').never()
      this.token.expects('findMany').never()

      await expect(tokenService.revokeRefreshToken(validRefreshToken)).to.be
        .eventually.fulfilled
    })

    it('should throw [Unauthorized] if token is invalid', async () => {
      await expect(
        tokenService.revokeRefreshToken(invalidRefreshToken)
      ).to.be.rejectedWith(httpErrors.Unauthorized)
    })

    it('should not throw if no token record is found', async function () {
      this.token.expects('delete').throws(prismaError('P2025'))

      await expect(tokenService.revokeRefreshToken(validRefreshToken)).to.be
        .eventually.fulfilled
    })
  })
})
