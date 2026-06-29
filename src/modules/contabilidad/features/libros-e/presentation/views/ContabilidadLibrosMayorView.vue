<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppIcon, FormSelect, PageHeader } from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { useContabilidadAccountsTree } from '@modules/contabilidad/features/plan-cuentas/application/useContabilidadAccounts'
import { flattenMovementAccounts, formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useContabilidadLibroMayor } from '../../application/useContabilidadPle'
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
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:book-marked"
      title="Libro mayor"
      subtitle="Movimientos por cuenta PCGE del periodo (6.1)."
    />

    <div class="w-full max-w-md min-w-0">
      <FormSelect v-model="accountFilter" label="Filtrar cuenta" :options="accountOptions" />
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="acc in accounts"
        :key="acc.accountId"
        class="rounded-xl border overflow-hidden"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
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
        <table v-if="expanded.has(acc.accountId)" class="w-full text-sm border-t" :style="{ borderColor: 'var(--color-border)' }">
          <thead>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <th class="text-left py-2 px-4">Fecha</th>
              <th class="text-left py-2 px-4">N°</th>
              <th class="text-left py-2 px-4">Glosa</th>
              <th class="text-right py-2 px-4">Debe</th>
              <th class="text-right py-2 px-4">Haber</th>
              <th class="text-right py-2 px-4">Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(line, idx) in (acc as ContabilidadLibroMayorAccountDTO).lines"
              :key="idx"
              class="border-b last:border-b-0"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <td class="py-2 px-4">{{ line.entryDate }}</td>
              <td class="py-2 px-4 font-mono">{{ line.entryNumber }}</td>
              <td class="py-2 px-4">{{ line.description }}</td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(line.debit) }}</td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(line.credit) }}</td>
              <td class="py-2 px-4 text-right font-mono">{{ formatPen(line.runningBalance) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!accounts.length" class="text-center py-8 text-sm" :style="{ color: 'var(--color-text-muted)' }">
        Sin movimientos publicados en el periodo.
      </p>
    </div>
  </div>
</template>
