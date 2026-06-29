<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  BaseButton,
  AppIcon,
  Badge,
  FormCheckbox,
  FormInput,
  FormSelect,
  FormTextarea,
  PageHeader,
  StatsCard,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import {
  useContabilidadBankAccounts,
  useContabilidadBankReconciliation,
  useContabilidadUpsertReconciliation,
  useContabilidadToggleReconciledMovement,
  useContabilidadCloseReconciliation,
} from '../../application/useContabilidadTreasury'
import type { ContabilidadTreasuryMovementDTO } from '../../domain/treasury.types'

const { activePeriod } = useContabilidadActivePeriod()
const { data: bankData } = useContabilidadBankAccounts()
const banks = computed(() => (bankData.value?.bankAccounts ?? []).filter((b) => b.isActive))

const selectedBankId = ref('')
watch(banks, (list) => {
  if (!selectedBankId.value && list[0]) selectedBankId.value = list[0].id
}, { immediate: true })

const bankOptions = computed(() => banks.value.map((b) => ({ value: b.id, label: `${b.code} — ${b.bankName}` })))

const periodId = computed(() => activePeriod.value?.id)
const { data, isLoading, refetch } = useContabilidadBankReconciliation(selectedBankId, periodId)

const reconciliation = computed(() => data.value?.reconciliation)
const movements = computed(() => data.value?.movements ?? [])

const statementForm = ref({ balance: '', notes: '' })
watch(reconciliation, (rec) => {
  if (rec) {
    statementForm.value.balance = rec.statementBalance
    statementForm.value.notes = rec.notes ?? ''
  }
}, { immediate: true })

const { mutate: upsertReconciliation, isPending: savingStatement } = useContabilidadUpsertReconciliation()
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
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
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

    <div v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Seleccione un periodo activo en la barra superior.
    </div>

    <template v-else>
      <div
        class="rounded-xl border p-4 sm:p-5"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
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
            <BaseButton
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
      </div>

      <div v-if="reconciliation" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Saldo libro" :value="formatPen(reconciliation.bookBalance)" />
        <StatsCard title="Saldo extracto" :value="formatPen(reconciliation.statementBalance)" />
        <StatsCard title="Diferencia" :value="formatPen(reconciliation.difference)" />
        <StatsCard
          title="Conciliados"
          :value="`${reconciliation.reconciledCount} / ${reconciliation.reconciledCount + reconciliation.pendingCount}`"
        />
      </div>

      <div v-if="isLoading" class="flex justify-center py-12">
        <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
      </div>

      <div
        v-else
        class="rounded-xl border overflow-hidden"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <th class="py-3 px-4 w-12" />
              <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Fecha</th>
              <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Glosa</th>
              <th class="text-right py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Importe</th>
              <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in movements"
              :key="m.id"
              class="border-b last:border-b-0"
              :style="{ borderColor: 'var(--color-border)' }"
            >
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
            </tr>
            <tr v-if="!movements.length">
              <td colspan="5" class="py-8 text-center" :style="{ color: 'var(--color-text-muted)' }">
                Sin movimientos bancarios en este periodo
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
