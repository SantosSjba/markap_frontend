<script setup lang="ts">
import { BaseButton } from '@shared/components'

/**
 * NotFoundView
 * 404 error page
 */
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-gray-200">404</h1>
      <h2 class="text-2xl font-bold text-gray-900 mt-4">Página no encontrada</h2>
      <p class="text-gray-600 mt-2 mb-8">
        Lo sentimos, la página que buscas no existe o ha sido movida.
      </p>
      <router-link to="/">
        <BaseButton>Volver al inicio</BaseButton>
      </router-link>
    </div>
  </div>
</template>
