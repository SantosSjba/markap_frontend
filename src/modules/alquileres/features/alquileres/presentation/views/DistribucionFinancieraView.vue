<script setup lang="ts">
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableRow } from '@shared/presentation/ui/table'
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import {
  useRental,
  useRentalFinancialBreakdown,
  useUpsertRentalFinancialConfig,
} from '../composables/useRentals'
import { navigateAfterAlquileresSave } from '../../../../presentation/navigation/navigateAfterAlquileresSave'
import { useAgentsList } from '../../../agentes/presentation/composables/useAgents'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { RENTAL_UTILITY_NET_LABEL } from '../../domain/rental-financial.labels'
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
const externalAgentsParams = ref({
  applicationSlug: 'alquileres',
  type: 'EXTERNAL' as const,
  page: 1,
  limit: 200,
  isActive: true,
})
const internalAgentsParams = ref({
  applicationSlug: 'alquileres',
  type: 'INTERNAL' as const,
  page: 1,
  limit: 200,
  isActive: true,
})
const {
  data: externalAgentsResult,
  isError: externalAgentsQueryError,
  error: externalAgentsFetchError,
  refetch: refetchExternalAgents,
} = useAgentsList(externalAgentsParams)
const {
  data: internalAgentsResult,
  isError: internalAgentsQueryError,
  error: internalAgentsFetchError,
  refetch: refetchInternalAgents,
} = useAgentsList(internalAgentsParams)
const externalAgentsList = computed(() => externalAgentsResult.value?.data ?? [])
const internalAgentsList = computed(() => internalAgentsResult.value?.data ?? [])

const form = ref({
  baseAmount: '' as number | string,
  expenseType: 'FIXED' as 'PERCENT' | 'FIXED',
  expenseValue: 0,
  expenseDetail: '',
  taxType: 'FIXED' as 'PERCENT' | 'FIXED',
  taxValue: 0,
  taxDetail: '',
  externalAgentId: '' as string | null,
  externalAgentType: 'FIXED' as 'PERCENT' | 'FIXED',
  externalAgentValue: 0,
  externalAgentName: '',
  internalAgentId: '' as string | null,
  internalAgentType: 'FIXED' as 'PERCENT' | 'FIXED',
  internalAgentValue: 0,
  internalAgentName: '',
})

watch(
  breakdown,
  (b) => {
    if (!b?.config) return
    const c = b.config
    form.value = {
      baseAmount: c.baseAmount ?? '',
      expenseType: c.expenseType,
      expenseValue: c.expenseValue,
      expenseDetail: c.expenseDetail ?? '',
      taxType: c.taxType,
      taxValue: c.taxValue,
      taxDetail: c.taxDetail ?? '',
      externalAgentId: c.externalAgentId ?? '',
      externalAgentType: c.externalAgentType,
      externalAgentValue: c.externalAgentValue,
      externalAgentName: c.externalAgentName ?? '',
      internalAgentId: c.internalAgentId ?? '',
      internalAgentType: c.internalAgentType,
      internalAgentValue: c.internalAgentValue,
      internalAgentName: c.internalAgentName ?? '',
    }
  },
  { immediate: true },
)

function formatAmount(amount: number, currency: string): string {
  const sym = currency === 'USD' ? 'US$' : 'S/'
  return `${sym} ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

async function submitFinancialConfig() {
  if (!id.value) return
  try {
    await upsertFinancial.mutateAsync({
      rentalId: id.value,
      data: {
        baseAmount:
          form.value.baseAmount !== '' && Number(form.value.baseAmount) > 0
            ? Number(form.value.baseAmount)
            : null,
        expenseType: form.value.expenseType,
        expenseValue: form.value.expenseValue,
        expenseDetail: form.value.expenseDetail.trim() || null,
        taxType: form.value.taxType,
        taxValue: form.value.taxValue,
        taxDetail: form.value.taxDetail.trim() || null,
        externalAgentId: form.value.externalAgentId || null,
        externalAgentType: form.value.externalAgentType,
        externalAgentValue: form.value.externalAgentValue,
        externalAgentName: form.value.externalAgentName || null,
        internalAgentId: form.value.internalAgentId || null,
        internalAgentType: form.value.internalAgentType,
        internalAgentValue: form.value.internalAgentValue,
        internalAgentName: form.value.internalAgentName || null,
      },
    })
    await navigateAfterAlquileresSave(router, { listPath: '/alquileres/contratos' })
  } catch {
    void 0
  }
}

const goBack = () => router.push(`/alquileres/contratos/${id.value}`)
const goToEdit = () => router.push(`/alquileres/contratos/${id.value}/editar`)

const distributionReturnPath = computed(
  () => `/alquileres/contratos/${id.value}/distribucion-financiera`,
)

function goToNewAgent(type: 'EXTERNAL' | 'INTERNAL', field: 'external' | 'internal') {
  if (!id.value) return
  router.push({
    name: 'alquileres-agentes-nuevo',
    query: {
      agentType: type,
      agentField: field,
      returnTo: distributionReturnPath.value,
    },
  })
}

function applySelectedAgentFromQuery() {
  const agentId = route.query.selectedAgentId
  const field = route.query.agentField
  if (typeof agentId !== 'string' || !agentId) return

  if (field === 'external') {
    const agent = externalAgentsList.value.find((a) => a.id === agentId)
    form.value.externalAgentId = agentId
    if (agent) form.value.externalAgentName = agent.fullName
  } else if (field === 'internal') {
    const agent = internalAgentsList.value.find((a) => a.id === agentId)
    form.value.internalAgentId = agentId
    if (agent) form.value.internalAgentName = agent.fullName
  }

  router.replace({ path: route.path })
}

onMounted(async () => {
  const agentId = route.query.selectedAgentId
  if (typeof agentId !== 'string' || !agentId) return
  const field = route.query.agentField
  if (field === 'external') await refetchExternalAgents()
  else if (field === 'internal') await refetchInternalAgents()
  applySelectedAgentFromQuery()
})

const expenseTypeOptions = [
  { value: 'FIXED', label: 'Monto fijo' },
  { value: 'PERCENT', label: 'Porcentaje' },
]
const internalAgentIdModel = computed({
  get: () => form.value.internalAgentId ?? '',
  set: (v: string | null) => {
    form.value.internalAgentId = v === null || v === '' ? '' : v
  },
})
const internalAgentOptions = computed(() => [
  { value: '', label: 'Ninguno (nombre manual)' },
  ...internalAgentsList.value.map((a) => ({ value: a.id, label: a.fullName })),
])
const externalAgentIdModel = computed({
  get: () => form.value.externalAgentId ?? '',
  set: (v: string | null) => {
    form.value.externalAgentId = v === null || v === '' ? '' : v
  },
})
const externalAgentOptions = computed(() => [
  { value: '', label: 'Ninguno (nombre manual)' },
  ...externalAgentsList.value.map((a) => ({ value: a.id, label: a.fullName })),
])
const upsertSuccess = computed(() => upsertFinancial.isSuccess.value)
watch(upsertSuccess, (ok) => {
  if (ok) setTimeout(() => upsertFinancial.reset(), 3000)
})
</script>

<template>
  <div >
    <!-- Header -->
    <PageHeader
      :title="`Distribución financiera – ${rental?.code ?? 'Alquiler'}`"
      subtitle="Monto ingresado, gastos, impuestos y comisiones de agentes"
      back
      @back="goBack"
      class="mb-6"
    >
      <template #actions>
        <BaseButton variant="outline" size="sm" class="flex items-center gap-1.5 shrink-0" @click="goToEdit">
        <AppIcon icon="lucide:pencil" :size="14" />
        <span class="hidden sm:inline">Editar alquiler</span>
      </BaseButton>
      </template>
    </PageHeader>

    <!-- Loading -->
    <LoadingState v-if="loadingRental" text="Cargando información..." class="py-24" />

    <!-- Error -->
    <div
      v-else-if="rentalError || !rental"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="text-sm font-medium text-center max-w-md text-error-500 dark:text-error-400">
        {{ rentalError ? getApiErrorMessage(rentalFetchError) : 'No se encontró el alquiler.' }}
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <BaseButton v-if="rentalError" variant="outline" size="sm" @click="() => refetchRental()">Reintentar</BaseButton>
        <BaseButton variant="outline" size="sm" @click="goBack">Volver</BaseButton>
      </div>
    </div>

    <template v-else>
      <div
        v-if="internalAgentsQueryError || externalAgentsQueryError"
        class="mb-5 rounded-xl border px-4 py-3 text-sm space-y-2 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
      >
        <p v-if="internalAgentsQueryError" class="flex flex-wrap items-center gap-2 text-gray-800 dark:text-white/90">
          <span class="font-medium text-error-600 dark:text-error-500">Agentes internos</span>
          <span class="text-xs flex-1 min-w-0">{{ getApiErrorMessage(internalAgentsFetchError) }}</span>
          <BaseButton variant="outline" size="sm" @click="() => refetchInternalAgents()">Reintentar</BaseButton>
        </p>
        <p v-if="externalAgentsQueryError" class="flex flex-wrap items-center gap-2 text-gray-800 dark:text-white/90">
          <span class="font-medium text-error-600 dark:text-error-500">Agentes externos</span>
          <span class="text-xs flex-1 min-w-0">{{ getApiErrorMessage(externalAgentsFetchError) }}</span>
          <BaseButton variant="outline" size="sm" @click="() => refetchExternalAgents()">Reintentar</BaseButton>
        </p>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <!-- Columna principal: configuración -->
        <div class="xl:col-span-2 space-y-5">

          <FormSectionCard
            title="Monto ingresado por el alquiler"
            :subtitle="`Importe real que la empresa recibe por este alquiler. Sobre este monto se calculan todos los descuentos. Si se deja vacío, se usa el monto del contrato ${rental ? formatAmount(rental.monthlyAmount, rental.currency) : ''}.`"
            icon="lucide:banknote"
          >
            <div class="max-w-xs">
              <FormInput
                v-model="form.baseAmount"
                type="number"
                min="0"
                step="0.01"
                label="Monto base para distribución"
                :placeholder="`Ej: ${rental?.monthlyAmount ?? 0}`"
              />
            </div>
          </FormSectionCard>

          <FormSectionCard
            title="Gastos e Impuestos"
            subtitle="Descuentos sobre el monto base"
            icon="lucide:receipt"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <!-- Gastos -->
              <div
                class="p-4 rounded-lg space-y-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
              >
                <div class="flex items-center gap-2">
                  <AppIcon icon="lucide:receipt" :size="15" color="var(--color-text-muted)" />
                  <label class="text-sm font-semibold text-gray-800 dark:text-white/90">Gastos</label>
                </div>
                <FormSelect
                  v-model="form.expenseType"
                  label="Tipo"
                  :options="expenseTypeOptions"
                />
                <FormInput
                  v-model="form.expenseValue"
                  type="number"
                  min="0"
                  step="0.01"
                  :label="form.expenseType === 'PERCENT' ? 'Porcentaje (%)' : 'Monto fijo'"
                  :placeholder="form.expenseType === 'PERCENT' ? 'Ej: 5' : '0.00'"
                />
                <FormTextarea
                  v-model="form.expenseDetail"
                  label="Detalle del gasto"
                  placeholder="Ej: Mantenimiento, comisión bancaria, seguro..."
                  :rows="2"
                />
              </div>
              <!-- Impuestos -->
              <div
                class="p-4 rounded-lg space-y-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
              >
                <div class="flex items-center gap-2">
                  <AppIcon icon="lucide:landmark" :size="15" color="var(--color-text-muted)" />
                  <label class="text-sm font-semibold text-gray-800 dark:text-white/90">Impuestos</label>
                </div>
                <FormSelect
                  v-model="form.taxType"
                  label="Tipo"
                  :options="expenseTypeOptions"
                />
                <FormInput
                  v-model="form.taxValue"
                  type="number"
                  min="0"
                  step="0.01"
                  :label="form.taxType === 'PERCENT' ? 'Porcentaje (%)' : 'Monto fijo'"
                  :placeholder="form.taxType === 'PERCENT' ? 'Ej: 18' : '0.00'"
                />
                <FormTextarea
                  v-model="form.taxDetail"
                  label="Detalle del impuesto"
                  placeholder="Ej: IGV, renta de 4ta categoría..."
                  :rows="2"
                />
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard
            title="Agente externo"
            subtitle="Agente externo a la empresa"
            icon="lucide:user-cog"
          >
            <div class="flex justify-end mb-4">
              <BaseButton
                type="button"
                variant="outline"
                size="sm"
                class="flex items-center gap-1.5 shrink-0"
                @click="goToNewAgent('EXTERNAL', 'external')"
              >
                <AppIcon icon="lucide:user-plus" :size="15" />
                Nuevo agente externo
              </BaseButton>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <FormSelect
                  v-model="externalAgentIdModel"
                  label="Seleccionar agente externo"
                  :options="externalAgentOptions"
                  placeholder="Ninguno"
                />
              </div>
              <FormSelect
                v-model="form.externalAgentType"
                label="Tipo de comisión"
                :options="expenseTypeOptions"
              />
              <FormInput
                v-model="form.externalAgentValue"
                type="number"
                min="0"
                step="0.01"
                :label="form.externalAgentType === 'PERCENT' ? 'Comisión (%)' : 'Comisión (monto fijo)'"
                placeholder="0"
              />
              <div class="sm:col-span-2">
                <FormInput
                  v-model="form.externalAgentName"
                  type="text"
                  label="Nombre (si no elige agente del sistema)"
                  :placeholder="form.externalAgentId ? 'Se usará el nombre del agente seleccionado' : 'Ej: Juan Pérez Inmobiliaria'"
                />
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard
            title="Agente interno"
            subtitle="Agente de la empresa (catálogo o nombre manual)"
            icon="lucide:user-check"
          >
            <div class="flex justify-end mb-4">
              <BaseButton
                type="button"
                variant="outline"
                size="sm"
                class="flex items-center gap-1.5 shrink-0"
                @click="goToNewAgent('INTERNAL', 'internal')"
              >
                <AppIcon icon="lucide:user-plus" :size="15" />
                Nuevo agente interno
              </BaseButton>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <FormSelect
                  v-model="internalAgentIdModel"
                  label="Seleccionar agente interno"
                  :options="internalAgentOptions"
                  placeholder="Ninguno"
                />
              </div>
              <FormSelect
                v-model="form.internalAgentType"
                label="Tipo de comisión"
                :options="expenseTypeOptions"
              />
              <FormInput
                v-model="form.internalAgentValue"
                type="number"
                min="0"
                step="0.01"
                :label="form.internalAgentType === 'PERCENT' ? 'Comisión (%)' : 'Comisión (monto fijo)'"
                placeholder="0"
              />
              <div class="sm:col-span-2">
                <FormInput
                  v-model="form.internalAgentName"
                  type="text"
                  label="Nombre (si no elige agente del catálogo)"
                  :placeholder="form.internalAgentId ? 'Se usará el nombre del agente seleccionado' : 'Ej: María López'"
                />
              </div>
            </div>
          </FormSectionCard>

          <!-- Mensaje de éxito -->
          <BaseAlert v-if="upsertFinancial.isSuccess.value" type="success">
            <span class="text-sm font-medium">Configuración guardada correctamente.</span>
          </BaseAlert>

          <!-- Botones de acción (móvil) -->
          <div class="xl:hidden flex gap-3">
            <BaseButton
              type="button"
              variant="primary"
              class="flex-1 flex items-center justify-center gap-2"
              :loading="upsertFinancial.isPending.value"
              @click="submitFinancialConfig"
            >
              <AppIcon icon="lucide:save" :size="16" />
              Guardar configuración
            </BaseButton>
            <BaseButton type="button" variant="outline" class="flex items-center gap-2" @click="goBack">
              <AppIcon icon="lucide:x" :size="16" />
              Cancelar
            </BaseButton>
          </div>
        </div>

        <!-- Columna lateral: desglose + acciones -->
        <div class="space-y-5">
          <FormSectionCard
            title="Información del contrato"
            subtitle="Montos del contrato y base de distribución"
            icon="lucide:clipboard-list"
          >
            <dl class="space-y-3 text-sm">
              <div>
                <dt class="font-medium mb-0.5 text-gray-400 dark:text-gray-500">Monto mensual (contrato)</dt>
                <dd class="font-bold text-base text-gray-800 dark:text-white/90">
                  {{ rental ? formatAmount(rental.monthlyAmount, rental.currency) : '—' }}
                </dd>
              </div>
              <div>
                <dt class="font-medium mb-0.5 text-gray-400 dark:text-gray-500">Monto base para distribución</dt>
                <dd class="font-bold text-base text-brand-500 dark:text-brand-400">
                  {{ breakdown ? formatAmount(breakdown.baseAmount, breakdown.currency) : '—' }}
                </dd>
                <dd class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
                  <span v-if="breakdown && breakdown.baseAmount !== breakdown.monthlyAmount">Monto personalizado</span>
                  <span v-else>Igual al contrato</span>
                </dd>
              </div>
            </dl>
          </FormSectionCard>

          <FormSectionCard
            title="Desglose actual"
            subtitle="Cálculo según la configuración guardada"
            icon="lucide:wallet"
          >
            <LoadingState v-if="loadingBreakdown" variant="inline" text="Calculando..." />

            <div
              v-else-if="breakdownQueryError"
              class="flex flex-col items-center py-6 gap-2 rounded-lg text-center px-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
            >
              <p class="text-xs text-error-500 dark:text-error-400">{{ getApiErrorMessage(breakdownFetchError) }}</p>
              <BaseButton variant="outline" size="sm" @click="() => refetchBreakdown()">Reintentar</BaseButton>
            </div>

            <div v-else-if="breakdown" class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
              <Table class="w-full text-xs">
                <TableBody>
                  <TableRow class="border-b border-gray-200 dark:border-gray-800">
                    <TableCell class="py-2.5 px-3 flex items-center gap-1.5 text-gray-800 dark:text-white/90">
                      <AppIcon icon="lucide:circle-plus" :size="13" color="var(--color-success, #16a34a)" />
                      Ingreso base
                    </TableCell>
                    <TableCell class="py-2.5 px-3 text-right font-semibold text-gray-800 dark:text-white/90">
                      {{ formatAmount(breakdown.baseAmount, breakdown.currency) }}
                    </TableCell>
                  </TableRow>
                  <TableRow class="border-b border-gray-200 dark:border-gray-800">
                    <TableCell class="py-2.5 px-3 text-gray-500 dark:text-gray-400">
                      <span class="flex items-center gap-1.5">
                        <AppIcon icon="lucide:minus-circle" :size="13" color="var(--color-warning, #d97706)" />
                        Gastos
                      </span>
                      <p
                        v-if="breakdown.config?.expenseDetail"
                        class="text-[11px] mt-1 pl-5 line-clamp-2 text-gray-400 dark:text-gray-500"
                      >
                        {{ breakdown.config.expenseDetail }}
                      </p>
                    </TableCell>
                    <TableCell class="py-2.5 px-3 text-right text-gray-500 dark:text-gray-400">
                      − {{ formatAmount(breakdown.expense, breakdown.currency) }}
                    </TableCell>
                  </TableRow>
                  <TableRow class="border-b border-gray-200 dark:border-gray-800">
                    <TableCell class="py-2.5 px-3 text-gray-500 dark:text-gray-400">
                      <span class="flex items-center gap-1.5">
                        <AppIcon icon="lucide:minus-circle" :size="13" color="var(--color-warning, #d97706)" />
                        Impuestos
                      </span>
                      <p
                        v-if="breakdown.config?.taxDetail"
                        class="text-[11px] mt-1 pl-5 line-clamp-2 text-gray-400 dark:text-gray-500"
                      >
                        {{ breakdown.config.taxDetail }}
                      </p>
                    </TableCell>
                    <TableCell class="py-2.5 px-3 text-right text-gray-500 dark:text-gray-400">
                      − {{ formatAmount(breakdown.tax, breakdown.currency) }}
                    </TableCell>
                  </TableRow>
                  <TableRow class="border-b border-gray-200 dark:border-gray-800">
                    <TableCell class="py-2.5 px-3 text-gray-500 dark:text-gray-400">
                      <span class="flex items-center gap-1.5">
                        <AppIcon icon="lucide:minus-circle" :size="13" color="var(--color-warning, #d97706)" />
                        Ag. externo
                      </span>
                    </TableCell>
                    <TableCell class="py-2.5 px-3 text-right text-gray-500 dark:text-gray-400">
                      − {{ formatAmount(breakdown.externalAgentCommission, breakdown.currency) }}
                    </TableCell>
                  </TableRow>
                  <TableRow class="border-b border-gray-200 dark:border-gray-800">
                    <TableCell class="py-2.5 px-3 text-gray-500 dark:text-gray-400">
                      <span class="flex items-center gap-1.5">
                        <AppIcon icon="lucide:minus-circle" :size="13" color="var(--color-warning, #d97706)" />
                        Ag. interno
                      </span>
                    </TableCell>
                    <TableCell class="py-2.5 px-3 text-right text-gray-500 dark:text-gray-400">
                      − {{ formatAmount(breakdown.internalAgentCommission, breakdown.currency) }}
                    </TableCell>
                  </TableRow>
                  <TableRow class="bg-brand-500/5">
                    <TableCell class="py-3 px-3 font-bold text-gray-800 dark:text-white/90">
                      <span class="flex items-center gap-1.5">
                        <AppIcon icon="lucide:circle-check" :size="14" color="var(--color-primary)" />
                        {{ RENTAL_UTILITY_NET_LABEL }}
                      </span>
                    </TableCell>
                    <TableCell class="py-3 px-3 text-right font-bold text-sm text-brand-500 dark:text-brand-400">
                      {{ formatAmount(breakdown.utility, breakdown.currency) }}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div
              v-else
              class="flex flex-col items-center py-6 gap-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700"
            >
              <AppIcon icon="lucide:bar-chart-2" :size="24" color="var(--color-text-muted)" />
              <p class="text-xs text-center text-gray-400 dark:text-gray-500">
                Configura los valores para ver el desglose
              </p>
            </div>
          </FormSectionCard>

          <!-- Botón guardar (desktop) -->
          <div class="hidden xl:flex flex-col gap-3">
            <BaseButton
              type="button"
              variant="primary"
              class="w-full flex items-center justify-center gap-2"
              :loading="upsertFinancial.isPending.value"
              @click="submitFinancialConfig"
            >
              <AppIcon icon="lucide:save" :size="16" />
              Guardar configuración
            </BaseButton>
            <BaseButton type="button" variant="outline" class="w-full flex items-center justify-center gap-2" @click="goBack">
              <AppIcon icon="lucide:arrow-left" :size="16" />
              Volver al detalle
            </BaseButton>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
