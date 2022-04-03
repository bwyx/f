export const splitRefreshToken = (refreshToken: string) => {
  const [token, user64] = refreshToken.split('.')
  const userId = Buffer.from(user64, 'base64').toString()

  return { userId, token }
}

export default { splitRefreshToken }
