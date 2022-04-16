interface BaseEnv {
  APP_NAME: string
  APP_KEY: string
  APP_ENV: string
  APP_PORT: number
  APP_DEBUG: boolean
  FRONTEND_DOMAIN: string
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
