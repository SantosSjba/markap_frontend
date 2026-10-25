import type { RouteRecordRaw } from 'vue-router'
import MainLayout from '@app/layouts/MainLayout.vue'
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
