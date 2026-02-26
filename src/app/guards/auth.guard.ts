import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@features/auth/stores/auth.store'

/**
 * Authentication Guard
 * Protects routes that require authentication
 */
export const authGuard = async (
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const authStore = useAuthStore()

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth) {
    if (!authStore.isAuthenticated) {
      return next({
        name: 'login',
        query: { redirect: to.fullPath },
      })
    }

    const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)
    if (requiresAdmin && !authStore.isAdmin) {
      return next({ path: '/settings/profile' })
    }
  }

  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest)

  if (requiresGuest && authStore.isAuthenticated) {
    return next({ name: 'applications' })
  }

  next()
}
