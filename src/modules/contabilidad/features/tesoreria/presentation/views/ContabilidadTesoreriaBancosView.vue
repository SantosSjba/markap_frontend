<script setup lang="ts">
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import { computed, ref } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import { useContabilidadAccountsTree } from '../../../plan-cuentas/presentation/composables/useContabilidadAccounts'
import { flattenMovementAccounts } from '../../../asientos/domain/journal.utils'
import { formatPen } from '../../../asientos/domain/journal.utils'
import { useContabilidadCurrencies } from '../../../../presentation/composables/useContabilidadCurrencies'
import {
  useContabilidadBankAccounts,
  useContabilidadCreateBankAccount,
} from '../composables/useContabilidadTreasury'
import type { ContabilidadBankAccountDTO } from '../../domain/treasury.types'
const { data, isLoading, refetch } = useContabilidadBankAccounts()
const banks = computed(() => data.value?.bankAccounts ?? [])
const totalBalance = computed(() => banks.value.reduce((sum, b) => sum + Number(b.balance), 0))

const emptySearch = ref('')
const { data: accountsData } = useContabilidadAccountsTree(emptySearch)
const ledgerOptions = computed(() => {
  const bankLedgers = flattenMovementAccounts(accountsData.value?.tree ?? []).filter(
    (o) => o.label.startsWith('1071') || o.label.includes('Depósitos'),
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
  form.value = {
    code: '',
    bankName: '',
    accountNumber: '',
    cci: '',
    currency: 'PEN',
    accountId: '',
  }
  modalOpen.value = true
}

function submit() {
  if (
    !form.value.code.trim() ||
    !form.value.bankName.trim() ||
    !form.value.accountNumber.trim() ||
    !form.value.accountId
  ) {
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

    <LoadingState v-if="isLoading" />

    <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="bank in banks"
        :key="bank.id"
        class="rounded-xl border p-4 space-y-3 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark" :style="{ opacity: bank.isActive ? 1 : 0.6 }"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-semibold text-gray-800 dark:text-white/90">
              {{ (bank as ContabilidadBankAccountDTO).bankName }}
            </p>
            <p class="text-xs font-mono mt-0.5 text-brand-500 dark:text-brand-400">
              {{ (bank as ContabilidadBankAccountDTO).code }}
            </p>
          </div>
          <Badge>{{ (bank as ContabilidadBankAccountDTO).currency }}</Badge>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          N° {{ (bank as ContabilidadBankAccountDTO).accountNumber }}
        </p>
        <p v-if="(bank as ContabilidadBankAccountDTO).cci" class="text-xs text-gray-400 dark:text-gray-500">
          CCI {{ (bank as ContabilidadBankAccountDTO).cci }}
        </p>
        <p class="text-lg font-bold font-mono text-gray-800 dark:text-white/90">
          {{ formatPen((bank as ContabilidadBankAccountDTO).balance) }}
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500">
          Cuenta {{ (bank as ContabilidadBankAccountDTO).accountCode }} — {{ (bank as ContabilidadBankAccountDTO).accountName }}
        </p>
      </div>
      <div
        v-if="!banks.length"
        class="md:col-span-2 xl:col-span-3 rounded-xl border p-8 text-center text-sm border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500"
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
