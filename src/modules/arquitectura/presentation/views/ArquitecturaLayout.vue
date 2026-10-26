<script setup lang="ts">
import { computed } from 'vue'
import AdminLayout from '@app/layouts/AdminLayout.vue'
import { useArquitecturaAppLayout } from '../composables/useArquitecturaAppLayout'
/**
 * ArquitecturaLayout — shell de TailAdmin (`AdminLayout`) con los menús de la BD por slug `arquitectura`.
 * Notificaciones: filtradas a esta app en el header.
 */

const { application, menus, menusLoading } = useArquitecturaAppLayout()

const applicationInfo = computed(() =>
  application.value
    ? {
        name: application.value.name,
        slug: application.value.slug,
        icon: application.value.icon,
        color: application.value.color,
      }
    : { name: 'HITO Arquitectura', slug: 'arquitectura', icon: 'building', color: '#2DBE7E' },
)
</script>

<template>
  <AdminLayout
    :menus="menus"
    :application="applicationInfo"
    :loading="menusLoading"
    minimal-user-menu
    profile-to="/arquitectura/perfil"
    notifications-application-slug="arquitectura"
  >
    <router-view />
  </AdminLayout>
</template>
