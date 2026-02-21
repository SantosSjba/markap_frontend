<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { BaseButton } from '@shared/components'

const route = useRoute()
const router = useRouter()
const clientId = route.params.id as string

const goBack = () => router.push('/alquileres/clientes')
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Editar Cliente
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          ID: {{ clientId }} — Formulario en construcción
        </p>
      </div>
    </div>
    <div
      class="p-8 rounded-xl border text-center"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }"
    >
      <p class="mb-4" :style="{ color: 'var(--color-text-secondary)' }">
        El formulario de edición de cliente estará disponible próximamente.
      </p>
      <BaseButton variant="outline" @click="goBack">Volver al listado</BaseButton>
    </div>
  </div>
</template>
