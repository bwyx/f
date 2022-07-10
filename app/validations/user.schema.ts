export const createUser = {
  body: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      password: { type: 'string' }
    }
  }
} as const

export const deleteUser = {
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string', minLength: 1 }
    }
  }
} as const

export default { createUser, deleteUser }
