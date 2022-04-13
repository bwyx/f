/* eslint-disable func-names */
import { expect } from 'chai'

import build from '../../index.js'

describe('[Route: Auth]', async () => {
  before(function () {
    this.f = build()
  })
  after(function () {
    this.f.close()
  })

  const login1 = { email: 'john@doe.com', password: 'qwertyyy' }
  const register1 = { name: 'John Doe', ...login1 }

  const login2 = { email: 'jane@doe.com', password: '12345678' }
  const register2 = { name: 'Jane Doe', ...login2 }

  describe('/register', () => {
    const method = 'POST'
    const url = '/auth/register'

    it('should register a new user', async function () {
      const resp1 = await this.f.inject({ method, url, payload: register1 })
      const resp2 = await this.f.inject({ method, url, payload: register2 })

      expect(resp1.statusCode).to.equal(201)
      expect(resp2.statusCode).to.equal(201)
    })

    it('should not register a new user if user has been registered', async function () {
      const resp = await this.f.inject({ method, url, payload: register1 })

      expect(resp.statusCode).to.equal(400)
    })
  })

  describe('/login', () => {
    const method = 'POST'
    const url = '/auth/login'

    it('should logged in the user', async function () {
      const resp = await this.f.inject({ method, url, payload: login1 })

      expect(resp.statusCode).to.equal(200)
    })

    it('should not logged in the user if no user record found', async function () {
      const payload = {
        email: 'non.registered@user.com',
        password: 'canIloggedIn?'
      }
      const resp = await this.f.inject({ method, url, payload })

      expect(resp.statusCode).to.equal(401)
    })

    it('should not logged in the user if the credential mismatch', async function () {
      const payload = {
        email: login1.email,
        password: 'accidentally!submitted?wrong$password'
      }
      const resp = await this.f.inject({ method, url, payload })

      expect(resp.statusCode).to.equal(401)
    })
  })
})
