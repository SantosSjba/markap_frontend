import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authGuard } from '@core/guards'

// Import module routes
import { authRoutes } from '@modules/auth/router'
import { dashboardRoutes } from '@modules/dashboard/router'
import { applicationsRoutes } from '@modules/applications/router'
import { settingsRoutes } from '@modules/settings/router'
import { alquileresRoutes } from '@modules/alquileres/router'

/**
 * Application Router
 * Centralized routing configuration
 */

// Base routes
const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/applications', // Redirect to applications selector after login
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('@/views/UnauthorizedView.vue'),
    meta: {
      title: 'Acceso Denegado',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: 'Página no encontrada',
    },
  },
]

// Combine all routes
const routes: RouteRecordRaw[] = [
  ...authRoutes,
  ...applicationsRoutes,
  ...alquileresRoutes,
  ...settingsRoutes,
  ...dashboardRoutes,
  ...baseRoutes,
]

// Create router instance
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// Global navigation guards
router.beforeEach(authGuard)

// Update document title
router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} | Markap` : 'Markap'
})

export default router
