<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('alquileres')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import {
  useRental,
  useRentalFinancialBreakdown,
  useUpsertRentalFinancialConfig,
} from '../composables/useRentals'
import { useAgentsList } from '../../../agentes/presentation/composables/useAgents'
import { useCurrencyCatalog } from '../../../../presentation/composables/useCurrencyCatalog'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import type { FinancialValueType, RentalFinancialConfig } from '../../domain/rental.types'
import FinancialAmountFields from '../components/FinancialAmountFields.vue'
import AgentCommissionFields from '../components/AgentCommissionFields.vue'
import FinancialBreakdownSummary from '../components/FinancialBreakdownSummary.vue'
const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const {
  data: rental,
  isLoading: loadingRental,
  isError: rentalError,
  error: rentalFetchError,
  refetch: refetchRental,
} = useRental(id)
const {
  data: breakdown,
  isLoading: loadingBreakdown,
  isError: breakdownQueryError,
  error: breakdownFetchError,
  refetch: refetchBreakdown,
} = useRentalFinancialBreakdown(id)
const upsertFinancial = useUpsertRentalFinancialConfig()
const { format: formatMoney, symbol: currencySymbol } = useCurrencyCatalog()

const agentParams = (type: 'EXTERNAL' | 'INTERNAL') =>
  ref({ applicationSlug: 'alquileres', type, page: 1, limit: 200, isActive: true })
const { data: externalAgentsResult } = useAgentsList(agentParams('EXTERNAL'))
const { data: internalAgentsResult } = useAgentsList(agentParams('INTERNAL'))
const externalAgentOptions = computed(() =>
  (externalAgentsResult.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
)
const internalAgentOptions = computed(() =>
  (internalAgentsResult.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
)

/** Moneda del contrato: base de la distribución y de los porcentajes */
const contractCurrency = computed(() => rental.value?.currency ?? 'PEN')

type FormState = {
  baseAmount: number | string
  expenseType: FinancialValueType
  expenseValue: number | string
  expenseCurrency: string | null
  expenseDetail: string
  taxType: FinancialValueType
  taxValue: number | string
  taxCurrency: string | null
  taxDetail: string
  externalAgentId: string
  externalAgentType: FinancialValueType
  externalAgentValue: number | string
  externalAgentCurrency: string | null
  externalAgentName: string
  internalAgentId: string
  internalAgentType: FinancialValueType
  internalAgentValue: number | string
  internalAgentCurrency: string | null
  internalAgentName: string
}

function fromConfig(c: RentalFinancialConfig | null | undefined): FormState {
  return {
    baseAmount: c?.baseAmount ?? '',
    expenseType: c?.expenseType ?? 'FIXED',
    expenseValue: c?.expenseValue ?? 0,
    expenseCurrency: c?.expenseCurrency ?? null,
    expenseDetail: c?.expenseDetail ?? '',
    taxType: c?.taxType ?? 'FIXED',
    taxValue: c?.taxValue ?? 0,
    taxCurrency: c?.taxCurrency ?? null,
    taxDetail: c?.taxDetail ?? '',
    externalAgentId: c?.externalAgentId ?? '',
    externalAgentType: c?.externalAgentType ?? 'FIXED',
    externalAgentValue: c?.externalAgentValue ?? 0,
    externalAgentCurrency: c?.externalAgentCurrency ?? null,
    externalAgentName: c?.externalAgentName ?? '',
    internalAgentId: c?.internalAgentId ?? '',
    internalAgentType: c?.internalAgentType ?? 'FIXED',
    internalAgentValue: c?.internalAgentValue ?? 0,
    internalAgentCurrency: c?.internalAgentCurrency ?? null,
    internalAgentName: c?.internalAgentName ?? '',
  }
}

const form = ref<FormState>(fromConfig(null))
const saved = ref<string>(JSON.stringify(form.value))
watch(
  breakdown,
  (b) => {
    form.value = fromConfig(b?.config)
    saved.value = JSON.stringify(form.value)
  },
  { immediate: true },
)
/** El desglose lateral refleja lo guardado: se avisa si hay cambios pendientes */
const isDirty = computed(() => JSON.stringify(form.value) !== saved.value)

// ── Validación ──
const num = (v: number | string) => (v === '' || v === null ? 0 : Number(v))
function lineError(type: FinancialValueType, value: number | string): string | undefined {
  const n = num(value)
  if (!Number.isFinite(n) || n < 0) return 'Ingrese un valor mayor o igual a 0'
  if (type === 'PERCENT' && n > 100) return 'El porcentaje no puede superar 100'
  return undefined
}
const errors = computed(() => ({
  baseAmount: num(form.value.baseAmount) < 0 ? 'No puede ser negativo' : undefined,
  expense: lineError(form.value.expenseType, form.value.expenseValue),
  tax: lineError(form.value.taxType, form.value.taxValue),
  externalAgent: lineError(form.value.externalAgentType, form.value.externalAgentValue),
  internalAgent: lineError(form.value.internalAgentType, form.value.internalAgentValue),
}))
const hasErrors = computed(() => Object.values(errors.value).some(Boolean))
const showErrors = ref(false)
const visibleErrors = computed(() =>
  showErrors.value ? errors.value : { baseAmount: undefined, expense: undefined, tax: undefined, externalAgent: undefined, internalAgent: undefined },
)

/** Moneda de un monto fijo; los porcentajes siempre van en la del contrato */
const lineCurrency = (type: FinancialValueType, currency: string | null) =>
  type === 'PERCENT' ? null : currency

async function submitFinancialConfig() {
  showErrors.value = true
  if (!id.value || hasErrors.value) return
  const f = form.value
  try {
    await upsertFinancial.mutateAsync({
      rentalId: id.value,
      data: {
        currency: contractCurrency.value,
        baseAmount: num(f.baseAmount) > 0 ? num(f.baseAmount) : null,
        expenseType: f.expenseType,
        expenseValue: num(f.expenseValue),
        expenseCurrency: lineCurrency(f.expenseType, f.expenseCurrency),
        expenseDetail: f.expenseDetail.trim() || null,
        taxType: f.taxType,
        taxValue: num(f.taxValue),
        taxCurrency: lineCurrency(f.taxType, f.taxCurrency),
        taxDetail: f.taxDetail.trim() || null,
        externalAgentId: f.externalAgentId || null,
        externalAgentType: f.externalAgentType,
        externalAgentValue: num(f.externalAgentValue),
        externalAgentCurrency: lineCurrency(f.externalAgentType, f.externalAgentCurrency),
        externalAgentName: f.externalAgentId ? null : f.externalAgentName.trim() || null,
        internalAgentId: f.internalAgentId || null,
        internalAgentType: f.internalAgentType,
        internalAgentValue: num(f.internalAgentValue),
        internalAgentCurrency: lineCurrency(f.internalAgentType, f.internalAgentCurrency),
        internalAgentName: f.internalAgentId ? null : f.internalAgentName.trim() || null,
      },
    })
    showErrors.value = false
  } catch {
    void 0
  }
}

const goBack = () => router.push(`/alquileres/contratos/${id.value}`)
const goToEdit = () => router.push(`/alquileres/contratos/${id.value}/editar`)
</script>

<template>
  <div>
    <PageHeader
      title="Distribución financiera"
      :subtitle="rental ? `${rental.code} · ${rental.property?.addressLine ?? ''}` : 'Cargando...'"
      back
      @back="goBack"
      class="mb-6"
    >
      <template #actions>
        <BaseButton v-if="canWrite" variant="outline" size="sm" icon="lucide:pencil" @click="goToEdit">
          Editar contrato
        </BaseButton>
      </template>
    </PageHeader>

    <LoadingState v-if="loadingRental" text="Cargando información..." class="py-24" />

    <div v-else-if="rentalError || !rental" class="flex flex-col items-center justify-center gap-3 py-16">
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="max-w-md text-center text-sm font-medium text-error-500 dark:text-error-400">
        {{ rentalError ? getApiErrorMessage(rentalFetchError) : 'No se encontró el alquiler.' }}
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <BaseButton v-if="rentalError" variant="outline" size="sm" @click="() => refetchRental()">Reintentar</BaseButton>
        <BaseButton variant="outline" size="sm" @click="goBack">Volver</BaseButton>
      </div>
    </div>

    <form
      v-else
      class="grid grid-cols-1 items-start gap-6 xl:grid-cols-3"
      novalidate
      @submit.prevent="submitFinancialConfig"
    >
      <!-- ── Columna principal ── -->
      <div class="space-y-6 xl:col-span-2">
        <FormSectionCard
          title="Ingreso"
          :subtitle="`Monto que recibe la empresa, en ${currencySymbol(contractCurrency)} (moneda del contrato). Sobre él se calculan los porcentajes.`"
        >
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p class="text-theme-xs text-gray-400 dark:text-gray-500">Monto mensual del contrato</p>
              <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
                {{ formatMoney(rental.monthlyAmount, rental.currency) }}
              </p>
            </div>
            <FormInput
              v-model="form.baseAmount"
              type="number"
              min="0"
              step="0.01"
              :label="`Monto base para la distribución (${currencySymbol(contractCurrency)})`"
              :placeholder="String(rental.monthlyAmount)"
              hint="Vacío: se usa el monto del contrato"
              :error="visibleErrors.baseAmount"
            />
          </div>
        </FormSectionCard>

        <FormSectionCard title="Gastos e impuestos" subtitle="Se descuentan del ingreso">
          <div class="space-y-6">
            <div class="space-y-3">
              <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Gastos</p>
              <FinancialAmountFields
                v-model:type="form.expenseType"
                v-model:value="form.expenseValue"
                v-model:currency="form.expenseCurrency"
                :contract-currency="contractCurrency"
                value-label="Gasto"
                :error="visibleErrors.expense"
              />
              <FormTextarea
                v-model="form.expenseDetail"
                label="Detalle del gasto"
                placeholder="Mantenimiento, comisión bancaria, seguro..."
                :rows="2"
              />
            </div>
            <div class="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-800">
              <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Impuestos</p>
              <FinancialAmountFields
                v-model:type="form.taxType"
                v-model:value="form.taxValue"
                v-model:currency="form.taxCurrency"
                :contract-currency="contractCurrency"
                value-label="Impuesto"
                :error="visibleErrors.tax"
              />
              <FormTextarea
                v-model="form.taxDetail"
                label="Detalle del impuesto"
                placeholder="IGV, renta de 1.ª categoría..."
                :rows="2"
              />
            </div>
          </div>
        </FormSectionCard>

        <FormSectionCard
          title="Comisiones de agentes"
          subtitle="Los porcentajes se calculan sobre el ingreso menos gastos e impuestos"
        >
          <div class="space-y-6">
            <AgentCommissionFields
              v-model:agent-id="form.externalAgentId"
              v-model:agent-name="form.externalAgentName"
              v-model:type="form.externalAgentType"
              v-model:value="form.externalAgentValue"
              v-model:currency="form.externalAgentCurrency"
              agent-type="EXTERNAL"
              :agent-options="externalAgentOptions"
              :contract-currency="contractCurrency"
              :can-write="canWrite"
              :value-error="visibleErrors.externalAgent"
            />
            <div class="border-t border-gray-100 pt-5 dark:border-gray-800">
              <AgentCommissionFields
                v-model:agent-id="form.internalAgentId"
                v-model:agent-name="form.internalAgentName"
                v-model:type="form.internalAgentType"
                v-model:value="form.internalAgentValue"
                v-model:currency="form.internalAgentCurrency"
                agent-type="INTERNAL"
                :agent-options="internalAgentOptions"
                :contract-currency="contractCurrency"
                :can-write="canWrite"
                :value-error="visibleErrors.internalAgent"
              />
            </div>
          </div>
        </FormSectionCard>
      </div>

      <!-- ── Lateral: desglose + acciones (fijo en escritorio) ── -->
      <aside class="space-y-6 xl:sticky xl:top-24">
        <FormSectionCard title="Desglose" subtitle="Según la última configuración guardada">
          <template #actions>
            <Badge v-if="isDirty" variant="warning">Cambios sin guardar</Badge>
          </template>
          <LoadingState v-if="loadingBreakdown" variant="inline" text="Calculando..." />
          <div v-else-if="breakdownQueryError" class="flex flex-col items-center gap-2 py-4 text-center">
            <p class="text-xs text-error-500 dark:text-error-400">{{ getApiErrorMessage(breakdownFetchError) }}</p>
            <BaseButton variant="outline" size="sm" @click="() => refetchBreakdown()">Reintentar</BaseButton>
          </div>
          <FinancialBreakdownSummary v-else-if="breakdown" :breakdown="breakdown" />
        </FormSectionCard>

        <div
          class="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"
        >
          <BaseButton
            v-if="canWrite"
            type="submit"
            variant="primary"
            icon="lucide:save"
            block
            :loading="upsertFinancial.isPending.value"
            loading-text="Guardando..."
          >
            Guardar distribución
          </BaseButton>
          <BaseButton type="button" variant="outline" icon="lucide:arrow-left" block @click="goBack">
            Volver al contrato
          </BaseButton>
        </div>
      </aside>
    </form>
  </div>
</template>
