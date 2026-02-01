/**
 * Auth Module Types
 */

/**
 * User entity
 */
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  avatar?: string
  createdAt: string
  updatedAt: string
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Register data
 */
export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

/**
 * Auth tokens
 */
export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

/**
 * Auth state
 */
export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

/**
 * Login response
 */
export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken?: string
}

/**
 * Register response
 */
export interface RegisterResponse {
  user: User
  accessToken: string
  refreshToken?: string
}
