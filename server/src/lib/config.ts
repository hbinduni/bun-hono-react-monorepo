/**
 * Server Configuration
 *
 * Centralized configuration management with environment variable loading
 * and validation. Provides type-safe access to all server settings.
 */

// ============================================================================
// Configuration Interface
// ============================================================================

export interface ServerConfig {
  // Server
  NODE_ENV: 'development' | 'production' | 'test'
  PORT: number

  // Database
  DATABASE_URL: string

  // JWT
  JWT_SECRET: string

  // OAuth - Google
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_REDIRECT_URI: string

  // OAuth - Facebook
  FACEBOOK_CLIENT_ID: string
  FACEBOOK_CLIENT_SECRET: string
  FACEBOOK_REDIRECT_URI: string

  // OAuth - Twitter
  TWITTER_CLIENT_ID: string
  TWITTER_CLIENT_SECRET: string
  TWITTER_REDIRECT_URI: string

  // Frontend URL (for CORS and redirects)
  FRONTEND_URL: string
}

// ============================================================================
// Configuration Loading
// ============================================================================

let config: ServerConfig | null = null

/**
 * Load and validate server configuration from environment
 * Caches the result for subsequent calls
 */
export function getConfig(): ServerConfig {
  if (config) return config

  const env = process.env

  // Required variables
  const required = ['JWT_SECRET'] as const
  const missing = required.filter((key) => !env[key])

  if (missing.length > 0 && env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  config = {
    // Server
    NODE_ENV: (env.NODE_ENV as ServerConfig['NODE_ENV']) || 'development',
    PORT: Number.parseInt(env.PORT || '3000', 10),

    // Database
    DATABASE_URL: env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/monorepo',

    // JWT (use a default for development only)
    JWT_SECRET: env.JWT_SECRET || 'development-secret-key-change-in-production-min-32-chars',

    // OAuth - Google
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID || '',
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET || '',
    GOOGLE_REDIRECT_URI: env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google',

    // OAuth - Facebook
    FACEBOOK_CLIENT_ID: env.FACEBOOK_CLIENT_ID || '',
    FACEBOOK_CLIENT_SECRET: env.FACEBOOK_CLIENT_SECRET || '',
    FACEBOOK_REDIRECT_URI: env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/facebook',

    // OAuth - Twitter
    TWITTER_CLIENT_ID: env.TWITTER_CLIENT_ID || '',
    TWITTER_CLIENT_SECRET: env.TWITTER_CLIENT_SECRET || '',
    TWITTER_REDIRECT_URI: env.TWITTER_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/twitter',

    // Frontend
    FRONTEND_URL: env.FRONTEND_URL || 'http://localhost:5173',
  }

  return config
}

/**
 * Check if OAuth provider is configured
 */
export function isOAuthConfigured(provider: 'google' | 'facebook' | 'twitter'): boolean {
  const cfg = getConfig()

  switch (provider) {
    case 'google':
      return Boolean(cfg.GOOGLE_CLIENT_ID && cfg.GOOGLE_CLIENT_SECRET)
    case 'facebook':
      return Boolean(cfg.FACEBOOK_CLIENT_ID && cfg.FACEBOOK_CLIENT_SECRET)
    case 'twitter':
      return Boolean(cfg.TWITTER_CLIENT_ID && cfg.TWITTER_CLIENT_SECRET)
    default:
      return false
  }
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getConfig().NODE_ENV === 'development'
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getConfig().NODE_ENV === 'production'
}
