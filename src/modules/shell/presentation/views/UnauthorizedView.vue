<script setup lang="ts">
import { BaseButton } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'

/**
 * UnauthorizedView
 * 403 access denied page
 */
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="text-center">
      <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AppIcon icon="lucide:triangle-alert" :size="40" class="text-red-500" color="currentColor" />
      </div>
      <h2 class="text-2xl font-bold text-gray-900">Acceso Denegado</h2>
      <p class="text-gray-600 mt-2 mb-8">
        No tienes permisos para acceder a esta página.
      </p>
      <div class="flex gap-4 justify-center">
        <router-link to="/">
          <BaseButton>Ir al inicio</BaseButton>
        </router-link>
        <router-link to="/auth/login">
          <BaseButton variant="outline">Iniciar sesión</BaseButton>
        </router-link>
      </div>
    </div>
  </div>
</template>
