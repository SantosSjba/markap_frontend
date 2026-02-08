import { apiClient } from '@core/api'
import type {
  LoginCredentials,
  LoginResponse,
  User,
} from '../types'

/**
 * Auth Service
 * Handles all authentication-related API calls
 * Synchronized with backend endpoints
 */

const AUTH_ENDPOINT = '/auth'

export const authService = {
  /**
   * Login user
   * POST /auth/login
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      `${AUTH_ENDPOINT}/login`,
      credentials
    )
    return data
  },

  /**
   * Get current user profile
   * GET /auth/profile
   */
  async getProfile(): Promise<User> {
    const { data } = await apiClient.get<User>(`${AUTH_ENDPOINT}/profile`)
    return data
  },

  /**
   * Request password reset - sends code via email
   * POST /auth/forgot-password
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(
      `${AUTH_ENDPOINT}/forgot-password`,
      { email }
    )
    return data
  },

  /**
   * Reset password with code received by email
   * POST /auth/reset-password
   */
  async resetPassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(
      `${AUTH_ENDPOINT}/reset-password`,
      { email, code, newPassword }
    )
    return data
  },

  /**
   * Logout user (client-side only, backend doesn't have logout endpoint)
   */
  logout(): void {
    // Backend uses JWT without refresh tokens, so logout is client-side only
    // Just clear local storage
  },
}
