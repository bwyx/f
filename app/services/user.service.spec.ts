/* eslint-disable func-names */
import sinon, { SinonMock } from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import httpErrors from 'http-errors'

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/index.js'
import type { PrismaClient } from '@prisma/client'

import { UserService } from './user.service.js'

chai.use(chaiAsPromised)

declare module 'mocha' {
  export interface Context {
    mockModel: SinonMock
  }
}

const model: PrismaClient['user'] = {
  findUnique: () => <any>{},
  findFirst: () => <any>{},
  findMany: () => <any>{},
  create: () => <any>{},
  createMany: () => <any>{},
  delete: () => <any>{},
  update: () => <any>{},
  deleteMany: () => <any>{},
  updateMany: () => <any>{},
  upsert: () => <any>{},
  count: () => <any>{},
  aggregate: () => <any>{},
  groupBy: () => <any>{}
}

describe('[Service: User]', () => {
  const userService = new UserService(model)

  beforeEach(function () {
    this.mockModel = sinon.mock(model)
  })

  afterEach(function () {
    this.mockModel.verify()
    this.mockModel.restore()
  })

  describe('getUnique()', () => {
    it('should call `findUnique()` only and once', async function () {
      this.mockModel.expects('findUnique').once()
      this.mockModel.expects('findFirst').never()
      this.mockModel.expects('findMany').never()

      await userService.getUnique({ where: { id: 'userId' } })
    })
  })

  describe('getFirst()', () => {
    it('should call `findFirst()` only and once', async function () {
      this.mockModel.expects('findFirst').once()
      this.mockModel.expects('findUnique').never()
      this.mockModel.expects('findMany').never()

      await userService.getFirst({ where: { id: 'userId' } })
    })
  })

  describe('query()', () => {
    it('should call `findMany()` only and once', async function () {
      this.mockModel.expects('findMany').once()
      this.mockModel.expects('findUnique').never()
      this.mockModel.expects('findFirst').never()

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

      this.mockModel.expects('create').once()
      this.mockModel.expects('findUnique').never()
      this.mockModel.expects('findFirst').never()
      this.mockModel.expects('findMany').never()

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

      this.mockModel.expects('create').withArgs(args)

      await userService.create(user)
    })

    it('should throw [BadRequest: Email already registered] if record already exists', async function () {
      const ERROR_MESSAGE = 'Email already registered'
      // https://www.prisma.io/docs/reference/api-reference/error-reference#p2002
      const prismaUniqueConstraintError = new PrismaClientKnownRequestError(
        'Prisma Internal Error: Unique constraint failed',
        'P2002',
        'TEST'
      )

      const user = {
        name: 'Already Exist',
        email: 'already@exist.com',
        password: 'strongpassword'
      }

      this.mockModel
        .expects('create')
        .once()
        .throws(prismaUniqueConstraintError)

      await expect(userService.create(user)).to.be.rejectedWith(
        httpErrors.BadRequest,
        ERROR_MESSAGE
      )
    })

    it('should throw another unhandled internal error', async function () {
      const ERROR_MESSAGE = 'unhandled internal error'
      const unhandledError = new Error(ERROR_MESSAGE)

      const user = {
        name: 'New User',
        email: 'new@user.com',
        password: 'strongpassword'
      }

      this.mockModel.expects('create').throws(unhandledError)

      await expect(userService.create(user)).to.be.rejectedWith(
        Error,
        ERROR_MESSAGE
      )
    })
  })

  describe('remove()', () => {
    it('should call `delete()` only and once', async function () {
      this.mockModel.expects('delete').once()
      this.mockModel.expects('findUnique').never()
      this.mockModel.expects('findFirst').never()
      this.mockModel.expects('findMany').never()

      await userService.remove('userId')
    })

    it('should not throws if no user record found', async function () {
      // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
      const prismaRecordDoesNotExistError = new PrismaClientKnownRequestError(
        'Prisma Internal Error: Record to delete does not exist',
        'P2025',
        'TEST'
      )

      this.mockModel.expects('delete').throws(prismaRecordDoesNotExistError)

      await expect(
        userService.remove('nonExistUserId')
      ).to.be.fulfilled.and.eventually.equal(null)
    })

    it('should throw another unhandled internal error', async function () {
      const ERROR_MESSAGE = 'unhandled internal error'
      const unhandledError = new Error(ERROR_MESSAGE)

      this.mockModel.expects('delete').throws(unhandledError)

      await expect(userService.remove('userId')).to.be.rejectedWith(
        Error,
        ERROR_MESSAGE
      )
    })
  })
})
