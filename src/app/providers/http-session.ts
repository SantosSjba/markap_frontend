import type { Pinia } from 'pinia'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
import { configureHttpSession } from '@shared/infrastructure/http/api-client'
export function setupHttpSession(pinia: Pinia): () => void {
  const auth = useAuthStore(pinia)
  return configureHttpSession({
    getAccessToken: () => auth.accessToken,
    onUnauthorized: () => {
      auth.clearAuth()
      if (!window.location.pathname.startsWith('/auth')) window.location.assign('/auth/login')
    },
  })
}
