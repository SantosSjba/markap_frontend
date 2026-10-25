import { useMutation } from '@tanstack/vue-query'
import { authRepositoryKey as AUTH } from '../../application/ports/auth.port'
import { useService } from '@shared/presentation/di/services'
export const authKeys = {
  all: ['auth'] as const,
}

export function useForgotPassword() {
  const authApiRepository = useService(AUTH)
  return useMutation({
    mutationKey: [...authKeys.all, 'forgot-password'],
    mutationFn: (email: string) => authApiRepository.forgotPassword(email),
  })
}

export function useResetPassword() {
  const authApiRepository = useService(AUTH)
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
