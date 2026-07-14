<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  BaseButton,
  AppIcon,
  BaseModal,
  Badge,
  FormInput,
  FormSelect,
  FormTextarea,
  PageHeader,
  SearchInput,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { formatDateTime } from '@/shared/utils/formatters'
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import {
  CPE_DOCUMENT_KIND_OPTIONS,
  CPE_SUNAT_STATUS_OPTIONS,
  type ContabilidadCpeLogDTO,
} from '../../domain/cpe-log.types'
import { useContabilidadCpeLogs, useContabilidadCreateCpeLog } from '../../application/useContabilidadCpeLog'

const { activePeriod } = useContabilidadActivePeriod()

const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const kindFilter = ref('')

const listParams = computed(() => ({
  periodId: activePeriod.value?.id,
  documentKind: kindFilter.value || undefined,
  search: debouncedSearch.value.trim() || undefined,
}))

const { data, isLoading, refetch } = useContabilidadCpeLogs(listParams)
const rows = computed(() => data.value?.logs ?? [])

const { mutate: createLog, isPending: saving } = useContabilidadCreateCpeLog()

const modalOpen = ref(false)
const form = ref({
  documentKind: 'FACTURA',
  documentRef: '',
  sunatStatus: 'REGISTERED',
  xmlHash: '',
  cdrReference: '',
  notes: '',
})

const kindOptions = [
  { value: '', label: 'Todos los tipos' },
  ...CPE_DOCUMENT_KIND_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
]

const docKindOptions = CPE_DOCUMENT_KIND_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
const statusOptions = CPE_SUNAT_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))

function statusVariant(status: string): 'success' | 'warning' | 'neutral' | 'error' {
  if (status === 'ACCEPTED') return 'success'
  if (status === 'REJECTED') return 'error'
  if (status === 'SENT') return 'warning'
  return 'neutral'
}

function openNew() {
  form.value = {
    documentKind: 'FACTURA',
    documentRef: '',
    sunatStatus: 'REGISTERED',
    xmlHash: '',
    cdrReference: '',
    notes: '',
  }
  modalOpen.value = true
}

function submitForm() {
  if (!form.value.documentRef.trim()) {
    void markapAlert.toast.warning('Referencia del comprobante obligatoria')
    return
  }
  createLog(
    {
      periodId: activePeriod.value?.id ?? null,
      documentKind: form.value.documentKind,
      documentRef: form.value.documentRef.trim(),
      sunatStatus: form.value.sunatStatus,
      xmlHash: form.value.xmlHash.trim() || null,
      cdrReference: form.value.cdrReference.trim() || null,
      notes: form.value.notes.trim() || null,
    },
    { onSuccess: () => { modalOpen.value = false; void refetch() } },
  )
}
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:file-badge"
      title="Trazabilidad CPE"
      subtitle="Registro local de comprobantes electrónicos (sin envío OSE/PSE)."
    >
      <template #actions>
        <BaseButton variant="primary" :disabled="!activePeriod" @click="openNew">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
          Registrar
        </BaseButton>
      </template>
    </PageHeader>

    <div class="flex flex-col sm:flex-row gap-3">
      <SearchInput v-model="searchInput" placeholder="Buscar por referencia…" class="w-full max-w-md" />
      <FormSelect v-model="kindFilter" :options="kindOptions" class="w-full sm:w-56" />
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div
      v-else
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Fecha</th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Tipo</th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Referencia</th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Estado</th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">CDR / Hash</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="border-b last:border-b-0"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <td class="py-2.5 px-4 text-xs">{{ formatDateTime((row as ContabilidadCpeLogDTO).createdAt) }}</td>
            <td class="py-2.5 px-4">{{ (row as ContabilidadCpeLogDTO).documentKind }}</td>
            <td class="py-2.5 px-4 font-mono">{{ (row as ContabilidadCpeLogDTO).documentRef }}</td>
            <td class="py-2.5 px-4">
              <Badge :variant="statusVariant((row as ContabilidadCpeLogDTO).sunatStatus)">
                {{ (row as ContabilidadCpeLogDTO).sunatStatus }}
              </Badge>
            </td>
            <td class="py-2.5 px-4 text-xs font-mono truncate max-w-[200px]" :title="(row as ContabilidadCpeLogDTO).cdrReference ?? (row as ContabilidadCpeLogDTO).xmlHash ?? ''">
              {{ (row as ContabilidadCpeLogDTO).cdrReference ?? (row as ContabilidadCpeLogDTO).xmlHash ?? '—' }}
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="5" class="py-8 text-center" :style="{ color: 'var(--color-text-muted)' }">
              Sin registros CPE para el periodo
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal v-model="modalOpen" title="Registrar trazabilidad CPE" size="md">
      <form class="space-y-4" @submit.prevent="submitForm">
        <FormSelect v-model="form.documentKind" label="Tipo comprobante" :options="docKindOptions" />
        <FormInput v-model="form.documentRef" label="Referencia (serie-número)" required placeholder="F001-123" />
        <FormSelect v-model="form.sunatStatus" label="Estado" :options="statusOptions" />
        <FormInput v-model="form.xmlHash" label="Hash XML (opcional)" />
        <FormInput v-model="form.cdrReference" label="Referencia CDR (opcional)" />
        <FormTextarea v-model="form.notes" label="Notas" :rows="2" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="saving">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
