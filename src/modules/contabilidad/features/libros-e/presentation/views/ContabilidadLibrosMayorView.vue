<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { computed, ref } from 'vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { useContabilidadAccountsTree } from '../../../plan-cuentas/presentation/composables/useContabilidadAccounts'
import { flattenMovementAccounts, formatPen } from '../../../asientos/domain/journal.utils'
import { useContabilidadLibroMayor } from '../composables/useContabilidadPle'
import type { ContabilidadLibroMayorAccountDTO } from '../../domain/ple.types'
const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)
const accountFilter = ref('')
const accountIdParam = computed(() => accountFilter.value || undefined)

const emptySearch = ref('')
const { data: accountsData } = useContabilidadAccountsTree(emptySearch)
const accountOptions = computed(() => [
  { value: '', label: 'Todas las cuentas' },
  ...flattenMovementAccounts(accountsData.value?.tree ?? []),
])

const { data, isLoading } = useContabilidadLibroMayor(periodId, accountIdParam)
const accounts = computed(() => data.value?.accounts ?? [])

const expanded = ref<Set<string>>(new Set())

function toggleExpand(id: string) {
  const s = new Set(expanded.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  expanded.value = s
}
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:book-marked"
      title="Libro mayor"
      subtitle="Movimientos por cuenta PCGE del periodo (6.1)."
    />

    <div class="w-full max-w-md min-w-0">
      <FormSelect v-model="accountFilter" label="Filtrar cuenta" :options="accountOptions" />
    </div>

    <LoadingState v-if="isLoading" />

    <div v-else class="space-y-4">
      <BaseCard v-for="acc in accounts" :key="acc.accountId" padding="none" class="block overflow-hidden">
        <button
          type="button"
          class="w-full flex items-center justify-between gap-4 p-4 text-left"
          @click="toggleExpand(acc.accountId)"
        >
          <div>
            <span class="font-mono font-semibold">{{ acc.accountCode }}</span>
            <span class="ml-2 text-sm">{{ acc.accountName }}</span>
          </div>
          <div class="text-sm font-mono shrink-0">
            D {{ formatPen(acc.totalDebit) }} · H {{ formatPen(acc.totalCredit) }} · Saldo {{ formatPen(acc.balance) }}
          </div>
        </button>
        <DataTable
          :columns="[
            { key: 'c0', label: 'Fecha' },
            { key: 'c1', label: 'N°' },
            { key: 'c2', label: 'Glosa' },
            { key: 'c3', label: 'Debe', align: 'right' },
            { key: 'c4', label: 'Haber', align: 'right' },
            { key: 'c5', label: 'Saldo', align: 'right' },
          ]"
          :data="(acc as ContabilidadLibroMayorAccountDTO).lines"
        >
          <template #row="{ row: line }">
              <td class="py-2 px-4">{{ line.entryDate }}</td>
              <td class="py-2 px-4 font-mono">{{ line.entryNumber }}</td>
              <td class="py-2 px-4">{{ line.description }}</td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(line.debit) }}</td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(line.credit) }}</td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(line.runningBalance) }}</td>
          </template>
        </DataTable>
      </BaseCard>
      <p v-if="!accounts.length" class="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
        Sin movimientos publicados en el periodo.
      </p>
    </div>
  </div>
</template>
