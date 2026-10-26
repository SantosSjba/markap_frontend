<script setup lang="ts">
import { computed } from 'vue'
import AdminLayout from '@app/layouts/AdminLayout.vue'
import { useProduccionAppLayout } from '../composables/useProduccionAppLayout'
/**
 * ProduccionLayout — shell de TailAdmin (`AdminLayout`) con el menú estático de `produccion`.
 * Notificaciones: filtradas a esta app en el header.
 */

const { application, menus } = useProduccionAppLayout()

const applicationInfo = computed(() =>
  application.value
    ? {
        name: application.value.name,
        slug: application.value.slug,
        icon: application.value.icon,
        color: application.value.color,
      }
    : { name: 'MOCZ · Muebles Orgánicos CZ', slug: 'produccion', icon: 'package', color: '#F4B740' },
)
</script>

<template>
  <AdminLayout
    :menus="menus"
    :application="applicationInfo"
    minimal-user-menu
    profile-to="/produccion/perfil"
    notifications-application-slug="produccion"
  >
    <router-view />
  </AdminLayout>
</template>
