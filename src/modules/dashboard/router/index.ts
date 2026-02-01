import type { RouteRecordRaw } from 'vue-router'
import { MainLayout } from '@layouts'

/**
 * Dashboard Module Routes
 */

export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: {
          title: 'Dashboard',
        },
      },
    ],
  },
]
