import { expect } from 'chai'
import build from '../index.js'

import type { FastifyInstance } from 'fastify'

declare module 'mocha' {
  export interface Context {
    app: FastifyInstance
  }
}

describe('[Route /example]', function () {
  before('setup fastify', async function () {
    this.app = build()
    await this.app.ready()
  })

  after('end fastify', async function () {
    this.app.close()
  })

  describe('GET', function () {
    it('should return the query', async function () {
      const response = await this.app.inject({
        method: 'GET',
        url: '/example',
        query: {
          foo: 'bar',
          baz: 'qux'
        }
      })

      expect(response.body, 'body should be json of query').to.equal(
        '{"foo":"bar","baz":"qux"}'
      )
    })
  })
})
