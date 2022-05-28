export const registerBody = {
  type: 'object',
  required: ['name', 'email', 'password'],
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    password: { type: 'string' }
  }
} as const

export const loginBody = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string' }
  }
} as const

export const verifyEmailQuery = {
  type: 'object',
  required: ['token'],
  properties: {
    token: { type: 'string' }
  }
} as const

export const forgotPasswordBody = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email' }
  }
} as const

export const resetPasswordQuery = verifyEmailQuery

export const resetPasswordBody = {
  type: 'object',
  required: ['password'],
  properties: {
    password: { type: 'string' }
  }
} as const
