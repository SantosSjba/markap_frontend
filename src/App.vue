<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

/**
 * App — raíz: rutas + TanStack Query Devtools (panel flotante: queries, cache, estados).
 * El paquete sustituye el componente por no-op cuando NODE_ENV !== 'development' en el bundle.
 */
</script>

<template>
  <router-view />
  <VueQueryDevtools />
</template>
