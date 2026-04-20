import type { RouteRecordRaw } from 'vue-router'

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
