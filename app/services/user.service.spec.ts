/* eslint-disable func-names */
import sinon, { SinonMock } from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

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

    it('should throw [Error: Email already registered] if record already exists', async function () {
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
        Error,
        ERROR_MESSAGE
      )
    })
  })

  describe('query()', () => {
    it('should call `findMany()` once', async function () {
      this.mockModel.expects('findMany').once()

      await userService.query()
    })
  })

  describe('remove()', () => {
    it('should call `delete()` only and once', async function () {
      this.mockModel.expects('delete').once()

      await userService.remove('userId')
    })

    it('should throw [Error: User to delete does not exist] if no user record found', async function () {
      const ERROR_MESSAGE = 'User to delete does not exist'
      // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
      const prismaRecordDoesNotExistError = new PrismaClientKnownRequestError(
        'Prisma Internal Error: Record to delete does not exist',
        'P2025',
        'TEST'
      )

      this.mockModel.expects('delete').throws(prismaRecordDoesNotExistError)

      await expect(userService.remove('nonExistUserId')).to.be.rejectedWith(
        Error,
        ERROR_MESSAGE
      )
    })
  })
})
