<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('contabilidad')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { computed, ref } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { formatDateTime } from '@shared/utils/formatters'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import {
  CPE_DOCUMENT_KIND_OPTIONS,
  CPE_SUNAT_STATUS_OPTIONS,
  type ContabilidadCpeLogDTO,
} from '../../domain/cpe-log.types'
import {
  useContabilidadCpeLogs,
  useContabilidadCreateCpeLog,
} from '../composables/useContabilidadCpeLog'
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
    {
      onSuccess: () => {
        modalOpen.value = false
        void refetch()
      },
    },
  )
}
</script>

<template>
  <div class="w-full space-y-6">
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

    <LoadingState v-if="isLoading" />

    <BaseCard v-else padding="none" class="block overflow-hidden">
      <DataTable
        :columns="[
          { key: 'c0', label: 'Fecha' },
          { key: 'c1', label: 'Tipo' },
          { key: 'c2', label: 'Referencia' },
          { key: 'c3', label: 'Estado' },
          { key: 'c4', label: 'CDR / Hash' },
        ]"
        :data="rows"
        empty-text="Sin registros CPE para el periodo"
      >
        <template #row="{ row }">
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
        </template>
      </DataTable>
    </BaseCard>

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
          <BaseButton v-if="canWrite" type="submit" variant="primary" :loading="saving">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
