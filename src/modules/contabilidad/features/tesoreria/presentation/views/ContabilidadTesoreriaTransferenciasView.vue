<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  BaseButton,
  FormInput,
  FormSelect,
  FormTextarea,
  PageHeader,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import {
  useContabilidadCashBoxes,
  useContabilidadBankAccounts,
  useContabilidadCreateTreasuryTransfer,
} from '../../application/useContabilidadTreasury'

const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()
const { data: cashData } = useContabilidadCashBoxes()
const { data: bankData } = useContabilidadBankAccounts()
const { mutate: createTransfer, isPending: saving } = useContabilidadCreateTreasuryTransfer()

const cashBoxes = computed(() => (cashData.value?.cashBoxes ?? []).filter((c) => c.isActive))
const banks = computed(() => (bankData.value?.bankAccounts ?? []).filter((b) => b.isActive))

const sourceTypeOptions = [
  { value: 'CASH', label: 'Caja' },
  { value: 'BANK', label: 'Banco' },
]

const form = ref({
  fromType: 'CASH' as 'CASH' | 'BANK',
  fromCashBoxId: '',
  fromBankAccountId: '',
  toType: 'BANK' as 'CASH' | 'BANK',
  toCashBoxId: '',
  toBankAccountId: '',
  amount: '',
  movementDate: '',
  description: '',
})

watch(cashBoxes, (boxes) => {
  if (!form.value.fromCashBoxId && boxes[0]) form.value.fromCashBoxId = boxes[0].id
}, { immediate: true })
watch(banks, (list) => {
  if (!form.value.toBankAccountId && list[0]) form.value.toBankAccountId = list[0].id
}, { immediate: true })
watch(activePeriod, (p) => {
  if (!p) return
  const now = new Date()
  form.value.movementDate = `${p.year}-${String(p.month).padStart(2, '0')}-${String(Math.min(now.getDate(), 28)).padStart(2, '0')}`
}, { immediate: true })

const fromCashOptions = computed(() => cashBoxes.value.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })))
const fromBankOptions = computed(() => banks.value.map((b) => ({ value: b.id, label: `${b.code} — ${b.bankName}` })))
const toCashOptions = fromCashOptions
const toBankOptions = fromBankOptions

function submit() {
  if (!activePeriod.value) {
    void markapAlert.toast.warning('Seleccione un periodo activo')
    return
  }
  if (!form.value.amount || !form.value.description.trim()) {
    void markapAlert.toast.warning('Complete importe y glosa')
    return
  }
  createTransfer(
    {
      periodId: activePeriod.value.id,
      fromType: form.value.fromType,
      fromCashBoxId: form.value.fromType === 'CASH' ? form.value.fromCashBoxId : null,
      fromBankAccountId: form.value.fromType === 'BANK' ? form.value.fromBankAccountId : null,
      toType: form.value.toType,
      toCashBoxId: form.value.toType === 'CASH' ? form.value.toCashBoxId : null,
      toBankAccountId: form.value.toType === 'BANK' ? form.value.toBankAccountId : null,
      amount: form.value.amount,
      movementDate: form.value.movementDate,
      description: form.value.description.trim(),
    },
    {
      onSuccess: () => {
        void router.push({ name: 'contabilidad-tesoreria-movimientos' })
      },
    },
  )
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:repeat"
      title="Transferencias"
      subtitle="Mueva fondos entre caja y bancos. Se genera un asiento puente automático."
    />

    <form
      class="w-full rounded-xl border p-4 sm:p-5 space-y-5"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      @submit.prevent="submit"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-3 min-w-0">
          <h3 class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Origen</h3>
          <FormSelect v-model="form.fromType" label="Tipo" :options="sourceTypeOptions" />
          <div v-if="form.fromType === 'CASH'" class="min-w-0">
            <FormSelect
              v-model="form.fromCashBoxId"
              label="Caja"
              :options="fromCashOptions"
            />
          </div>
          <div v-else class="min-w-0">
            <FormSelect
              v-model="form.fromBankAccountId"
              label="Cuenta bancaria"
              :options="fromBankOptions"
            />
          </div>
        </div>
        <div class="space-y-3 min-w-0">
          <h3 class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Destino</h3>
          <FormSelect v-model="form.toType" label="Tipo" :options="sourceTypeOptions" />
          <div v-if="form.toType === 'CASH'" class="min-w-0">
            <FormSelect
              v-model="form.toCashBoxId"
              label="Caja"
              :options="toCashOptions"
            />
          </div>
          <div v-else class="min-w-0">
            <FormSelect
              v-model="form.toBankAccountId"
              label="Cuenta bancaria"
              :options="toBankOptions"
            />
          </div>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 w-full">
        <div class="min-w-0">
          <FormInput v-model="form.movementDate" label="Fecha" type="date" required />
        </div>
        <div class="min-w-0">
          <FormInput v-model="form.amount" label="Importe (S/)" type="number" min="0" step="0.01" required />
        </div>
        <div class="min-w-0 sm:col-span-2">
          <FormTextarea v-model="form.description" label="Glosa" :rows="2" required />
        </div>
      </div>

      <div class="flex justify-end">
        <BaseButton type="submit" variant="primary" :loading="saving">Registrar transferencia</BaseButton>
      </div>
    </form>
  </div>
</template>
