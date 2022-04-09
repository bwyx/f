import fp from 'fastify-plugin'
import { Prisma } from '@prisma/client'

import type { PrismaClient } from '@prisma/client'
import { UAParser } from 'ua-parser-js'

const getDeviceFromUA = (userAgent?: string) => {
  const { device, os, browser } = new UAParser(userAgent).getResult()
  const deviceData: Omit<Prisma.DeviceUncheckedCreateInput, 'userId'> = {
    vendor: device.vendor || 'unknown',
    model: device.model || 'unknown',
    type: device.type || 'unknown',
    os: os.name || 'unknown',
    osVersion: os.version || 'unknown',
    browser: browser.name || 'unknown',
    browserVersion: browser.version || 'unknown'
  }

  return deviceData
}

export class DeviceService {
  private device

  constructor(_device: PrismaClient['device']) {
    this.device = _device
  }

  authenticateUserFromDevice = async (userId: string, userAgent?: string) => {
    const lastSeenAt = new Date()
    const { osVersion, browserVersion, ...uniqueDeviceData } =
      getDeviceFromUA(userAgent)

    return this.device.upsert({
      where: {
        userId_vendor_model_type_os_browser: {
          userId,
          ...uniqueDeviceData
        }
      },
      update: { lastSeenAt },
      create: {
        userId,
        osVersion,
        browserVersion,
        ...uniqueDeviceData,
        lastSeenAt
      }
    })
  }

  getUserDevices = async (userId: string, take = 10) =>
    this.device.findMany({
      where: { userId },
      take
    })
}

export default fp(async (app) => {
  app.decorate('deviceService', new DeviceService(app.prisma.device))
})

declare module 'fastify' {
  // eslint-disable-next-line no-unused-vars
  interface FastifyInstance {
    deviceService: DeviceService
  }
}
