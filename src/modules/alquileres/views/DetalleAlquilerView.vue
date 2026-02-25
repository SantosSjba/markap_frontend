<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, Badge } from '@shared/components'
import { FormInput, FormSelect } from '@shared/components'
import { useRental, useRentalFinancialBreakdown, useUpsertRentalFinancialConfig } from '../composables/useRentals'
import { useUsers } from '@modules/settings/composables/useUsers'
import { useAgentsList } from '@modules/agentes/composables/useAgents'
import type { RentalDetail } from '../services/rentals.service'

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

const showFinancialForm = ref(false)
const form = ref({
  expenseType: 'FIXED' as 'PERCENT' | 'FIXED',
  expenseValue: 0,
  taxType: 'FIXED' as 'PERCENT' | 'FIXED',
  taxValue: 0,
  externalAgentId: '' as string | null,
  externalAgentType: 'FIXED' as 'PERCENT' | 'FIXED',
  externalAgentValue: 0,
  externalAgentName: '' as string | null,
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

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatMoney(r: RentalDetail): string {
  const sym = r.currency === 'USD' ? 'US$' : 'S/'
  return `${sym} ${Number(r.monthlyAmount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function formatAmount(amount: number, currency: string): string {
  const sym = currency === 'USD' ? 'US$' : 'S/'
  return `${sym} ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function statusLabel(s: string): string {
  const map: Record<string, string> = { ACTIVE: 'Vigente', EXPIRED: 'Vencido', CANCELLED: 'Cancelado' }
  return map[s] ?? s
}

function statusVariant(s: string): 'success' | 'error' | 'warning' | 'neutral' {
  if (s === 'ACTIVE') return 'success'
  if (s === 'EXPIRED') return 'error'
  if (s === 'CANCELLED') return 'warning'
  return 'neutral'
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
  showFinancialForm.value = false
}

const goBack = () => router.push('/alquileres/contratos')
const goToEdit = () => router.push(`/alquileres/contratos/${id.value}/editar`)
const goToFinancialConfig = () => router.push(`/alquileres/contratos/${id.value}/distribucion-financiera`)

const expenseTypeOptions = [
  { value: 'FIXED', label: 'Monto fijo' },
  { value: 'PERCENT', label: 'Porcentaje' },
]
const internalAgentOptions = computed(() => {
  const list = usersList.value ?? []
  return [{ value: '', label: 'Ninguno' }, ...list.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))]
})
// FormSelect emite null cuando value vacío; normalizamos a '' para que coincida con la opción "Ninguno"
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
</script>

<template>
  <div class="max-w-4xl mx-auto px-3 sm:px-5 py-6 sm:py-8">
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
          {{ rental?.code ?? 'Detalle del alquiler' }}
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Contrato de alquiler
        </p>
      </div>
      <div v-if="rental" class="flex items-center gap-2">
        <BaseButton variant="outline" size="sm" @click="goToFinancialConfig">
          Distribución financiera
        </BaseButton>
        <BaseButton variant="outline" @click="goToEdit">
          Editar
        </BaseButton>
      </div>
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
      <!-- Alquiler y propiedad -->
      <section
        class="p-5 rounded-xl mb-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
          Alquiler y propiedad
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Código</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ rental.code }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Estado</p>
            <Badge :variant="statusVariant(rental.status)">{{ statusLabel(rental.status) }}</Badge>
          </div>
          <div class="sm:col-span-2">
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Propiedad</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ rental.property?.code }} – {{ rental.property?.addressLine }}</p>
          </div>
        </div>
      </section>

      <!-- Partes -->
      <section
        class="p-5 rounded-xl mb-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
          Partes
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Inquilino</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ rental.tenant?.fullName }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Propietario</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ rental.property?.owner?.fullName }}</p>
          </div>
        </div>
      </section>

      <!-- Vigencia y montos -->
      <section
        class="p-5 rounded-xl mb-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
          Vigencia y montos
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Inicio</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ formatDate(rental.startDate) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Fin</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ formatDate(rental.endDate) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Monto mensual</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ formatMoney(rental) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Garantía</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
              {{ rental.securityDeposit != null ? formatMoney({ ...rental, monthlyAmount: rental.securityDeposit }) : '–' }}
            </p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Día de pago</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">Día {{ rental.paymentDueDay }} de cada mes</p>
          </div>
        </div>
      </section>

      <!-- Distribución financiera: utilidades, gastos, impuestos, agentes -->
      <section
        class="p-5 rounded-xl mb-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
            Distribución financiera
          </h2>
          <BaseButton
            v-if="!showFinancialForm"
            variant="outline"
            size="sm"
            @click="showFinancialForm = true"
          >
            {{ breakdown?.config ? 'Editar' : 'Configurar' }}
          </BaseButton>
          <BaseButton v-else variant="ghost" size="sm" @click="showFinancialForm = false">
            Cancelar
          </BaseButton>
        </div>

        <div v-if="loadingBreakdown" class="text-sm py-4" :style="{ color: 'var(--color-text-muted)' }">
          Cargando desglose...
        </div>

        <template v-else-if="breakdown">
          <!-- Desglose mensual -->
          <div class="overflow-x-auto mb-4">
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

          <!-- Formulario config (componentes reutilizables) -->
          <form
            v-if="showFinancialForm"
            class="space-y-4 p-4 rounded-lg"
            :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
            @submit.prevent="submitFinancialConfig"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex gap-2 items-end">
                <FormSelect
                  v-model="form.expenseType"
                  label="Gastos"
                  :options="expenseTypeOptions"
                  class="flex-1 min-w-0"
                />
                <FormInput
                  v-model="form.expenseValue"
                  type="number"
                  min="0"
                  step="0.01"
                  :placeholder="form.expenseType === 'PERCENT' ? '%' : '0.00'"
                  class="w-28"
                />
              </div>
              <div class="flex gap-2 items-end">
                <FormSelect
                  v-model="form.taxType"
                  label="Impuestos"
                  :options="expenseTypeOptions"
                  class="flex-1 min-w-0"
                />
                <FormInput
                  v-model="form.taxValue"
                  type="number"
                  min="0"
                  step="0.01"
                  :placeholder="form.taxType === 'PERCENT' ? '%' : '0.00'"
                  class="w-28"
                />
              </div>
              <div class="sm:col-span-2 space-y-2">
                <p class="block text-sm font-medium mb-1" :style="{ color: 'var(--color-text-primary)' }">Agente externo</p>
                <div class="flex flex-wrap gap-2 items-end">
                  <FormSelect
                    v-model="externalAgentIdModel"
                    label=""
                    :options="externalAgentOptions"
                    placeholder="Seleccionar agente..."
                    class="flex-1 min-w-[200px]"
                  />
                  <FormSelect
                    v-model="form.externalAgentType"
                    :options="expenseTypeOptions"
                    class="w-36"
                  />
                  <FormInput
                    v-model="form.externalAgentValue"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    class="w-24"
                  />
                  <FormInput
                    v-model="form.externalAgentName"
                    type="text"
                    :placeholder="form.externalAgentId ? 'Nombre del agente seleccionado' : 'Nombre (si no selecciona agente)'"
                    class="flex-1 min-w-[140px]"
                  />
                </div>
              </div>
              <div class="flex gap-2 items-end sm:col-span-2">
                <FormSelect
                  v-model="internalAgentIdModel"
                  label="Agente interno"
                  :options="internalAgentOptions"
                  placeholder="Seleccionar agente..."
                  class="flex-1 min-w-0"
                />
                <FormSelect
                  v-model="form.internalAgentType"
                  :options="expenseTypeOptions"
                  class="w-36"
                />
                <FormInput
                  v-model="form.internalAgentValue"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  class="w-28"
                />
              </div>
            </div>
            <div class="flex justify-end">
              <BaseButton type="submit" :disabled="upsertFinancial.isPending.value">
                {{ upsertFinancial.isPending.value ? 'Guardando...' : 'Guardar configuración' }}
              </BaseButton>
            </div>
          </form>
        </template>

        <p v-else class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
          Sin configuración financiera. Use "Configurar" para definir gastos, impuestos y comisiones.
        </p>
      </section>

      <!-- Adjuntos -->
      <section
        class="p-5 rounded-xl mb-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
          Adjuntos
        </h2>
        <ul class="space-y-2 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          <li class="flex items-center gap-2">
            <span v-if="rental.hasContract">✓</span>
            <span v-else>–</span>
            Contrato firmado
          </li>
          <li class="flex items-center gap-2">
            <span v-if="rental.hasDeliveryAct">✓</span>
            <span v-else>–</span>
            Acta de entrega
          </li>
        </ul>
      </section>

      <!-- Notas -->
      <section
        v-if="rental.notes"
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-2" :style="{ color: 'var(--color-text-primary)' }">
          Notas
        </h2>
        <p class="text-sm whitespace-pre-wrap" :style="{ color: 'var(--color-text-secondary)' }">{{ rental.notes }}</p>
      </section>
    </template>
  </div>
</template>
