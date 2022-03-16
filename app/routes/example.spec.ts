import ava from 'ava'
import build from '../index.js'

import type { TestFn } from 'ava'
import type { FastifyInstance } from 'fastify'

const test = ava as TestFn<FastifyInstance>

test.beforeEach(async (t) => (t.context = build()))
test.afterEach(async (t) => t.context.close())

test('GET `/example` returns back queries', async (t) => {
  t.plan(2)

  const query = {
    foo: 'bar',
    baz: 'qux'
  }

  const response = await t.context.inject({
    method: 'GET',
    url: '/example',
    query
  })

  t.is(response.statusCode, 200)
  t.is(response.body, JSON.stringify(query))
})
