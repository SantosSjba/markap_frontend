<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  BaseButton,
  AppIcon,
  BaseModal,
  FormInput,
  FormSelect,
  PageHeader,
  StatsCard,
} from '@shared/components'
import { useContabilidadAccountsTree } from '@modules/contabilidad/features/plan-cuentas/application/useContabilidadAccounts'
import { flattenMovementAccounts } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useContabilidadCurrencies } from '@modules/contabilidad/presentation/composables/useContabilidadCurrencies'
import {
  useContabilidadBankAccounts,
  useContabilidadCreateBankAccount,
} from '../../application/useContabilidadTreasury'
import type { ContabilidadBankAccountDTO } from '../../domain/treasury.types'

const { data, isLoading, refetch } = useContabilidadBankAccounts()
const banks = computed(() => data.value?.bankAccounts ?? [])
const totalBalance = computed(() =>
  banks.value.reduce((sum, b) => sum + Number(b.balance), 0),
)

const emptySearch = ref('')
const { data: accountsData } = useContabilidadAccountsTree(emptySearch)
const ledgerOptions = computed(() => {
  const bankLedgers = flattenMovementAccounts(accountsData.value?.tree ?? []).filter((o) =>
    o.label.startsWith('1071') || o.label.includes('Depósitos'),
  )
  return bankLedgers.length ? bankLedgers : flattenMovementAccounts(accountsData.value?.tree ?? [])
})

const modalOpen = ref(false)
const form = ref({
  code: '',
  bankName: '',
  accountNumber: '',
  cci: '',
  currency: 'PEN',
  accountId: '',
})
const { mutate: createBank, isPending: creating } = useContabilidadCreateBankAccount()
const { data: currenciesData } = useContabilidadCurrencies()

const currencyOptions = computed(() =>
  (currenciesData.value ?? [{ code: 'PEN', name: 'Soles', symbol: 'S/' }]).map((c) => ({
    value: c.code,
    label: `${c.code} — ${c.name}`,
  })),
)

function openNew() {
  form.value = { code: '', bankName: '', accountNumber: '', cci: '', currency: 'PEN', accountId: '' }
  modalOpen.value = true
}

function submit() {
  if (!form.value.code.trim() || !form.value.bankName.trim() || !form.value.accountNumber.trim() || !form.value.accountId) {
    return
  }
  createBank(
    {
      code: form.value.code.trim(),
      bankName: form.value.bankName.trim(),
      accountNumber: form.value.accountNumber.trim(),
      cci: form.value.cci.trim() || null,
      currency: form.value.currency,
      accountId: form.value.accountId,
    },
    { onSuccess: () => { modalOpen.value = false; void refetch() } },
  )
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:landmark"
      title="Bancos"
      subtitle="Cuentas bancarias vinculadas al plan de cuentas (10xx)."
    >
      <template #actions>
        <BaseButton variant="primary" @click="openNew">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1.5" />
          Nueva cuenta
        </BaseButton>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <StatsCard title="Cuentas activas" :value="String(banks.filter((b) => b.isActive).length)" />
      <StatsCard title="Saldo total bancos" :value="formatPen(totalBalance)" />
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="bank in banks"
        :key="bank.id"
        class="rounded-xl border p-4 space-y-3"
        :style="{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          opacity: bank.isActive ? 1 : 0.6,
        }"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-semibold" :style="{ color: 'var(--color-text-primary)' }">
              {{ (bank as ContabilidadBankAccountDTO).bankName }}
            </p>
            <p class="text-xs font-mono mt-0.5" :style="{ color: 'var(--color-primary)' }">
              {{ (bank as ContabilidadBankAccountDTO).code }}
            </p>
          </div>
          <span class="text-xs px-2 py-0.5 rounded-full" :style="{ backgroundColor: 'var(--color-surface-elevated)' }">
            {{ (bank as ContabilidadBankAccountDTO).currency }}
          </span>
        </div>
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          N° {{ (bank as ContabilidadBankAccountDTO).accountNumber }}
        </p>
        <p v-if="(bank as ContabilidadBankAccountDTO).cci" class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
          CCI {{ (bank as ContabilidadBankAccountDTO).cci }}
        </p>
        <p class="text-lg font-bold font-mono" :style="{ color: 'var(--color-text-primary)' }">
          {{ formatPen((bank as ContabilidadBankAccountDTO).balance) }}
        </p>
        <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
          Cuenta {{ (bank as ContabilidadBankAccountDTO).accountCode }} — {{ (bank as ContabilidadBankAccountDTO).accountName }}
        </p>
      </div>
      <div
        v-if="!banks.length"
        class="md:col-span-2 xl:col-span-3 rounded-xl border p-8 text-center text-sm"
        :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }"
      >
        Sin cuentas bancarias registradas
      </div>
    </div>

    <BaseModal v-model="modalOpen" title="Nueva cuenta bancaria" size="md">
      <form class="space-y-4" @submit.prevent="submit">
        <FormInput v-model="form.code" label="Código interno" hint="Ej. BCP-01" required />
        <FormInput v-model="form.bankName" label="Banco" required />
        <FormInput v-model="form.accountNumber" label="Número de cuenta" required />
        <FormInput v-model="form.cci" label="CCI (opcional)" />
        <FormSelect v-model="form.currency" label="Moneda" :options="currencyOptions" />
        <FormSelect
          v-model="form.accountId"
          label="Cuenta contable (PCGE)"
          :options="ledgerOptions"
          placeholder="Cuenta 1071…"
        />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="creating">Crear</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
