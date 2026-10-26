<script setup lang="ts">
import { computed } from 'vue'
import type { MenuItem } from '@shared/domain/menu.types'
import AdminLayout from '@app/layouts/AdminLayout.vue'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
/**
 * SettingsLayout — Configuración sobre el shell de TailAdmin (`AdminLayout`).
 * Menú estático; las opciones de administración solo se muestran a administradores.
 */

const authStore = useAuthStore()

const allMenuItems: (MenuItem & { adminOnly: boolean })[] = [
  { id: 'profile', label: 'Mi Perfil', icon: 'user', path: '/settings/profile', order: 1, adminOnly: false },
  { id: 'users', label: 'Usuarios', icon: 'users', path: '/settings/users', order: 2, adminOnly: true },
  { id: 'roles', label: 'Roles', icon: 'shield-check', path: '/settings/roles', order: 3, adminOnly: true },
  {
    id: 'role-applications',
    label: 'Roles y aplicaciones',
    icon: 'layout-grid',
    path: '/settings/role-applications',
    order: 4,
    adminOnly: true,
  },
]

const menus = computed<MenuItem[]>(() =>
  allMenuItems.filter((item) => !item.adminOnly || authStore.isAdmin),
)

const application = { name: 'Configuración', slug: 'settings', icon: 'settings' }
</script>

<template>
  <AdminLayout :menus="menus" :application="application" profile-to="/settings/profile">
    <router-view />
  </AdminLayout>
</template>
