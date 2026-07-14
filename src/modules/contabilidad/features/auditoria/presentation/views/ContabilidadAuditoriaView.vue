<script setup lang="ts">
import { computed, ref } from 'vue'
import { Badge, DataTable, FormInput, FormSelect, PageHeader } from '@shared/components'
import { useContabilidadAuditLogs } from '../../application/useContabilidadAudit'
import type { ContabilidadAuditLogDTO } from '../../domain/audit.types'
import { formatDateTime } from '@/shared/utils/formatters'

const entityTypeFilter = ref('')
const actionFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')

const listParams = computed(() => ({
  entityType: entityTypeFilter.value || undefined,
  action: actionFilter.value || undefined,
  dateFrom: dateFrom.value || undefined,
  dateTo: dateTo.value || undefined,
  limit: '100',
}))

const { data, isLoading } = useContabilidadAuditLogs(listParams)
const rows = computed(() => data.value?.logs ?? [])
const actionLabels = computed(() => data.value?.actionLabels ?? {})
const entityTypeLabels = computed(() => data.value?.entityTypeLabels ?? {})

const columns = [
  { key: 'createdAt', label: 'Fecha' },
  { key: 'action', label: 'Acción' },
  { key: 'entity', label: 'Entidad' },
  { key: 'summary', label: 'Detalle' },
  { key: 'ruc', label: 'RUC' },
]

function formatDate(iso: string) {
  return formatDateTime(iso)
}
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:shield-check"
      title="Auditoría contable"
      subtitle="Trazabilidad de publicaciones, reversas, cierres de periodo y cambios maestros."
    />

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FormInput v-model="dateFrom" label="Desde" type="date" />
      <FormInput v-model="dateTo" label="Hasta" type="date" />
      <FormSelect
        v-model="entityTypeFilter"
        label="Tipo entidad"
        :options="[
          { value: '', label: 'Todos' },
          ...Object.entries(entityTypeLabels).map(([value, label]) => ({ value, label })),
        ]"
      />
      <FormSelect
        v-model="actionFilter"
        label="Acción"
        :options="[
          { value: '', label: 'Todas' },
          ...Object.entries(actionLabels).map(([value, label]) => ({ value, label })),
        ]"
      />
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin registros." row-key="id">
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm whitespace-nowrap">{{ formatDate((row as ContabilidadAuditLogDTO).createdAt) }}</td>
          <td class="py-3 px-4">
            <Badge variant="info">{{ actionLabels[(row as ContabilidadAuditLogDTO).action] ?? (row as ContabilidadAuditLogDTO).action }}</Badge>
          </td>
          <td class="py-3 px-4 text-sm">{{ entityTypeLabels[(row as ContabilidadAuditLogDTO).entityType] ?? (row as ContabilidadAuditLogDTO).entityType }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ContabilidadAuditLogDTO).summary }}</td>
          <td class="py-3 px-4 text-sm font-mono">{{ (row as ContabilidadAuditLogDTO).legalEntityRuc ?? '—' }}</td>
        </template>
      </DataTable>
    </div>
  </div>
</template>
