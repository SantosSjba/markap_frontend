import { apiClient } from '@core/api'
import type {
  LoginCredentials,
  LoginResponse,
  RegisterData,
  RegisterResponse,
  User,
} from '../types'

/**
 * Auth Service
 * Handles all authentication-related API calls
 */

const AUTH_ENDPOINT = '/auth'

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(
      `${AUTH_ENDPOINT}/login`,
      credentials
    )
    return data
  },

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<RegisterResponse> {
    const { data } = await apiClient.post<RegisterResponse>(
      `${AUTH_ENDPOINT}/register`,
      userData
    )
    return data
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const { data } = await apiClient.get<User>(`${AUTH_ENDPOINT}/profile`)
    return data
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const { data } = await apiClient.post<{ accessToken: string }>(
      `${AUTH_ENDPOINT}/refresh`,
      { refreshToken }
    )
    return data
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await apiClient.post(`${AUTH_ENDPOINT}/logout`)
  },
}
