/**
 * Auth Module Types
 * Sincronizado con el backend NestJS
 */

export interface UserRole {
  id: string
  name: string
  code: string
}

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

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  expiresIn: number
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface RegisterResponse {
  message: string
  user: User
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  expiresIn: number | null
  isAuthenticated: boolean
  isLoading: boolean
}
