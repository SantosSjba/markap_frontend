<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('contabilidad')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { useContabilidadJournalList } from '../composables/useContabilidadJournal'
import {
  CONTABILIDAD_JOURNAL_STATUS_FILTER_OPTIONS,
  CONTABILIDAD_JOURNAL_STATUS_LABELS,
  type ContabilidadJournalEntryListItemDTO,
} from '../../domain/journal.types'
import { formatPen, journalStatusVariant } from '../../domain/journal.utils'
const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()

const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput, 300)
const statusFilter = ref('')

const listParams = computed(() => ({
  periodId: activePeriod.value?.id,
  status: statusFilter.value || undefined,
  search: debouncedSearch.value.trim() || undefined,
}))

const { data, isLoading, isError, refetch } = useContabilidadJournalList(listParams)
const rows = computed(() => data.value?.entries ?? [])

const columns = [
  { key: 'entryNumber', label: 'N°', align: 'left' as const, sortable: true },
  { key: 'entryDate', label: 'Fecha', align: 'left' as const, sortable: true },
  { key: 'description', label: 'Glosa', align: 'left' as const },
  { key: 'totalDebit', label: 'Debe', align: 'right' as const },
  { key: 'totalCredit', label: 'Haber', align: 'right' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

function statusLabel(status: string) {
  return (
    CONTABILIDAD_JOURNAL_STATUS_LABELS[status as keyof typeof CONTABILIDAD_JOURNAL_STATUS_LABELS] ??
    data.value?.statusLabels?.[status] ??
    status
  )
}

function goNew() {
  void router.push({ name: 'contabilidad-asientos-nuevo' })
}

function goDetail(row: ContabilidadJournalEntryListItemDTO) {
  void router.push({ name: 'contabilidad-asiento-detalle', params: { id: row.id } })
}
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:book-open-text"
      title="Libro diario"
      subtitle="Asientos contables del periodo activo. Partida doble y numeración correlativa."
    >
      <template #actions>
        <BaseButton v-if="canWrite" variant="primary" :disabled="!activePeriod" @click="goNew">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1.5" />
          Nuevo asiento
        </BaseButton>
      </template>
    </PageHeader>

    <p v-if="!activePeriod" class="text-sm text-warning-600 dark:text-orange-400">
      Configure el periodo activo en Configuración ? Contexto contable. para ver y registrar asientos.
    </p>

    <BaseCard padding="none" class="block overflow-hidden">
      <DataTable
        :columns="columns"
        :data="rows"
        :loading="isLoading"
        empty-text="Sin asientos en este periodo."
        row-key="id"
      >
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar por glosa o número…" />
          </div>
          <div class="w-full sm:w-[200px] min-w-0 shrink-0">
            <FormSelect
              v-model="statusFilter"
              :options="CONTABILIDAD_JOURNAL_STATUS_FILTER_OPTIONS"
            />
          </div>
        </template>

        <template #row="{ row }">
          <td class="py-3 px-4 font-mono text-sm font-semibold">
            {{ (row as ContabilidadJournalEntryListItemDTO).entryNumber }}
          </td>
          <td class="py-3 px-4 text-sm whitespace-nowrap">
            {{ (row as ContabilidadJournalEntryListItemDTO).entryDate }}
          </td>
          <td class="py-3 px-4 text-sm max-w-md truncate" :title="(row as ContabilidadJournalEntryListItemDTO).description">
            {{ (row as ContabilidadJournalEntryListItemDTO).description }}
          </td>
          <td class="py-3 px-4 text-sm text-right font-mono">
            {{ formatPen((row as ContabilidadJournalEntryListItemDTO).totalDebit) }}
          </td>
          <td class="py-3 px-4 text-sm text-right font-mono">
            {{ formatPen((row as ContabilidadJournalEntryListItemDTO).totalCredit) }}
          </td>
          <td class="py-3 px-4">
            <Badge :variant="journalStatusVariant((row as ContabilidadJournalEntryListItemDTO).status)">
              {{ statusLabel((row as ContabilidadJournalEntryListItemDTO).status) }}
            </Badge>
          </td>
          <td class="py-3 px-4 text-right">
            <BaseButton variant="ghost" size="sm" @click="goDetail(row as ContabilidadJournalEntryListItemDTO)">
              <AppIcon icon="lucide:eye" :size="16" />
            </BaseButton>
          </td>
        </template>

        <template v-if="isError" #empty>
          <div class="py-8 text-center">
            <BaseButton variant="secondary" @click="refetch()">Reintentar</BaseButton>
          </div>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
