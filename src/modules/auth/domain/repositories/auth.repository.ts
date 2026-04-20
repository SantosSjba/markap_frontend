import type { LoginCredentials, LoginResponse, User } from '../auth.types'

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<LoginResponse>
  getProfile(): Promise<User>
  forgotPassword(email: string): Promise<{ message: string }>
  resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }>
  logout(): void
}
