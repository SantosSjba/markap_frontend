<script setup lang="ts">
import { computed } from 'vue'
import AdminLayout from '@app/layouts/AdminLayout.vue'
import { useInteriorismoAppLayout } from '../composables/useInteriorismoAppLayout'
/**
 * InteriorismoLayout — shell de TailAdmin (`AdminLayout`) con el menú estático de `interiorismo`.
 * Notificaciones: filtradas a esta app en el header.
 */

const { application, menus } = useInteriorismoAppLayout()

const applicationInfo = computed(() =>
  application.value
    ? {
        name: application.value.name,
        slug: application.value.slug,
        icon: application.value.icon,
        color: application.value.color,
      }
    : { name: 'Carolina Zavala Interiorismo', slug: 'interiorismo', icon: 'palette', color: '#E5533D' },
)
</script>

<template>
  <AdminLayout
    :menus="menus"
    :application="applicationInfo"
    minimal-user-menu
    profile-to="/interiorismo/perfil"
    notifications-application-slug="interiorismo"
  >
    <router-view />
  </AdminLayout>
</template>
