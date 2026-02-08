import type { RouteRecordRaw } from 'vue-router'
import { AuthLayout } from '@layouts'

/**
 * Auth Module Routes
 * Note: Register is not public - requires authentication (admin only)
 */

export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/auth',
    component: AuthLayout,
    meta: { requiresGuest: true },
    children: [
      {
        path: '',
        redirect: '/auth/login',
      },
      {
        path: 'login',
        name: 'login',
        component: () => import('../views/LoginView.vue'),
        meta: {
          title: 'Iniciar Sesión',
        },
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('../views/ForgotPasswordView.vue'),
        meta: {
          title: 'Recuperar Contraseña',
        },
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: () => import('../views/ResetPasswordView.vue'),
        meta: {
          title: 'Restablecer Contraseña',
        },
      },
    ],
  },
]
