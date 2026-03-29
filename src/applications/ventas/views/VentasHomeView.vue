<script setup lang="ts">
import AppIcon from '@shared/components/ui/AppIcon.vue'
</script>

<template>
  <div class="animate-fade-in max-w-lg">
    <div
      class="rounded-xl border p-8 text-center"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }"
    >
      <div
        class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style="background-color: var(--color-primary-light); color: var(--color-primary);"
      >
        <AppIcon icon="lucide:construction" :size="28" />
      </div>
      <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
        Ventas
      </h1>
      <p class="mt-2 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
        El dashboard y las métricas de este módulo están en desarrollo.
      </p>
      <p class="mt-1 text-xs" :style="{ color: 'var(--color-text-muted)' }">
        Pronto podrás ver propiedades, clientes y negociaciones desde aquí.
      </p>
    </div>
  </div>
</template>
