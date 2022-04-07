/* eslint-disable func-names */
import sinon from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import httpErrors from 'http-errors'

import { prismaModel } from '../mocks.js'
import { prismaError } from '../fixtures.js'
import { UserService } from '../../services/user.service.js'

chai.use(chaiAsPromised)

describe('[Service: User]', () => {
  const userService = new UserService(prismaModel)

  beforeEach(function () {
    this.user = sinon.mock(prismaModel)
  })

  afterEach(function () {
    this.user.verify()
    this.user.restore()
  })

  describe('getUnique()', () => {
    it('should call `findUnique()` only and once', async function () {
      this.user.expects('findUnique').once()
      this.user.expects('findFirst').never()
      this.user.expects('findMany').never()

      await userService.getUnique({ where: { id: 'userId' } })
    })
  })

  describe('getFirst()', () => {
    it('should call `findFirst()` only and once', async function () {
      this.user.expects('findFirst').once()
      this.user.expects('findUnique').never()
      this.user.expects('findMany').never()

      await userService.getFirst({ where: { id: 'userId' } })
    })
  })

  describe('query()', () => {
    it('should call `findMany()` only and once', async function () {
      this.user.expects('findMany').once()
      this.user.expects('findUnique').never()
      this.user.expects('findFirst').never()

      await userService.query()
    })
  })

  describe('create()', () => {
    it('should call `create()` only and once', async function () {
      const user = {
        name: 'New User',
        email: 'new@user.com',
        password: 'strongpassword'
      }

      this.user.expects('create').once()
      this.user.expects('findUnique').never()
      this.user.expects('findFirst').never()
      this.user.expects('findMany').never()

      await userService.create(user)
    })

    it('should hash password', async function () {
      const user = {
        name: 'New User',
        email: 'new@user.com',
        password: 'strongpassword'
      }

      const args = sinon.match
        // has passwordHash field
        .hasNested('data.passwordHash')
        // and it's not a plain-text password
        .and(sinon.match((v) => v.data.passwordHash !== user.password))
        // and has no password field
        .and(sinon.match((v) => v.data.password === undefined))

      this.user.expects('create').withArgs(args)

      await userService.create(user)
    })

    it('should throw [BadRequest] if record already exists', async function () {
      const error = prismaError('P2002')

      const user = {
        name: 'Already Exist',
        email: 'already@exist.com',
        password: 'strongpassword'
      }

      this.user.expects('create').once().throws(error)

      await expect(userService.create(user)).to.be.rejectedWith(
        httpErrors.BadRequest
      )
    })
  })

  describe('remove()', () => {
    it('should call `delete()` only and once', async function () {
      this.user.expects('delete').once()
      this.user.expects('findUnique').never()
      this.user.expects('findFirst').never()
      this.user.expects('findMany').never()

      await userService.remove('userId')
    })

    it('should not throws if no user record found', async function () {
      const error = prismaError('P2025')

      this.user.expects('delete').throws(error)

      await expect(
        userService.remove('nonExistUserId')
      ).to.be.fulfilled.and.eventually.equal(null)
    })
  })
})
