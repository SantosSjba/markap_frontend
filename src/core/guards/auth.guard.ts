import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@modules/auth/stores/auth.store'

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

  // Check if route requires authentication
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Redirect to login with return URL
      return next({
        name: 'login',
        query: { redirect: to.fullPath },
      })
    }

    // Check if route requires admin role
    const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)
    if (requiresAdmin && !authStore.isAdmin) {
      return next({ path: '/settings/profile' })
    }
  }

  // Check if route requires guest (not authenticated)
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest)

  if (requiresGuest && authStore.isAuthenticated) {
    return next({ name: 'applications' })
  }

  next()
}
