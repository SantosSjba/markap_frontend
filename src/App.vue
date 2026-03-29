<script setup lang="ts">
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'

/**
 * App — raíz: rutas + TanStack Query Devtools.
 * Devtools van con Teleport a body: si un modal pone aria-hidden en #app, el botón del
 * panel no puede quedar “oculto” para AT y enfocado a la vez (warning del navegador).
 */
</script>

<template>
  <router-view />
  <Teleport to="body">
    <VueQueryDevtools />
  </Teleport>
</template>
