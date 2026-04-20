<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@modules/auth'
import AppIcon from '@shared/components/ui/AppIcon.vue'

const authStore = useAuthStore()

const greetingHour = new Date().getHours()
const greeting =
  greetingHour < 12 ? 'Buenos días' : greetingHour < 19 ? 'Buenas tardes' : 'Buenas noches'
const firstName = computed(() => authStore.user?.firstName ?? 'Usuario')

const placeholderKpis = [
  { label: 'Oportunidades activas', icon: 'lucide:target' as const },
  { label: 'Propiedades en cartera', icon: 'lucide:building-2' as const },
  { label: 'Negociaciones en curso', icon: 'lucide:handshake' as const },
  { label: 'Cierres del mes', icon: 'lucide:circle-check' as const },
]
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          {{ greeting }}, {{ firstName }} 👋
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Resumen de ventas y negociaciones
        </p>
      </div>
      <p class="text-sm shrink-0" :style="{ color: 'var(--color-text-muted)' }">
        {{
          new Date().toLocaleDateString('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        }}
      </p>
    </div>

    <div
      class="rounded-xl border p-8 sm:p-10 text-center"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }"
    >
      <div class="flex flex-wrap items-center justify-center gap-2 mb-5">
        <span
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          :style="{
            backgroundColor: 'var(--color-warning-light)',
            color: 'var(--color-warning)',
          }"
        >
          <AppIcon icon="lucide:construction" :size="14" />
          En desarrollo
        </span>
      </div>
      <div
        class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style="background-color: var(--color-primary-light); color: var(--color-primary);"
      >
        <AppIcon icon="lucide:layout-dashboard" :size="32" />
      </div>
      <h2 class="text-xl sm:text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
        Dashboard de ventas
      </h2>
      <p class="mt-3 max-w-xl mx-auto text-sm" :style="{ color: 'var(--color-text-secondary)' }">
        Las métricas, gráficos y alertas de este módulo están en construcción. Pronto podrás ver
        oportunidades, propiedades y el avance de tus negociaciones desde aquí.
      </p>
    </div>

    <div>
      <h3 class="text-xs font-semibold uppercase tracking-wide mb-3" :style="{ color: 'var(--color-text-muted)' }">
        Vista previa (sin datos)
      </h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="kpi in placeholderKpis"
          :key="kpi.label"
          class="rounded-xl border p-4 text-left opacity-60 pointer-events-none select-none"
          :style="{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }"
        >
          <div class="flex items-center gap-2 mb-2" :style="{ color: 'var(--color-text-muted)' }">
            <AppIcon :icon="kpi.icon" :size="18" />
            <span class="text-xs font-medium line-clamp-2">{{ kpi.label }}</span>
          </div>
          <p class="text-2xl font-bold tabular-nums" :style="{ color: 'var(--color-text-muted)' }">
            —
          </p>
          <p class="text-[11px] mt-1" :style="{ color: 'var(--color-text-muted)' }">
            Próximamente
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
