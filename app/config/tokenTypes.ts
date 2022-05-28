export const ACCESS = 'access'
export const VERIFY_EMAIL = 'verify_email'
export const RESET_PASSWORD = 'reset_password'

export type TokenType =
  | typeof ACCESS
  | typeof VERIFY_EMAIL
  | typeof RESET_PASSWORD
