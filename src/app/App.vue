<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
const VueQueryDevtools = import.meta.env.DEV
  ? defineAsyncComponent(() =>
      import('@tanstack/vue-query-devtools').then((m) => m.VueQueryDevtools),
    )
  : null
</script>

<template>
  <router-view />
  <Teleport v-if="VueQueryDevtools" to="body">
    <component :is="VueQueryDevtools" />
  </Teleport>
</template>
