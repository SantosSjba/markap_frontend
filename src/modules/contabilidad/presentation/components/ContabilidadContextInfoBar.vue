<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { AppIcon, BaseButton } from '@shared/components'
import { CONTABILIDAD_PERIOD_STATUS_LABELS } from '@modules/contabilidad/features/periodos/domain/period.types'
import { useContabilidadContext } from '../composables/useContabilidadContext'

const { initializing, initError, activeEntity, activePeriod, retryInit } = useContabilidadContext()

const contextLabel = computed(() => {
  if (initializing.value) return 'Inicializando contexto contable…'
  if (!activeEntity.value) return 'Sin empresa activa'
  const entity = `${activeEntity.value.ruc} — ${activeEntity.value.legalName}`
  if (!activePeriod.value) return entity
  const period = `${activePeriod.value.label} ${activePeriod.value.year}`
  const status = CONTABILIDAD_PERIOD_STATUS_LABELS[activePeriod.value.status]
  return `${entity} · ${period} · ${status}`
})

const periodOpen = computed(() => activePeriod.value?.status === 'OPEN')
</script>

<template>
  <div
    class="mb-4 flex flex-col gap-2 rounded-lg border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
    :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
  >
    <div
      v-if="initError"
      class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full"
    >
      <p class="text-xs flex-1" :style="{ color: 'var(--color-danger)' }">
        {{ initError }}
      </p>
      <BaseButton variant="secondary" size="sm" @click="retryInit">Reintentar</BaseButton>
    </div>

    <template v-else>
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <AppIcon icon="lucide:building-2" :size="15" color="var(--color-primary)" class="shrink-0" />
        <AppIcon
          v-if="initializing"
          icon="line-md:loading-loop"
          :size="14"
          color="var(--color-primary)"
          class="shrink-0"
        />
        <p class="truncate text-xs sm:text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          {{ contextLabel }}
        </p>
        <span
          v-if="activePeriod && !initializing"
          class="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full shrink-0"
          :style="{
            backgroundColor: periodOpen ? 'var(--color-primary-soft)' : 'var(--color-surface-elevated)',
            color: periodOpen ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }"
        >
          {{ CONTABILIDAD_PERIOD_STATUS_LABELS[activePeriod.status] }}
        </span>
      </div>

      <RouterLink
        to="/contabilidad/configuracion?tab=contexto"
        class="text-xs font-medium shrink-0 hover:underline"
        :style="{ color: 'var(--color-primary)' }"
      >
        Cambiar en configuración
      </RouterLink>
    </template>
  </div>
</template>
