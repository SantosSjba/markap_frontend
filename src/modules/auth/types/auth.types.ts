/**
 * Auth Module Types
 * Sincronizado con el backend NestJS
 */

/**
 * Role info (from backend)
 */
export interface UserRole {
  id: string
  name: string
  code: string
}

/**
 * User entity (from backend UserResponseDto)
 */
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  isActive: boolean
  createdAt: string
  roles?: UserRole[]
}

/**
 * Login credentials (from backend LoginDto)
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Login response (from backend LoginResponseDto)
 */
export interface LoginResponse {
  user: User
  accessToken: string
  expiresIn: number
}

/**
 * Register data (from backend RegisterDto)
 */
export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

/**
 * Register response (from backend RegisterResponseDto)
 */
export interface RegisterResponse {
  message: string
  user: User
}

/**
 * Auth state for store
 */
export interface AuthState {
  user: User | null
  accessToken: string | null
  expiresIn: number | null
  isAuthenticated: boolean
  isLoading: boolean
}
