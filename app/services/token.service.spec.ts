/* eslint-disable func-names */
import sinon, { SinonMock } from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import httpErrors from 'http-errors'

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/index.js'
import type { PrismaClient } from '@prisma/client'
import type { JWT } from 'fastify-jwt'

import { TokenService } from './token.service.js'

chai.use(chaiAsPromised)

declare module 'mocha' {
  export interface Context {
    token: SinonMock
    jwt: SinonMock
  }
}

// https://www.prisma.io/docs/reference/api-reference/error-reference#prisma-client-query-engine
const prismaErrors = {
  P2000: "The provided value for the column is too long for the column's type.",
  P2001:
    'The record searched for in the where condition ({model_name}.{argument_name} = {argument_value}) does not exist',
  P2002: 'Unique constraint failed on the {constraint}',
  P2003: 'Foreign key constraint failed on the field: {field_name}',
  P2004: 'A constraint failed on the database: {database_error}',
  P2005:
    "The value {field_value} stored in the database for the field {field_name} is invalid for the field's type",
  P2006:
    'The provided value {field_value} for {model_name} field {field_name} is not valid',
  P2007: 'Data validation error {database_error}',
  P2008: 'Failed to parse the query {query_parsing_error} at {query_position}',
  P2009:
    'Failed to validate the query: {query_validation_error} at {query_position}',
  P2010: 'Raw query failed. Code: {code}. Message: {message}',
  P2011: 'Null constraint violation on the {constraint}',
  P2012: 'Missing a required value at {path}',
  P2013:
    'Missing the required argument {argument_name} for field {field_name} on {object_name}.',
  P2014:
    "The change you are trying to make would violate the required relation '{relation_name}' between the {model_a_name} and {model_b_name} models.",
  P2015: 'A related record could not be found. {details}',
  P2016: 'Query interpretation error. {details}',
  P2017:
    'The records for relation {relation_name} between the {parent_name} and {child_name} models are not connected.',
  P2018: 'The required connected records were not found. {details}',
  P2019: 'Input error. {details}',
  P2020: 'Value out of range for the type. {details}',
  P2021: 'The table {table} does not exist in the current database.',
  P2022: 'The column {column} does not exist in the current database.',
  P2023: 'Inconsistent column data: {message}',
  P2024:
    'Timed out fetching a new connection from the connection pool. (More info: http://pris.ly/d/connection-pool, Current connection limit: {connection_limit})',
  P2025:
    'An operation failed because it depends on one or more records that were required but not found. {cause}',
  P2026:
    "The current database provider doesn't support a feature that the query used: {feature}",
  P2027:
    'Multiple errors occurred on the database during query execution: {errors}',
  P2030:
    'Cannot find a fulltext index to use for the search, try adding a @@fulltext([Fields...]) to your schema'
}

const createPrismaError = (code: keyof typeof prismaErrors) =>
  new PrismaClientKnownRequestError(prismaErrors[code], code, 'TEST')

const model: PrismaClient['token'] = {
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

const jwt: JWT = {
  sign: () => <any>{},
  verify: () => <any>{},
  decode: () => <any>{},
  options: {
    decode: {},
    sign: {},
    verify: {}
  }
}

describe('[Service: Token]', () => {
  const tokenService = new TokenService(model, jwt)

  beforeEach(function () {
    this.token = sinon.mock(model)
    this.jwt = sinon.mock(jwt)
  })

  afterEach(function () {
    this.token.verify()
    this.token.restore()
    this.jwt.verify()
    this.jwt.restore()
  })

  const userId = '4508dec3-0b0a-40b8-8ba7-77eff6e50dbb'
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

      await expect(tokenService.generateRefreshToken(userId)).to.be.eventually
        .fulfilled
    })

    it('should call `update()` once when replacing an old token', async function () {
      this.token.expects('update').once()
      this.token.expects('create').never()

      await expect(
        tokenService.generateRefreshToken(userId, {
          replaceToken: 'old_token'
        })
      ).to.be.eventually.fulfilled
    })

    it('should throw [Unauthorized] if related user record is not found', async function () {
      const error = createPrismaError('P2003')
      this.token.expects('create').throws(error)

      await expect(
        tokenService.generateRefreshToken('nonExistUserId')
      ).to.be.rejectedWith(httpErrors.Unauthorized)
    })

    it('should throw [Unauthorized] if the token that was to be replaced is not found', async function () {
      const error = createPrismaError('P2025')
      this.token.expects('update').throws(error)

      await expect(
        tokenService.generateRefreshToken(userId, {
          replaceToken: 'nonExistToken'
        })
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
      ).to.be.rejectedWith(httpErrors.Unauthorized, 'ok')
    })

    it('should not throw if no token record is found', async function () {
      this.token.expects('delete').throws(createPrismaError('P2025'))

      await expect(tokenService.revokeRefreshToken(validRefreshToken)).to.be
        .eventually.fulfilled
    })
  })
})
