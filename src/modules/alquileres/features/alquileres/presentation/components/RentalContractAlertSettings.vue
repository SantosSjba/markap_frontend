<script setup lang="ts">
import { ConfigToggleRow, FormSectionCard } from '@shared/components'

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
  <FormSectionCard
    title="Alertas y Notificaciones"
    subtitle="Configura por contrato qué alertas recibir. La configuración global del sistema sigue aplicando los plazos y tipos de aviso."
    icon="lucide:bell"
  >
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
  </FormSectionCard>
</template>
