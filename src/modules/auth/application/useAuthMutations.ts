import { useMutation } from '@tanstack/vue-query'
import { authService } from '../infrastructure/auth.service'

export const authKeys = {
  all: ['auth'] as const,
}

export function useForgotPassword() {
  return useMutation({
    mutationKey: [...authKeys.all, 'forgot-password'],
    mutationFn: (email: string) => authService.forgotPassword(email),
  })
}

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
