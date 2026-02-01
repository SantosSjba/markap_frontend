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
   * Logout user (client-side only, backend doesn't have logout endpoint)
   */
  logout(): void {
    // Backend uses JWT without refresh tokens, so logout is client-side only
    // Just clear local storage
  },
}
