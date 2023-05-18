interface BaseEnv {
  APP_NAME: string
  APP_KEYS: string
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
  EXP_ACCESS: string
  EXP_REFRESH: string
  EXP_VERIFY_EMAIL: string
  EXP_RESET_PASSWORD: string
}

export interface ENV extends BaseEnv {
  KEYS: Buffer[]
  EXP_MS_ACCESS: number
  EXP_MS_REFRESH: number
  EXP_MS_VERIFY_EMAIL: number
  EXP_MS_RESET_PASSWORD: number
}
