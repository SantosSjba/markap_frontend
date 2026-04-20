<script setup lang="ts">
/**
 * DashboardKpiCard
 * Tarjeta reutilizable de KPI para el dashboard de Alquileres.
 * Muestra valor principal, label, tendencia opcional e ícono con color de acento.
 */
interface Props {
  title: string
  value: string | number
  /** Texto pequeño debajo del valor (ej. "respecto al mes anterior") */
  subtitle?: string
  /** Variante de color para el ícono y acento */
  accent?: 'primary' | 'success' | 'warning' | 'error' | 'gold'
  /** Si la card es clickeable, emite click */
  clickable?: boolean
  /** Cargando */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accent: 'primary',
  clickable: false,
  loading: false,
})

const emit = defineEmits<{ click: [] }>()

const accentColor: Record<string, string> = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  gold: 'var(--color-accent-gold)',
}

const accentBg: Record<string, string> = {
  primary: 'var(--color-primary-light)',
  success: 'var(--color-success-light)',
  warning: 'var(--color-warning-light)',
  error: 'var(--color-error-light)',
  gold: 'var(--color-accent-gold-light)',
}
</script>

<template>
  <div
    class="p-4 sm:p-5 rounded-xl border transition-all duration-150"
    :class="{ 'cursor-pointer hover-surface-strong': clickable }"
    :style="{
      backgroundColor: 'var(--color-surface)',
      borderColor: 'var(--color-border)',
      boxShadow: 'var(--shadow-card)',
    }"
    @click="clickable && emit('click')"
  >
    <!-- Skeleton -->
    <template v-if="loading">
      <div class="flex items-center gap-3 animate-pulse">
        <div class="w-10 h-10 rounded-lg shrink-0" :style="{ backgroundColor: 'var(--color-border)' }" />
        <div class="flex-1 space-y-2">
          <div class="h-6 w-16 rounded" :style="{ backgroundColor: 'var(--color-border)' }" />
          <div class="h-3 w-24 rounded" :style="{ backgroundColor: 'var(--color-border)' }" />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p
            class="text-2xl sm:text-3xl font-bold leading-tight truncate"
            :style="{ color: 'var(--color-text-primary)' }"
          >
            {{ value }}
          </p>
          <p
            class="text-sm font-medium mt-0.5 truncate"
            :style="{ color: 'var(--color-text-secondary)' }"
          >
            {{ title }}
          </p>
          <p
            v-if="subtitle"
            class="text-xs mt-1 truncate"
            :style="{ color: 'var(--color-text-muted)' }"
          >
            {{ subtitle }}
          </p>
        </div>

        <!-- Ícono slot con fondo de acento -->
        <div
          v-if="$slots.icon"
          class="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          :style="{ backgroundColor: accentBg[accent] }"
        >
          <span :style="{ color: accentColor[accent] }">
            <slot name="icon" />
          </span>
        </div>
      </div>

      <!-- Slot de contenido extra (badge, barra, etc.) -->
      <div v-if="$slots.extra" class="mt-3 pt-3 border-t" :style="{ borderColor: 'var(--color-border)' }">
        <slot name="extra" />
      </div>
    </template>
  </div>
</template>
