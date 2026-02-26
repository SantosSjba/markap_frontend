import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authGuard } from '@app/guards'

import { authRoutes } from '@features/auth/router'
import { applicationsRoutes } from '@features/applications/router'
import { dashboardRoutes } from '@applications/shell/router'
import { settingsRoutes } from '@applications/settings/router'
import { alquileresRoutes } from '@applications/alquileres/router'

const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/applications',
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('@applications/shell/ui/UnauthorizedView.vue'),
    meta: { title: 'Acceso Denegado' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@applications/shell/ui/NotFoundView.vue'),
    meta: { title: 'Página no encontrada' },
  },
]

const routes: RouteRecordRaw[] = [
  ...authRoutes,
  ...applicationsRoutes,
  ...alquileresRoutes,
  ...settingsRoutes,
  ...dashboardRoutes,
  ...baseRoutes,
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

router.beforeEach(authGuard)

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} | Markap` : 'Markap'
})

export default router
