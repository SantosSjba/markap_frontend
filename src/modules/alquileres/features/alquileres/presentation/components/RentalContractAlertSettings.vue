<script setup lang="ts">
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { ConfigToggleRow } from '@shared/components'

defineProps<{
  enableExpirationAlerts: boolean
  enableCollectionAlerts: boolean
}>()

const emit = defineEmits<{
  'update:enableExpirationAlerts': [value: boolean]
  'update:enableCollectionAlerts': [value: boolean]
}>()
</script>

<template>
  <section
    class="p-5 rounded-xl"
    :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
  >
    <div class="flex items-center gap-2 mb-1">
      <AppIcon icon="lucide:bell" :size="20" color="var(--color-primary)" />
      <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
        Alertas y Notificaciones
      </h2>
    </div>
    <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
      Configura por contrato qué alertas recibir. La configuración global del sistema sigue aplicando
      los plazos y tipos de aviso.
    </p>
    <div
      class="rounded-lg overflow-hidden"
      :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
    >
      <ConfigToggleRow
        no-border
        :model-value="enableExpirationAlerts"
        title="Alertas de vencimiento"
        description="Contrato por vencer (30, 60, 90 días) y aviso de nuevo contrato registrado"
        @update:model-value="emit('update:enableExpirationAlerts', $event)"
      />
      <ConfigToggleRow
        :model-value="enableCollectionAlerts"
        title="Alertas de cobranza"
        description="Pagos pendientes y pagos atrasados de este contrato"
        @update:model-value="emit('update:enableCollectionAlerts', $event)"
      />
    </div>
  </section>
</template>
