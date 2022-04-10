/* eslint-disable func-names */
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { decrypt, encrypt } from '../../utils/token.util.js'

chai.use(chaiAsPromised)

describe('[Utilities: Token]', () => {
  describe('encrypt-decrypt()', () => {
    it('should be able to decrypt encrypted-payload', () => {
      const text = 'hello you can see me'

      const encrypted = encrypt(text)
      const decrypted = decrypt(encrypted)

      expect(encrypted.content).not.equal(text)
      expect(decrypted).equal(text)
    })
  })
})
