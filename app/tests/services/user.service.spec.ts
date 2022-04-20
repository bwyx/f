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

  const user = {
    name: 'John Doe',
    email: 'john@doe.com',
    password: 'strongpassword'
  }

  describe('getUserByEmail()', () => {
    it('should get a user by its email', async function () {
      this.user.expects('findUnique').once().resolves()

      await expect(userService.getUserByEmail(user.email)).to.be.fulfilled
    })

    it('should get a user by its email with options', async function () {
      this.user.expects('findUnique').once().resolves()

      await expect(
        userService.getUserByEmail(user.email, {
          select: {
            id: false
          }
        })
      ).to.be.fulfilled
    })
  })

  describe('getUserById()', () => {
    const userId = '77976d43-c76e-4b0c-943c-342b0f7d6cc4'

    it('should get a user by its id', async function () {
      this.user.expects('findUnique').once().resolves()

      await expect(userService.getUserById(userId)).to.be.fulfilled
    })

    it('should get a user by its id with options', async function () {
      this.user.expects('findUnique').once().resolves()

      await expect(
        userService.getUserById(userId, {
          select: { id: false }
        })
      ).to.be.fulfilled
    })
  })

  describe('updateUserById()', () => {
    const userId = '77976d43-c76e-4b0c-943c-342b0f7d6cc4'

    it('should update a user by its id', async function () {
      this.user.expects('update').once().resolves()

      await expect(
        userService.updateUserById(userId, {
          data: { name: user.name }
        })
      ).to.be.fulfilled
    })

    it('should update a user by its id with options', async function () {
      this.user.expects('update').once().resolves()

      await expect(
        userService.updateUserById(userId, {
          data: { name: user.name },
          select: { id: false }
        })
      ).to.be.fulfilled
    })
  })

  describe('createUser()', () => {
    it('should create a new user', async function () {
      this.user.expects('create').once().resolves()

      await expect(
        userService.createUser({
          name: user.name,
          email: user.email,
          password: user.password
        })
      ).to.be.fulfilled
    })

    it('should hash user password', async function () {
      const args = sinon.match
        // has passwordHash field
        .hasNested('data.passwordHash')
        // and it's not a plain-text password
        .and(sinon.match((v) => v.data.passwordHash !== user.password))
        // and has no password field
        .and(sinon.match((v) => v.data.password === undefined))

      this.user.expects('create').withArgs(args)

      await expect(
        userService.createUser({
          name: user.name,
          email: user.email,
          password: user.password
        })
      ).to.be.fulfilled
    })

    it('should throw [BadRequest] if the record already exists', async function () {
      this.user.expects('create').once().throws(prismaError('P2002'))

      await expect(userService.createUser(user)).to.be.rejectedWith(
        httpErrors.BadRequest
      )
    })
  })

  describe('deleteUserById()', () => {
    it('should delete a user', async function () {
      this.user.expects('delete').once()

      await expect(userService.deleteUserById('userId')).to.be.fulfilled
    })

    it('should not throw if no user record is found', async function () {
      this.user.expects('delete').throws(prismaError('P2025'))

      await expect(
        userService.deleteUserById('nonExistUserId')
      ).to.be.fulfilled.and.eventually.equal(null)
    })
  })
})
