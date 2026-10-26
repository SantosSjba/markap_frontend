<script setup lang="ts">
import { computed } from 'vue'
import AdminLayout from '@app/layouts/AdminLayout.vue'
import { useContabilidadAppLayout } from '../composables/useContabilidadAppLayout'
import ContabilidadContextInfoBar from '../components/ContabilidadContextInfoBar.vue'
import { useContabilidadContext } from '../composables/useContabilidadContext'
/**
 * ContabilidadLayout — shell de TailAdmin (`AdminLayout`) con los menús de la BD por slug `contabilidad`.
 * Notificaciones: filtradas a esta app en el header.
 */

const { application, menus, menusLoading } = useContabilidadAppLayout()

const applicationInfo = computed(() =>
  application.value
    ? {
        name: application.value.name,
        slug: application.value.slug,
        icon: application.value.icon,
        color: application.value.color,
      }
    : { name: 'Sistema Contable', slug: 'contabilidad', icon: 'calculator', color: '#8B5CF6' },
)

useContabilidadContext()
</script>

<template>
  <AdminLayout
    :menus="menus"
    :application="applicationInfo"
    :loading="menusLoading"
    minimal-user-menu
    profile-to="/contabilidad/perfil"
    notifications-application-slug="contabilidad"
  >
    <ContabilidadContextInfoBar />
    <router-view />
  </AdminLayout>
</template>
