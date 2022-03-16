import ava from 'ava'
import build from '../index.js'

import type { TestFn } from 'ava'
import type { FastifyInstance } from 'fastify'

const test = ava as TestFn<FastifyInstance>

test.beforeEach(async (t) => (t.context = build()))
test.afterEach(async (t) => t.context.close())

test('GET `/` returns "hello world"', async (t) => {
  t.plan(2)

  const response = await t.context.inject({
    method: 'GET',
    url: '/'
  })

  t.is(response.statusCode, 200)
  t.is(response.body, 'hello world')
})
