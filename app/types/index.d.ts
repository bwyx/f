interface BaseEnv {
  APP_NAME: string
  APP_KEY: string
  APP_ENV: string
  APP_PORT: number
  APP_DEBUG: boolean
  FRONTEND_DOMAIN: string
  FRONTEND_URL: string
  SMTP_HOST: string
  SMTP_PORT: number
  SMTP_SECURE: boolean
  SMTP_USER: string
  SMTP_PASS: string
  SMTP_FROM_NAME: string
  SMTP_FROM_EMAIL: string
  TRUST_PROXY: boolean
}

export interface RawEnv extends BaseEnv {
  TOKEN_ACCESS_EXPIRATION: string
  TOKEN_REFRESH_EXPIRATION: string
}

export interface ENV extends BaseEnv {
  TOKEN_ACCESS_EXPIRATION: number
  TOKEN_REFRESH_EXPIRATION: number
}
