import type { RouteRecordRaw } from 'vue-router'

/**
 * Applications Module Routes
 */

export const applicationsRoutes: RouteRecordRaw[] = [
  {
    path: '/applications',
    name: 'applications',
    component: () => import('../views/ApplicationsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Aplicaciones',
    },
  },
]
