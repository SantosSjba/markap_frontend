import { useMutation } from '@tanstack/vue-query'
import { authApiRepository } from '../infrastructure/repositories/auth.api.repository'

export const authKeys = {
  all: ['auth'] as const,
}

export function useForgotPassword() {
  return useMutation({
    mutationKey: [...authKeys.all, 'forgot-password'],
    mutationFn: (email: string) => authApiRepository.forgotPassword(email),
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
    }) => authApiRepository.resetPassword(email, code, newPassword),
  })
}
