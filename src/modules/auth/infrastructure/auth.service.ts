import { apiClient } from '@core/api/apiClient'
import type { LoginCredentials, LoginResponse, User } from '../domain/auth.types'

const AUTH_ENDPOINT = '/auth'

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(`${AUTH_ENDPOINT}/login`, credentials)
    return data
  },

  async getProfile(): Promise<User> {
    const { data } = await apiClient.get<User>(`${AUTH_ENDPOINT}/profile`)
    return data
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(`${AUTH_ENDPOINT}/forgot-password`, {
      email,
    })
    return data
  },

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(`${AUTH_ENDPOINT}/reset-password`, {
      email,
      code,
      newPassword,
    })
    return data
  },

  logout(): void {
    // Client-side only
  },
}
