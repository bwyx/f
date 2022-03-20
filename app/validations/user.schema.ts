export const createUserBody = {
  type: 'object',
  required: ['name', 'email', 'password'],
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    password: { type: 'string' }
  }
} as const

export const deleteUserParams = {
  type: 'object',
  required: ['userId'],
  properties: {
    userId: { type: 'string', minLength: 1 }
  }
} as const
