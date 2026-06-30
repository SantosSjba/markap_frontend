<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  BaseButton,
  AppIcon,
  BaseModal,
  Badge,
  FormInput,
  FormSelect,
  FormTextarea,
  PageHeader,
  StatsCard,
} from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { useContabilidadAccountsTree } from '@modules/contabilidad/features/plan-cuentas/application/useContabilidadAccounts'
import { flattenMovementAccounts, formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import {
  useContabilidadCashBoxes,
  useContabilidadTreasuryMovements,
  useContabilidadCreateTreasuryMovement,
} from '../../application/useContabilidadTreasury'
import { TREASURY_MOVEMENT_TYPE_LABELS } from '../../domain/treasury.types'
import type { ContabilidadTreasuryMovementDTO } from '../../domain/treasury.types'

const { activePeriod } = useContabilidadActivePeriod()
const { data: cashData, isLoading: loadingBoxes } = useContabilidadCashBoxes()
const emptySearch = ref('')
const { data: accountsData } = useContabilidadAccountsTree(emptySearch)

const selectedCashBoxId = ref('')
const cashBoxes = computed(() => cashData.value?.cashBoxes ?? [])
const selectedCashBox = computed(() => cashBoxes.value.find((c) => c.id === selectedCashBoxId.value))

watch(cashBoxes, (boxes) => {
  if (!selectedCashBoxId.value && boxes.length) {
    selectedCashBoxId.value = boxes.find((b) => b.isActive)?.id ?? boxes[0]!.id
  }
}, { immediate: true })

const movementParams = computed(() => ({
  periodId: activePeriod.value?.id,
  cashBoxId: selectedCashBoxId.value || undefined,
  sourceType: 'CASH',
}))

const { data: movementsData, isLoading: loadingMovements, refetch } =
  useContabilidadTreasuryMovements(movementParams)
const movements = computed(() => movementsData.value?.movements ?? [])

const offsetOptions = computed(() => {
  const ledgerIds = new Set(cashBoxes.value.map((c) => c.accountId))
  return flattenMovementAccounts(accountsData.value?.tree ?? []).filter((o) => !ledgerIds.has(o.value))
})

const cashBoxOptions = computed(() =>
  cashBoxes.value.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
)

const modalOpen = ref(false)
const movementType = ref<'IN' | 'OUT'>('IN')
const form = ref({ amount: '', movementDate: '', description: '', offsetAccountId: '' })
const { mutate: createMovement, isPending: saving } = useContabilidadCreateTreasuryMovement()

watch(activePeriod, (p) => {
  if (!p) return
  const now = new Date()
  form.value.movementDate = `${p.year}-${String(p.month).padStart(2, '0')}-${String(Math.min(now.getDate(), 28)).padStart(2, '0')}`
}, { immediate: true })

function openModal(type: 'IN' | 'OUT') {
  movementType.value = type
  form.value.amount = ''
  form.value.description = ''
  form.value.offsetAccountId = ''
  modalOpen.value = true
}

function submitMovement() {
  if (!activePeriod.value || !selectedCashBoxId.value) return
  if (!form.value.offsetAccountId || !form.value.description.trim() || !form.value.amount) {
    return
  }
  createMovement(
    {
      periodId: activePeriod.value.id,
      movementType: movementType.value,
      sourceType: 'CASH',
      cashBoxId: selectedCashBoxId.value,
      offsetAccountId: form.value.offsetAccountId,
      amount: form.value.amount,
      movementDate: form.value.movementDate,
      description: form.value.description.trim(),
    },
    { onSuccess: () => { modalOpen.value = false; void refetch() } },
  )
}

function typeLabel(type: string) {
  return TREASURY_MOVEMENT_TYPE_LABELS[type] ?? type
}
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:wallet"
      title="Caja"
      subtitle="Saldo y movimientos de efectivo. Cada operación genera asiento automático."
    >
      <template #actions>
        <BaseButton variant="secondary" :disabled="!selectedCashBoxId" @click="openModal('IN')">
          Ingreso
        </BaseButton>
        <BaseButton variant="primary" :disabled="!selectedCashBoxId" @click="openModal('OUT')">
          Egreso
        </BaseButton>
      </template>
    </PageHeader>

    <div v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Configure el periodo activo en Configuraci�n ? Contexto contable.
    </div>

    <div class="w-full min-w-0 max-w-md">
      <FormSelect v-model="selectedCashBoxId" label="Caja" :options="cashBoxOptions" :loading="loadingBoxes" />
    </div>

    <div v-if="selectedCashBox" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatsCard title="Saldo en caja" :value="formatPen(selectedCashBox.balance)" />
      <StatsCard title="Cuenta PCGE" :value="selectedCashBox.accountCode" />
      <StatsCard title="Movimientos del periodo" :value="String(movements.length)" />
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <div v-if="loadingMovements" class="flex justify-center py-12">
        <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
      </div>
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Fecha</th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Tipo</th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Glosa</th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Contrapartida</th>
            <th class="text-right py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Importe</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in movements"
            :key="row.id"
            class="border-b last:border-b-0"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <td class="py-2.5 px-4">{{ (row as ContabilidadTreasuryMovementDTO).movementDate }}</td>
            <td class="py-2.5 px-4">
              <Badge :variant="(row as ContabilidadTreasuryMovementDTO).movementType === 'IN' ? 'success' : 'warning'">
                {{ typeLabel((row as ContabilidadTreasuryMovementDTO).movementType) }}
              </Badge>
            </td>
            <td class="py-2.5 px-4">{{ (row as ContabilidadTreasuryMovementDTO).description }}</td>
            <td class="py-2.5 px-4 text-xs font-mono">
              {{ (row as ContabilidadTreasuryMovementDTO).offsetAccountCode }}
            </td>
            <td class="py-2.5 px-4 text-right font-mono font-semibold">
              {{ formatPen((row as ContabilidadTreasuryMovementDTO).amount) }}
            </td>
          </tr>
          <tr v-if="!movements.length">
            <td colspan="5" class="py-8 text-center" :style="{ color: 'var(--color-text-muted)' }">
              Sin movimientos en este periodo
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal
      v-model="modalOpen"
      :title="movementType === 'IN' ? 'Ingreso de caja' : 'Egreso de caja'"
      size="md"
    >
      <form class="space-y-4" @submit.prevent="submitMovement">
        <FormInput v-model="form.movementDate" label="Fecha" type="date" required />
        <FormInput v-model="form.amount" label="Importe (S/)" type="number" min="0" step="0.01" required />
        <FormSelect
          v-model="form.offsetAccountId"
          label="Cuenta de contrapartida"
          :options="offsetOptions"
          placeholder="Seleccionar cuenta…"
        />
        <FormTextarea v-model="form.description" label="Glosa" :rows="2" required />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="saving">Registrar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
