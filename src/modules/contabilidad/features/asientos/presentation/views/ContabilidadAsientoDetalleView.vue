<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin } = useApplicationAccess('contabilidad')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { formatDateTime } from '@shared/utils/formatters'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import {
  useContabilidadJournalDetail,
  useContabilidadDeleteJournal,
  useContabilidadPostJournal,
  useContabilidadReverseJournal,
} from '../composables/useContabilidadJournal'
import {
  CONTABILIDAD_JOURNAL_STATUS,
  CONTABILIDAD_JOURNAL_STATUS_LABELS,
} from '../../domain/journal.types'
import { formatPen, journalStatusVariant } from '../../domain/journal.utils'
import { formatMoney } from '../../../../presentation/composables/useContabilidadCurrencies'
const route = useRoute()
const router = useRouter()

const entryId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

const { data, isLoading, isError, refetch } = useContabilidadJournalDetail(entryId)
const entry = computed(() => data.value?.entry)

const { mutate: deleteDraft, isPending: deleting } = useContabilidadDeleteJournal()
const { mutate: postJournal, isPending: posting } = useContabilidadPostJournal()
const { mutate: reverseJournal, isPending: reversing } = useContabilidadReverseJournal()

const statusLabel = computed(() => {
  const status = entry.value?.status ?? ''
  return (
    CONTABILIDAD_JOURNAL_STATUS_LABELS[status as keyof typeof CONTABILIDAD_JOURNAL_STATUS_LABELS] ??
    status
  )
})

const isDraft = computed(() => entry.value?.status === CONTABILIDAD_JOURNAL_STATUS.DRAFT)
const isPosted = computed(() => entry.value?.status === CONTABILIDAD_JOURNAL_STATUS.POSTED)

function goBack() {
  void router.push({ name: 'contabilidad-asientos-libro-diario' })
}

function goEdit() {
  if (!entry.value) return
  void router.push({ name: 'contabilidad-asiento-editar', params: { id: entry.value.id } })
}

function printEntry() {
  window.print()
}

async function confirmDelete() {
  if (!entry.value) return
  const ok = await markapAlert.confirmDanger({
    title: 'Eliminar borrador',
    text: `¿Eliminar el asiento N° ${entry.value.entryNumber}?`,
    confirmText: 'Eliminar',
  })
  if (!ok) return
  deleteDraft(entry.value.id, {
    onSuccess: () => void router.push({ name: 'contabilidad-asientos-libro-diario' }),
  })
}

async function confirmPost() {
  if (!entry.value) return
  const ok = await markapAlert.confirm({
    title: 'Publicar asiento',
    text: 'El asiento quedará registrado en el libro diario. No podrá editarse.',
    confirmText: 'Publicar',
  })
  if (!ok) return
  postJournal(entry.value.id)
}

async function confirmReverse() {
  if (!entry.value) return
  const ok = await markapAlert.confirm({
    title: 'Reversar asiento',
    text: 'Se generará un asiento de reversa y este quedará como reversado.',
    confirmText: 'Reversar',
  })
  if (!ok) return
  reverseJournal(entry.value.id, {
    onSuccess: () => void refetch(),
  })
}
</script>

<template>
  <div class="w-full space-y-6 print:max-w-none">
    <div class="print:hidden">
      <PageHeader
        icon="lucide:file-text"
        :title="entry ? `Asiento N° ${entry.entryNumber}` : 'Detalle de asiento'"
        :subtitle="entry?.description ?? 'Libro diario'"
      >
        <template #actions>
          <BaseButton variant="secondary" @click="goBack">Volver</BaseButton>
          <BaseButton variant="secondary" @click="printEntry">
            <AppIcon icon="lucide:printer" :size="16" class="mr-1.5" />
            Imprimir
          </BaseButton>
          <BaseButton v-if="(isDraft) && canWrite" variant="secondary" @click="goEdit">Editar</BaseButton>
          <BaseButton v-if="(isDraft) && canAdmin" variant="danger" :loading="deleting" @click="confirmDelete">
            Eliminar
          </BaseButton>
          <BaseButton v-if="isDraft" variant="primary" :loading="posting" @click="confirmPost">
            Publicar
          </BaseButton>
          <BaseButton v-if="isPosted" variant="primary" :loading="reversing" @click="confirmReverse">
            Reversar
          </BaseButton>
        </template>
      </PageHeader>
    </div>

    <LoadingState v-if="isLoading" class="print:hidden" />

    <BaseCard v-else-if="isError || !entry" padding="lg" class="block text-center print:hidden">
      <BaseButton variant="secondary" @click="refetch()">Reintentar</BaseButton>
    </BaseCard>

    <template v-else>
      <PageHeader
        :title="`Asiento contable N° ${entry.entryNumber}`"
        class="mb-6"
      >
        <template #actions>
          <p class="text-sm mt-1">{{ entry.description }}</p>
        </template>
      </PageHeader>

      <BaseCard padding="sm" class="block space-y-3 print:border-0 print:p-0">
        <div class="flex flex-wrap items-center gap-3">
          <Badge :variant="journalStatusVariant(entry.status)">{{ statusLabel }}</Badge>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            Fecha: <strong class="text-gray-800 dark:text-white/90">{{ entry.entryDate }}</strong>
          </span>
          <span v-if="entry.postedAt" class="text-sm text-gray-400 dark:text-gray-500">
            Publicado: {{ formatDateTime(entry.postedAt) }}
          </span>
          <span v-if="entry.reversalOfId" class="text-xs text-gray-400 dark:text-gray-500">
            Reversa de otro asiento
          </span>
        </div>

        <p class="text-sm text-gray-800 dark:text-white/90">{{ entry.description }}</p>
      </BaseCard>

      <BaseCard padding="none" class="block overflow-hidden print:border print:border-gray-300">
        <DataTable
          :columns="[
            { key: 'c0', label: 'Cuenta' },
            { key: 'c1', label: 'Centro' },
            { key: 'c2', label: 'Auxiliar' },
            { key: 'c3', label: 'Debe', align: 'right' },
            { key: 'c4', label: 'Haber', align: 'right' },
          ]"
          :data="entry.lines"
        >
          <template #row="{ row: line }">
              <td class="py-2.5 px-4">
                <span class="font-mono text-xs text-brand-500 dark:text-brand-400">{{ line.accountCode }}</span>
                <span class="block text-sm">{{ line.accountName }}</span>
                <span v-if="line.description" class="block text-xs mt-0.5 text-gray-400 dark:text-gray-500">
                  {{ line.description }}
                </span>
              </td>
              <td class="py-2.5 px-4 text-sm">
                <template v-if="line.costCenterCode">{{ line.costCenterCode }}</template>
                <span class="text-gray-400 dark:text-gray-500" v-else>—</span>
              </td>
              <td class="py-2.5 px-4 text-xs">
                <div v-if="line.auxiliaryRuc || line.auxiliaryDoc">
                  <div v-if="line.auxiliaryRuc">RUC {{ line.auxiliaryRuc }}</div>
                  <div v-if="line.auxiliaryDoc">Doc. {{ line.auxiliaryDoc }}</div>
                </div>
                <span class="text-gray-400 dark:text-gray-500" v-else>—</span>
              </td>
              <td class="py-2.5 px-4 text-right font-mono">
                {{ formatPen(line.debit) }}
                <div
                  v-if="line.foreignCurrency && line.foreignAmount"
                  class="text-[11px] font-normal mt-0.5 text-gray-400 dark:text-gray-500"
                >
                  {{ formatMoney(line.foreignAmount, line.foreignCurrency) }}
                  <span v-if="line.exchangeRate"> · TC {{ line.exchangeRate }}</span>
                </div>
              </td>
              <td class="py-2.5 px-4 text-right font-mono">
                {{ formatPen(line.credit) }}
                <div
                  v-if="line.foreignCurrency && line.foreignAmount && Number(line.credit) > 0"
                  class="text-[11px] font-normal mt-0.5 text-gray-400 dark:text-gray-500"
                >
                  {{ formatMoney(line.foreignAmount, line.foreignCurrency) }}
                  <span v-if="line.exchangeRate"> · TC {{ line.exchangeRate }}</span>
                </div>
              </td>
            
          </template>
          <template #footer>
            <tr class="bg-gray-50 dark:bg-gray-800">
              <td colspan="3" class="py-3 px-4 text-right font-medium text-gray-500 dark:text-gray-400">
                Totales
              </td>
              <td class="py-3 px-4 text-right font-mono font-semibold">{{ formatPen(entry.totalDebit) }}</td>
              <td class="py-3 px-4 text-right font-mono font-semibold">{{ formatPen(entry.totalCredit) }}</td>
            </tr>
          </template>
        </DataTable>
      </BaseCard>
    </template>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .print\:max-w-none,
  .print\:max-w-none * {
    visibility: visible;
  }
  .print\:max-w-none {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
