<script setup lang="ts">
import { computed } from 'vue'
import AdminLayout from '@app/layouts/AdminLayout.vue'
import { useProduccionAppLayout } from '../composables/useProduccionAppLayout'
/**
 * ProduccionLayout — shell de TailAdmin (`AdminLayout`) con los menús de la BD por slug `produccion`.
 * Notificaciones: filtradas a esta app en el header.
 */

const { application, menus, menusLoading } = useProduccionAppLayout()

const applicationInfo = computed(() =>
  application.value
    ? {
        name: application.value.name,
        slug: application.value.slug,
        icon: application.value.icon,
        color: application.value.color,
      }
    : { name: 'Producción de Muebles', slug: 'produccion', icon: 'package', color: '#F4B740' },
)
</script>

<template>
  <AdminLayout
    :menus="menus"
    :application="applicationInfo"
    :loading="menusLoading"
    minimal-user-menu
    profile-to="/produccion/perfil"
    notifications-application-slug="produccion"
  >
    <router-view />
  </AdminLayout>
</template>
