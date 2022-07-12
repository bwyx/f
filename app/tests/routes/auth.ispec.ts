/* eslint-disable func-names */
import { expect } from 'chai'

import build from '../../index.js'

interface ParsedCookie {
  name: string
  value: string
  path?: string
  expires?: Date
  secure?: boolean
  sameSite?: boolean | string
}

const toCookieString = (cookie: ParsedCookie[]): string =>
  cookie.map((c) => `${c.name}=${c.value}`).join('; ')

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

  describe('POST /register', () => {
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

  describe('POST /login', () => {
    const method = 'POST'
    const url = '/auth/login'

    it('should logged in the user', async function () {
      const resp = await this.f.inject({ method, url, payload: login1 })

      expect(resp.statusCode).to.equal(200)
    })

    it('should logged in the user from frontend and set auth cookies', async function () {
      const resp = await this.f.inject({
        method,
        url,
        payload: login1,
        headers: { 'x-requested-with': 'XMLHttpRequest' }
      })

      expect(resp.cookies).to.be.an('array').and.have.lengthOf(3)
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

  describe('POST /logout', () => {
    const method = 'POST'
    const url = '/auth/logout'

    it('should logged out the user', async function () {
      // Login
      const loginResponse = await this.f.inject({
        method,
        url: '/auth/login',
        payload: login1
      })
      const { access } = loginResponse.json()
      // Login End

      const resp = await this.f.inject({
        method,
        url,
        headers: {
          authorization: `Bearer ${access}`
        }
      })

      expect(resp.statusCode).to.equal(200)
    })

    it('should logged out the user from frontend and remove auth cookies', async function () {
      // Login
      const loginResponse = await this.f.inject({
        method,
        url: '/auth/login',
        payload: login1,
        headers: { 'x-requested-with': 'XMLHttpRequest' }
      })
      const cookiesAfterLogin = loginResponse.cookies as ParsedCookie[]
      const cookieString = toCookieString(cookiesAfterLogin)
      // Login End

      const resp = await this.f.inject({
        method,
        url,
        headers: { 'x-requested-with': 'XMLHttpRequest', cookie: cookieString }
      })

      const cookiesAfterLogout = resp.cookies as ParsedCookie[]
      cookiesAfterLogout.forEach((cookie) => {
        const expires = cookie.expires?.getTime()
        expect(cookie.value).to.equal('')
        expect(expires).to.be.lessThanOrEqual(Date.now())
      })

      expect(resp.statusCode).to.equal(200)
    })
  })

  describe('GET /sessions', () => {
    const method = 'GET'
    const url = '/auth/sessions'

    it('should get the sessions of the user', async function () {
      const loginResponse = await this.f.inject({
        method: 'POST',
        url: 'auth/login',
        payload: login1
      })
      const { access } = loginResponse.json()

      const resp = await this.f.inject({
        method,
        url,
        headers: {
          authorization: `Bearer ${access}`
        }
      })

      expect(resp.statusCode).to.equal(200)
    })

    it('should get the sessions from frontend using auth cookies', async function () {
      // Login
      const loginResponse = await this.f.inject({
        method: 'POST',
        url: 'auth/login',
        payload: login1,
        headers: { 'x-requested-with': 'XMLHttpRequest' }
      })
      const cookiesAfterLogin = loginResponse.cookies as ParsedCookie[]
      const cookieString = toCookieString(cookiesAfterLogin)
      // Login End

      const resp = await this.f.inject({
        method,
        url,
        headers: { 'x-requested-with': 'XMLHttpRequest', cookie: cookieString }
      })

      expect(resp.statusCode).to.equal(200)
    })
  })

  describe('POST /refresh-tokens', () => {
    const method = 'POST'
    const url = '/auth/refresh-tokens'

    it('should refresh the auth tokens', async function () {
      // Login
      const loginResponse = await this.f.inject({
        method: 'POST',
        url: 'auth/login',
        payload: login1
      })
      const { access } = loginResponse.json()
      const cookiesAfterLogin = loginResponse.cookies as ParsedCookie[]
      const cookieString = toCookieString(cookiesAfterLogin)
      // Login End

      const resp = await this.f.inject({
        method,
        url,
        headers: {
          authorization: `Bearer ${access}`,
          cookie: cookieString
        }
      })

      expect(resp.statusCode).to.equal(200)
    })

    it('should refresh the auth cookies if requested from frontend', async function () {
      // Login
      const loginResponse = await this.f.inject({
        method: 'POST',
        url: 'auth/login',
        payload: login1,
        headers: { 'x-requested-with': 'XMLHttpRequest' }
      })
      const cookiesAfterLogin = loginResponse.cookies as ParsedCookie[]
      const cookieString = toCookieString(cookiesAfterLogin)
      // Login End

      const resp = await this.f.inject({
        method,
        url,
        headers: { 'x-requested-with': 'XMLHttpRequest', cookie: cookieString }
      })

      expect(resp.cookies).to.be.an('array').and.have.lengthOf(3)
      expect(resp.statusCode).to.equal(200)
    })
  })
})
