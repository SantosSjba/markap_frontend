<script setup lang="ts">
import { computed } from 'vue'
import AdminLayout from '@app/layouts/AdminLayout.vue'
import { useVentasAppLayout } from '../composables/useVentasAppLayout'
/**
 * VentasLayout — shell de TailAdmin (`AdminLayout`) con el menú estático de `ventas`.
 * Notificaciones: filtradas a esta app en el header.
 */

const { application, menus } = useVentasAppLayout()

const applicationInfo = computed(() =>
  application.value
    ? {
        name: application.value.name,
        slug: application.value.slug,
        icon: application.value.icon,
        color: application.value.color,
      }
    : { name: 'Ventas Inmobiliarias', slug: 'ventas', icon: 'home', color: '#3B82F6' },
)
</script>

<template>
  <AdminLayout
    :menus="menus"
    :application="applicationInfo"
    minimal-user-menu
    profile-to="/ventas/perfil"
    notifications-application-slug="ventas"
  >
    <router-view />
  </AdminLayout>
</template>
