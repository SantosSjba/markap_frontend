/**
 * Environment Configuration
 * Centralized access to environment variables with type safety
 */

interface EnvConfig {
  // API
  apiBaseUrl: string
  apiTimeout: number

  // App
  appName: string
  appVersion: string
  appEnv: 'development' | 'staging' | 'production'

  // Features flags
  enableDevTools: boolean
}

export const envConfig: EnvConfig = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,

  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Markap',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  appEnv: (import.meta.env.VITE_APP_ENV as EnvConfig['appEnv']) || 'development',

  // Feature Flags
  enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true' || import.meta.env.DEV,
}

export const isDev = envConfig.appEnv === 'development'
export const isProd = envConfig.appEnv === 'production'
