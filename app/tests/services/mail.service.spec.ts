/* eslint-disable func-names */
import sinon from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import type { Transporter } from 'nodemailer'

import { mailTransport } from '../mocks.js'
import { MailService } from '../../services/mail.service.js'

chai.use(chaiAsPromised)

describe('[Service: Session]', () => {
  const mailService = new MailService(mailTransport as Transporter)

  beforeEach(function () {
    this.mail = sinon.mock(mailTransport)
  })

  afterEach(function () {
    this.mail.verify()
    this.mail.restore()
  })

  describe('sendVerificationEmail()', () => {
    it('should send a verification email', async function () {
      this.mail.expects('sendMail').once().resolves()

      await expect(mailService.sendVerificationEmail('john@doe.com', 'token'))
        .to.be.fulfilled
    })
  })
})
