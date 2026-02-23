import { useMutation } from '@tanstack/vue-query'
import { authService } from '../services'

/**
 * Query/Mutation keys for Auth (TanStack Query)
 * Auth flows are mutations; no list/detail cache needed for forgot/reset.
 */
export const authKeys = {
  all: ['auth'] as const,
}

/**
 * Mutation: request password reset code (forgot password)
 * POST /auth/forgot-password
 */
export function useForgotPassword() {
  return useMutation({
    mutationKey: [...authKeys.all, 'forgot-password'],
    mutationFn: (email: string) => authService.forgotPassword(email),
  })
}

/**
 * Mutation: reset password with code
 * POST /auth/reset-password
 */
export function useResetPassword() {
  return useMutation({
    mutationKey: [...authKeys.all, 'reset-password'],
    mutationFn: ({
      email,
      code,
      newPassword,
    }: {
      email: string
      code: string
      newPassword: string
    }) => authService.resetPassword(email, code, newPassword),
  })
}
