import type { RouteRecordRaw } from 'vue-router'
import { AuthLayout } from '@layouts'

/**
 * Auth Module Routes
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
        path: 'register',
        name: 'register',
        component: () => import('../views/RegisterView.vue'),
        meta: {
          title: 'Registrarse',
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
    ],
  },
]
