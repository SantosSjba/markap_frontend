<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton } from '@shared/components'
import { FormInput, FormSelect } from '@shared/components'
import { useRental, useRentalFinancialBreakdown, useUpsertRentalFinancialConfig } from '../composables/useRentals'
import { useUsers } from '@applications/settings/composables/useUsers'
import { useAgentsList } from '@applications/alquileres/agentes/composables/useAgents'

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const { data: rental, isLoading: loadingRental, isError: rentalError } = useRental(id)
const { data: breakdown, isLoading: loadingBreakdown } = useRentalFinancialBreakdown(id)
const upsertFinancial = useUpsertRentalFinancialConfig()
const { data: usersList } = useUsers()
const externalAgentsParams = ref({ applicationSlug: 'alquileres', type: 'EXTERNAL' as const, page: 1, limit: 200, isActive: true })
const { data: externalAgentsResult } = useAgentsList(externalAgentsParams)
const externalAgentsList = computed(() => externalAgentsResult.value?.data ?? [])

const form = ref({
  expenseType: 'FIXED' as 'PERCENT' | 'FIXED',
  expenseValue: 0,
  taxType: 'FIXED' as 'PERCENT' | 'FIXED',
  taxValue: 0,
  externalAgentId: '' as string | null,
  externalAgentType: 'FIXED' as 'PERCENT' | 'FIXED',
  externalAgentValue: 0,
  externalAgentName: '',
  internalAgentId: '' as string | null,
  internalAgentType: 'FIXED' as 'PERCENT' | 'FIXED',
  internalAgentValue: 0,
})

watch(breakdown, (b) => {
  if (!b?.config) return
  const c = b.config
  form.value = {
    expenseType: c.expenseType,
    expenseValue: c.expenseValue,
    taxType: c.taxType,
    taxValue: c.taxValue,
    externalAgentId: c.externalAgentId ?? '',
    externalAgentType: c.externalAgentType,
    externalAgentValue: c.externalAgentValue,
    externalAgentName: c.externalAgentName ?? '',
    internalAgentId: c.internalAgentId ?? '',
    internalAgentType: c.internalAgentType,
    internalAgentValue: c.internalAgentValue,
  }
}, { immediate: true })

function formatAmount(amount: number, currency: string): string {
  const sym = currency === 'USD' ? 'US$' : 'S/'
  return `${sym} ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function submitFinancialConfig() {
  if (!id.value) return
  upsertFinancial.mutate({
    rentalId: id.value,
    data: {
      expenseType: form.value.expenseType,
      expenseValue: form.value.expenseValue,
      taxType: form.value.taxType,
      taxValue: form.value.taxValue,
      externalAgentId: form.value.externalAgentId || null,
      externalAgentType: form.value.externalAgentType,
      externalAgentValue: form.value.externalAgentValue,
      externalAgentName: form.value.externalAgentName || null,
      internalAgentId: form.value.internalAgentId || null,
      internalAgentType: form.value.internalAgentType,
      internalAgentValue: form.value.internalAgentValue,
    },
  })
}

const goBack = () => router.push(`/alquileres/contratos/${id.value}`)
const goToEdit = () => router.push(`/alquileres/contratos/${id.value}/editar`)

const expenseTypeOptions = [
  { value: 'FIXED', label: 'Monto fijo' },
  { value: 'PERCENT', label: 'Porcentaje' },
]
const internalAgentOptions = computed(() => {
  const list = usersList.value ?? []
  return [{ value: '', label: 'Ninguno' }, ...list.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))]
})
const internalAgentIdModel = computed({
  get: () => form.value.internalAgentId ?? '',
  set: (v: string | null) => { form.value.internalAgentId = (v === null || v === '') ? '' : v }
})
const externalAgentIdModel = computed({
  get: () => form.value.externalAgentId ?? '',
  set: (v: string | null) => { form.value.externalAgentId = (v === null || v === '') ? '' : v }
})
const externalAgentOptions = computed(() => [
  { value: '', label: 'Ninguno (nombre manual)' },
  ...externalAgentsList.value.map((a) => ({ value: a.id, label: a.fullName }))
])
const selectedInternalUser = computed(() => {
  const id = form.value.internalAgentId
  if (!id) return null
  return usersList.value?.find((u) => u.id === id) ?? null
})
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 max-w-[1600px] mx-auto">
    <div class="flex items-center justify-between gap-4 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-bold truncate" :style="{ color: 'var(--color-text-primary)' }">
          Distribución financiera – {{ rental?.code ?? 'Alquiler' }}
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Gastos, impuestos y comisiones de agentes
        </p>
      </div>
      <BaseButton variant="outline" @click="goToEdit">
        Editar alquiler
      </BaseButton>
    </div>

    <div v-if="loadingRental" class="flex justify-center py-16">
      <svg
        class="animate-spin h-8 w-8"
        style="color: var(--color-primary)"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <p v-else-if="rentalError || !rental" class="text-sm py-8" :style="{ color: 'var(--color-error)' }">
      No se encontró el alquiler o ocurrió un error.
    </p>

    <template v-else>
      <section
        class="p-5 rounded-xl mb-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
          Desglose mensual
        </h2>
        <div v-if="loadingBreakdown" class="text-sm py-4" :style="{ color: 'var(--color-text-muted)' }">
          Cargando desglose...
        </div>
        <div v-else-if="breakdown" class="overflow-x-auto mb-4">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                <th class="text-left py-2 pr-4" :style="{ color: 'var(--color-text-secondary)' }">Concepto</th>
                <th class="text-right py-2" :style="{ color: 'var(--color-text-secondary)' }">Monto mensual</th>
              </tr>
            </thead>
            <tbody>
              <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                <td class="py-2 pr-4" :style="{ color: 'var(--color-text-primary)' }">Ingreso (alquiler)</td>
                <td class="text-right py-2 font-medium" :style="{ color: 'var(--color-text-primary)' }">
                  {{ formatAmount(breakdown.monthlyAmount, breakdown.currency) }}
                </td>
              </tr>
              <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                <td class="py-2 pr-4" :style="{ color: 'var(--color-text-primary)' }">Gastos</td>
                <td class="text-right py-2" :style="{ color: 'var(--color-text-secondary)' }">
                  − {{ formatAmount(breakdown.expense, breakdown.currency) }}
                </td>
              </tr>
              <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                <td class="py-2 pr-4" :style="{ color: 'var(--color-text-primary)' }">Impuestos</td>
                <td class="text-right py-2" :style="{ color: 'var(--color-text-secondary)' }">
                  − {{ formatAmount(breakdown.tax, breakdown.currency) }}
                </td>
              </tr>
              <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                <td class="py-2 pr-4" :style="{ color: 'var(--color-text-primary)' }">Agente externo</td>
                <td class="text-right py-2" :style="{ color: 'var(--color-text-secondary)' }">
                  − {{ formatAmount(breakdown.externalAgentCommission, breakdown.currency) }}
                </td>
              </tr>
              <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                <td class="py-2 pr-4" :style="{ color: 'var(--color-text-primary)' }">Agente interno</td>
                <td class="text-right py-2" :style="{ color: 'var(--color-text-secondary)' }">
                  − {{ formatAmount(breakdown.internalAgentCommission, breakdown.currency) }}
                </td>
              </tr>
              <tr>
                <td class="py-2 pr-4 font-semibold" :style="{ color: 'var(--color-text-primary)' }">Utilidad neta</td>
                <td class="text-right py-2 font-semibold" :style="{ color: 'var(--color-primary)' }">
                  {{ formatAmount(breakdown.utility, breakdown.currency) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Formulario -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">
          Configuración
        </h2>
        <form
          class="space-y-6"
          @submit.prevent="submitFinancialConfig"
        >
          <!-- Grid 2 columnas responsivo -->
          <div
            class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-5 rounded-lg"
            :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
          >
            <!-- Gastos -->
            <div class="min-w-0">
              <label class="block text-sm font-medium mb-2" :style="{ color: 'var(--color-text-primary)' }">Gastos</label>
              <div class="grid grid-cols-[auto_1fr] sm:grid-cols-2 gap-2 sm:gap-3 items-center">
                <FormSelect
                  v-model="form.expenseType"
                  :options="expenseTypeOptions"
                  class="min-w-0 w-full"
                />
                <FormInput
                  v-model="form.expenseValue"
                  type="number"
                  min="0"
                  step="0.01"
                  :placeholder="form.expenseType === 'PERCENT' ? '%' : '0.00'"
                  class="min-w-0 w-full"
                />
              </div>
            </div>
            <!-- Impuestos -->
            <div class="min-w-0">
              <label class="block text-sm font-medium mb-2" :style="{ color: 'var(--color-text-primary)' }">Impuestos</label>
              <div class="grid grid-cols-[auto_1fr] sm:grid-cols-2 gap-2 sm:gap-3 items-center">
                <FormSelect
                  v-model="form.taxType"
                  :options="expenseTypeOptions"
                  class="min-w-0 w-full"
                />
                <FormInput
                  v-model="form.taxValue"
                  type="number"
                  min="0"
                  step="0.01"
                  :placeholder="form.taxType === 'PERCENT' ? '%' : '0.00'"
                  class="min-w-0 w-full"
                />
              </div>
            </div>
          </div>

          <!-- Agente externo: grid 2 cols -->
          <div
            class="p-4 sm:p-5 rounded-lg"
            :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
          >
            <label class="block text-sm font-medium mb-3" :style="{ color: 'var(--color-text-primary)' }">Agente externo</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div class="min-w-0">
                <FormSelect
                  v-model="externalAgentIdModel"
                  label="Seleccionar agente"
                  :options="externalAgentOptions"
                  placeholder="Ninguno"
                  class="w-full"
                />
              </div>
              <div class="min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-end">
                <FormSelect
                  v-model="form.externalAgentType"
                  label="Tipo comisión"
                  :options="expenseTypeOptions"
                  class="min-w-0"
                />
                <FormInput
                  v-model="form.externalAgentValue"
                  type="number"
                  min="0"
                  step="0.01"
                  label="Valor"
                  placeholder="0"
                  class="min-w-0"
                />
              </div>
              <div class="sm:col-span-2 min-w-0">
                <FormInput
                  v-model="form.externalAgentName"
                  type="text"
                  label="Nombre (si no elige agente)"
                  :placeholder="form.externalAgentId ? 'Del agente seleccionado' : 'Opcional'"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <!-- Agente interno: grid 2 cols -->
          <div
            class="p-4 sm:p-5 rounded-lg"
            :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
          >
            <label class="block text-sm font-medium mb-3" :style="{ color: 'var(--color-text-primary)' }">Agente interno</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div class="min-w-0">
                <FormSelect
                  v-model="internalAgentIdModel"
                  label="Seleccionar usuario"
                  :options="internalAgentOptions"
                  placeholder="Ninguno"
                  class="w-full"
                />
                <p
                  v-if="selectedInternalUser"
                  class="mt-2 text-sm rounded-md px-3 py-2"
                  :style="{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)' }"
                >
                  <span class="font-medium">Correo:</span> {{ selectedInternalUser.email }}
                </p>
              </div>
              <div class="min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-end">
                <FormSelect
                  v-model="form.internalAgentType"
                  label="Tipo comisión"
                  :options="expenseTypeOptions"
                  class="min-w-0"
                />
                <FormInput
                  v-model="form.internalAgentValue"
                  type="number"
                  min="0"
                  step="0.01"
                  label="Valor"
                  placeholder="0"
                  class="min-w-0"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <BaseButton type="submit" :disabled="upsertFinancial.isPending.value">
              {{ upsertFinancial.isPending.value ? 'Guardando...' : 'Guardar configuración' }}
            </BaseButton>
          </div>
        </form>
      </section>
    </template>
  </div>
</template>
