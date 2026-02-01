import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@modules/auth/stores/auth.store'

/**
 * Authentication Guard
 * Protects routes that require authentication
 */
export const authGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
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
  }

  // Check if route requires guest (not authenticated)
  const requiresGuest = to.matched.some((record) => record.meta.requiresGuest)

  if (requiresGuest && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  next()
}

/**
 * Role Guard
 * Protects routes that require specific roles
 */
export const roleGuard = (allowedRoles: string[]) => {
  return async (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    const authStore = useAuthStore()

    if (!authStore.isAuthenticated) {
      return next({ name: 'login' })
    }

    const userRoles = authStore.user?.roles || []
    const hasAccess = allowedRoles.some((role) => userRoles.includes(role))

    if (!hasAccess) {
      return next({ name: 'unauthorized' })
    }

    next()
  }
}
