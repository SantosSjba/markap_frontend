import type { RouteRecordRaw } from 'vue-router'

/**
 * Settings Module Routes
 */

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    component: () => import('../views/SettingsLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/settings/profile',
      },
      {
        path: 'profile',
        name: 'settings-profile',
        component: () => import('../views/ProfileView.vue'),
        meta: { title: 'Mi Perfil' },
      },
      {
        path: 'users',
        name: 'settings-users',
        component: () => import('../views/UsersView.vue'),
        meta: { title: 'Usuarios', requiresAdmin: true },
      },
      {
        path: 'roles',
        name: 'settings-roles',
        component: () => import('../views/RolesView.vue'),
        meta: { title: 'Roles', requiresAdmin: true },
      },
    ],
  },
]
