/* eslint-disable func-names */
import sinon from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'

import { prismaModel } from '../mocks.js'
import { userAgents } from '../fixtures.js'
import { DeviceService } from '../../services/device.service.js'

chai.use(chaiAsPromised)

describe('[Service: Device]', () => {
  const deviceService = new DeviceService(prismaModel)

  beforeEach(function () {
    this.device = sinon.mock(prismaModel)
  })

  afterEach(function () {
    this.device.verify()
    this.device.restore()
  })

  const userId = '4508dec3-0b0a-40b8-8ba7-77eff6e50dbb'

  describe('authenticateUserFromDevice()', () => {
    it('should call `upsert()` once', async function () {
      this.device.expects('upsert').once()

      await expect(
        deviceService.authenticateUserFromDevice(userId, userAgents.android)
      ).to.be.fulfilled
    })

    it('should update the device `lastSeenAt`', async function () {
      const args = sinon.match
        .hasNested('create.lastSeenAt', sinon.match.date)
        .and(sinon.match.hasNested('update.lastSeenAt', sinon.match.date))
      this.device.expects('upsert').withArgs(args)

      await expect(
        deviceService.authenticateUserFromDevice(userId, userAgents.android)
      ).to.be.fulfilled
    })
  })

  describe('getUserDevices()', () => {
    it('should call `findMany()` once', async function () {
      this.device.expects('findMany').once()

      await expect(deviceService.getUserDevices(userId, 3)).to.be.fulfilled
    })
  })
})
