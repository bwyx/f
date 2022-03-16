import { expect } from 'chai'
import build from '../index.js'

import type { FastifyInstance } from 'fastify'

declare module 'mocha' {
  export interface Context {
    app: FastifyInstance
  }
}

describe('[Route /]', function () {
  before('setup fastify', async function () {
    this.app = build()
    await this.app.ready()
  })

  after('end fastify', async function () {
    this.app.close()
  })

  describe('GET', function () {
    it('should response "hello world"', async function () {
      const response = await this.app.inject({ method: 'GET', url: '/' })

      expect(response.body, 'body should be "hello world"').to.equal(
        'hello world'
      )
    })
  })

  describe('POST', function () {
    it('should response with not found', async function () {
      const response = await this.app.inject({ method: 'POST', url: '/' })

      expect(response.statusCode).to.equal(404)
    })
  })
})
