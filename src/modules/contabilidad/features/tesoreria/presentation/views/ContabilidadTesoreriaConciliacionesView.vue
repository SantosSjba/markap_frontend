<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('contabilidad')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { computed, ref, watch } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '../../../asientos/domain/journal.utils'
import {
  useContabilidadBankAccounts,
  useContabilidadBankReconciliation,
  useContabilidadUpsertReconciliation,
  useContabilidadToggleReconciledMovement,
  useContabilidadCloseReconciliation,
} from '../composables/useContabilidadTreasury'
import type { ContabilidadTreasuryMovementDTO } from '../../domain/treasury.types'
const { activePeriod } = useContabilidadActivePeriod()
const { data: bankData } = useContabilidadBankAccounts()
const banks = computed(() => (bankData.value?.bankAccounts ?? []).filter((b) => b.isActive))

const selectedBankId = ref('')
watch(
  banks,
  (list) => {
    if (!selectedBankId.value && list[0]) selectedBankId.value = list[0].id
  },
  { immediate: true },
)

const bankOptions = computed(() =>
  banks.value.map((b) => ({ value: b.id, label: `${b.code} — ${b.bankName}` })),
)

const periodId = computed(() => activePeriod.value?.id)
const { data, isLoading, refetch } = useContabilidadBankReconciliation(selectedBankId, periodId)

const reconciliation = computed(() => data.value?.reconciliation)
const movements = computed(() => data.value?.movements ?? [])

const statementForm = ref({ balance: '', notes: '' })
watch(
  reconciliation,
  (rec) => {
    if (rec) {
      statementForm.value.balance = rec.statementBalance
      statementForm.value.notes = rec.notes ?? ''
    }
  },
  { immediate: true },
)

const { mutate: upsertReconciliation, isPending: savingStatement } =
  useContabilidadUpsertReconciliation()
const { mutate: toggleReconciled, isPending: toggling } = useContabilidadToggleReconciledMovement()
const { mutate: closeReconciliation, isPending: closing } = useContabilidadCloseReconciliation()

const isClosed = computed(() => reconciliation.value?.status === 'CLOSED')

function saveStatement() {
  if (!activePeriod.value || !selectedBankId.value) return
  upsertReconciliation(
    {
      bankAccountId: selectedBankId.value,
      periodId: activePeriod.value.id,
      statementBalance: statementForm.value.balance,
      notes: statementForm.value.notes.trim() || null,
    },
    { onSuccess: () => void refetch() },
  )
}

function onToggleMovement(movement: ContabilidadTreasuryMovementDTO, checked: boolean) {
  const recId = reconciliation.value?.id
  if (!recId) {
    void markapAlert.toast.warning('Guarde primero el saldo del extracto')
    return
  }
  toggleReconciled(
    { reconciliationId: recId, movementId: movement.id, reconciled: checked },
    { onSuccess: () => void refetch() },
  )
}

async function onClose() {
  if (!reconciliation.value) return
  const ok = await markapAlert.confirm({
    title: 'Cerrar conciliación',
    text: 'No podrá modificar los movimientos conciliados.',
    confirmText: 'Cerrar',
  })
  if (!ok) return
  closeReconciliation(reconciliation.value.id, { onSuccess: () => void refetch() })
}
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:check-check"
      title="Conciliación bancaria"
      subtitle="Compare el saldo del extracto con el libro y marque partidas conciliadas."
    >
      <template #actions>
        <BaseButton
          v-if="reconciliation && !isClosed"
          variant="primary"
          :loading="closing"
          @click="onClose"
        >
          Cerrar conciliación
        </BaseButton>
      </template>
    </PageHeader>

    <div class="w-full min-w-0">
      <FormSelect v-model="selectedBankId" label="Cuenta bancaria" :options="bankOptions" />
    </div>

    <div v-if="!activePeriod" class="text-sm text-warning-600 dark:text-orange-400">
      Configure el periodo activo en Configuración ? Contexto contable.
    </div>

    <template v-else>
      <BaseCard padding="sm" class="block">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div class="w-full lg:w-56 shrink-0 min-w-0">
            <FormInput
              v-model="statementForm.balance"
              label="Saldo según extracto (S/)"
              type="number"
              step="0.01"
              :disabled="isClosed"
            />
          </div>
          <div class="min-w-0 flex-1">
            <FormTextarea
              v-model="statementForm.notes"
              label="Notas"
              :rows="2"
              :disabled="isClosed"
            />
          </div>
          <div class="shrink-0 lg:pb-0.5">
            <BaseButton v-if="canWrite"
              variant="secondary"
              class="w-full lg:w-auto"
              :loading="savingStatement"
              :disabled="isClosed"
              @click="saveStatement"
            >
              Guardar extracto
            </BaseButton>
          </div>
        </div>
      </BaseCard>

      <div v-if="reconciliation" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Saldo libro" :value="formatPen(reconciliation.bookBalance)" />
        <StatsCard title="Saldo extracto" :value="formatPen(reconciliation.statementBalance)" />
        <StatsCard title="Diferencia" :value="formatPen(reconciliation.difference)" />
        <StatsCard
          title="Conciliados"
          :value="`${reconciliation.reconciledCount} / ${reconciliation.reconciledCount + reconciliation.pendingCount}`"
        />
      </div>

      <LoadingState v-if="isLoading" class="py-12" />

      <BaseCard v-else padding="none" class="block overflow-hidden">
        <DataTable
          :columns="[
            { key: 'c0', label: '' },
            { key: 'c1', label: 'Fecha' },
            { key: 'c2', label: 'Glosa' },
            { key: 'c3', label: 'Importe', align: 'right' },
            { key: 'c4', label: 'Estado' },
          ]"
          :data="movements"
          empty-text="Sin movimientos bancarios en este periodo"
        >
          <template #row="{ row: m }">
              <td class="py-2.5 px-4">
                <FormCheckbox
                  :model-value="Boolean(m.reconciledAt)"
                  :disabled="isClosed || toggling || !reconciliation"
                  @update:model-value="(v: boolean) => onToggleMovement(m, v)"
                />
              </td>
              <td class="py-2.5 px-4">{{ m.movementDate }}</td>
              <td class="py-2.5 px-4">{{ m.description }}</td>
              <td class="py-2.5 px-4 text-right font-mono">{{ formatPen(m.amount) }}</td>
              <td class="py-2.5 px-4">
                <Badge :variant="m.reconciledAt ? 'success' : 'neutral'">
                  {{ m.reconciledAt ? 'Conciliado' : 'Pendiente' }}
                </Badge>
              </td>
          </template>
        </DataTable>
      </BaseCard>
    </template>
  </div>
</template>
