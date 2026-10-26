<script setup lang="ts">
import type { MenuItem } from '@shared/domain/menu.types'
import AdminLayout from './AdminLayout.vue'
/**
 * MainLayout — shell general (dashboard) sobre `AdminLayout` de TailAdmin.
 */

const menus: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home', path: '/dashboard', order: 1 },
]

const application = { name: 'MARKAP', slug: 'dashboard', icon: 'layout-dashboard' }
</script>

<template>
  <AdminLayout :menus="menus" :application="application">
    <router-view />
  </AdminLayout>
</template>
