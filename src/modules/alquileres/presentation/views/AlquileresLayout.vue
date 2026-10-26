<script setup lang="ts">
import { computed } from 'vue'
import AdminLayout from '@app/layouts/AdminLayout.vue'
import { useAlquileresAppLayout } from '../composables/useAlquileresAppLayout'
/**
 * AlquileresLayout — shell de TailAdmin (`AdminLayout`) con el menú estático de `alquileres`.
 * Notificaciones: filtradas a esta app en el header.
 */

const { application, menus } = useAlquileresAppLayout()

const applicationInfo = computed(() =>
  application.value
    ? {
        name: application.value.name,
        slug: application.value.slug,
        icon: application.value.icon,
        color: application.value.color,
      }
    : { name: 'Alquileres', slug: 'alquileres', icon: 'key', color: '#0BB0BE' },
)
</script>

<template>
  <AdminLayout
    :menus="menus"
    :application="applicationInfo"
    minimal-user-menu
    profile-to="/alquileres/perfil"
    notifications-application-slug="alquileres"
  >
    <router-view />
  </AdminLayout>
</template>
