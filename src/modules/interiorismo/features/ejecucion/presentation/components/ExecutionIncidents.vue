<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, filterActions } = useApplicationAccess('interiorismo')

import { computed, reactive, ref, toRef } from 'vue'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import type { HelpTooltipItem } from '@shared/presentation/components/ui/HelpTooltip.vue'
import HelpTooltip from '@shared/presentation/components/ui/HelpTooltip.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import type { InteriorExecutionIncidentDto } from '../../domain/execution.types'
import { useCreateExecutionIncident, useUpdateExecutionIncident } from '../composables/useInteriorExecution'
import { INCIDENT_STATUS_LABELS, SEVERITY_LABELS } from '../labels'
import { INCIDENT_STATUS_VARIANT, SEVERITY_VARIANT } from '../execution-ui'
/** ExecutionIncidents — incidencias de obra: registro, seguimiento (en curso) y cierre. */

const props = defineProps<{ projectId: string; incidents: readonly InteriorExecutionIncidentDto[] }>()

const HELP: HelpTooltipItem[] = [
  { icon: 'lucide:triangle-alert', term: 'Incidencia', text: 'Cualquier problema en obra: medidas que no coinciden, material dañado, retrasos de proveedor…' },
  { icon: 'lucide:signal', term: 'Severidad', text: 'Baja, Media o Alta según cuánto afecta la entrega o el costo.' },
  { icon: 'lucide:loader', term: 'Estados', text: 'Abierta → En curso (se está resolviendo) → Cerrada. Una cerrada se puede reabrir.' },
]
const filter = ref<'OPEN' | 'ALL'>('OPEN')
const openCount = computed(() => props.incidents.filter((i) => i.status !== 'CLOSED').length)
const tabs = computed(() => [
  { id: 'OPEN' as const, label: `Abiertas · ${openCount.value}` },
  { id: 'ALL' as const, label: `Todas · ${props.incidents.length}` },
])
const rows = computed(() =>
  [...props.incidents].filter((i) => filter.value === 'ALL' || i.status !== 'CLOSED').sort((a, b) => b.reportedAt.localeCompare(a.reportedAt)),
)

const pid = toRef(props, 'projectId')
const createInc = useCreateExecutionIncident(pid)
const updateInc = useUpdateExecutionIncident(pid)

function setStatus(i: InteriorExecutionIncidentDto, status: string) {
  updateInc.mutate({ incidentId: i.id, payload: { status, closedAt: status === 'CLOSED' ? new Date().toISOString() : null } })
}
const actionsFor = (i: InteriorExecutionIncidentDto) =>
  filterActions(
    i.status === 'CLOSED'
      ? [{ label: 'Reabrir', icon: 'lucide:rotate-ccw', onClick: () => setStatus(i, 'OPEN') }]
      : [
          ...(i.status === 'OPEN' ? [{ label: 'Marcar en curso', icon: 'lucide:loader', onClick: () => setStatus(i, 'IN_PROGRESS') }] : []),
          { label: 'Cerrar incidencia', icon: 'lucide:check', onClick: () => setStatus(i, 'CLOSED') },
        ],
  )

// ── Registro ──
const FORM_ID = 'interior-incident-form'
const formOpen = ref(false)
const severityOptions = Object.entries(SEVERITY_LABELS).map(([value, label]) => ({ value, label }))
const { defineComponentBinds, handleSubmit, resetForm } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      severity: yup.string().required(),
      title: yup.string().trim().required('Describe la incidencia en pocas palabras').max(200, 'Máximo 200 caracteres'),
      description: yup.string().trim(),
      reportedAt: yup.string().required('Indique la fecha'),
    }),
  ),
})
/** `reactive` desenvuelve los Ref de `defineComponentBinds` al usarlos como `binds.campo` en la plantilla. */
const binds = reactive({
  severity: defineComponentBinds('severity'),
  title: defineComponentBinds('title'),
  description: defineComponentBinds('description'),
  reportedAt: defineComponentBinds('reportedAt'),
})
function openForm() {
  resetForm({ values: { severity: 'MEDIUM', title: '', description: '', reportedAt: toCalendarDateString() } })
  formOpen.value = true
}
const onSubmit = handleSubmit(async (v) => {
  await createInc.mutateAsync({ severity: v.severity, title: v.title, description: v.description || null, reportedAt: `${v.reportedAt}T12:00:00.000Z` })
  formOpen.value = false
})

const columns = [
  { key: 'title', label: 'Incidencia' },
  { key: 'severity', label: 'Severidad' },
  { key: 'status', label: 'Estado' },
  { key: 'reportedAt', label: 'Reportada' },
  { key: 'actions', label: '', align: 'right' as const },
]
const asInc = (row: unknown) => row as InteriorExecutionIncidentDto
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <BaseTabs v-model="filter" :tabs="tabs" variant="segmented" />
      <HelpTooltip title="Incidencias de obra" :items="HELP" width="w-80" />
      <BaseButton v-if="canWrite" variant="primary" size="sm" icon="lucide:plus" class="sm:ml-auto" @click="openForm">Registrar incidencia</BaseButton>
    </div>
    <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <DataTable :columns="columns" :data="rows" row-key="id" :empty-text="filter === 'OPEN' ? 'Sin incidencias abiertas.' : 'Sin incidencias registradas.'">
        <template #row="{ row }">
          <td class="px-4 py-3">
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">{{ asInc(row).title }}</p>
            <p v-if="asInc(row).description" class="line-clamp-1 text-theme-xs text-gray-500 dark:text-gray-400">{{ asInc(row).description }}</p>
          </td>
          <td class="px-4 py-3"><Badge :variant="SEVERITY_VARIANT[asInc(row).severity] ?? 'neutral'">{{ SEVERITY_LABELS[asInc(row).severity] ?? asInc(row).severity }}</Badge></td>
          <td class="px-4 py-3"><Badge :variant="INCIDENT_STATUS_VARIANT[asInc(row).status] ?? 'neutral'">{{ INCIDENT_STATUS_LABELS[asInc(row).status] ?? asInc(row).status }}</Badge></td>
          <td class="px-4 py-3 text-theme-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
            {{ formatShortDate(asInc(row).reportedAt) }}
            <span v-if="asInc(row).closedAt" class="block">cerrada {{ formatShortDate(asInc(row).closedAt!) }}</span>
          </td>
          <td class="px-4 py-3 text-right"><ActionsDropdown :items="actionsFor(asInc(row))" /></td>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="formOpen" title="Registrar incidencia" size="md">
      <form :id="FORM_ID" class="space-y-4" @submit.prevent="onSubmit">
        <FormInput v-bind="binds.title" label="Incidencia" placeholder="Ej. Medidas del mueble no coinciden" required />
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormSelect v-bind="binds.severity" label="Severidad" :options="severityOptions" required />
          <FormInput v-bind="binds.reportedAt" type="date" label="Fecha" required />
        </div>
        <FormTextarea v-bind="binds.description" label="Detalle" :rows="3" />
      </form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" @click="formOpen = false">Cancelar</BaseButton>
          <BaseButton variant="primary" type="submit" :form="FORM_ID" :loading="createInc.isPending.value">Guardar</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
