<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, AppIcon } from '@shared/components'
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
  baseAmount: '' as number | string,
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
    baseAmount: c.baseAmount ?? '',
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
      baseAmount: form.value.baseAmount !== '' && Number(form.value.baseAmount) > 0 ? Number(form.value.baseAmount) : null,
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
  set: (v: string | null) => { form.value.internalAgentId = (v === null || v === '') ? '' : v },
})
const externalAgentIdModel = computed({
  get: () => form.value.externalAgentId ?? '',
  set: (v: string | null) => { form.value.externalAgentId = (v === null || v === '') ? '' : v },
})
const externalAgentOptions = computed(() => [
  { value: '', label: 'Ninguno (nombre manual)' },
  ...externalAgentsList.value.map((a) => ({ value: a.id, label: a.fullName })),
])
const selectedInternalUser = computed(() => {
  const uid = form.value.internalAgentId
  if (!uid) return null
  return usersList.value?.find((u) => u.id === uid) ?? null
})

const upsertSuccess = computed(() => upsertFinancial.isSuccess.value)
watch(upsertSuccess, (ok) => {
  if (ok) setTimeout(() => upsertFinancial.reset(), 3000)
})
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg transition-colors hover:bg-[var(--color-hover)] shrink-0"
        :style="{ color: 'var(--color-text-secondary)' }"
        title="Volver al detalle"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <AppIcon icon="lucide:sliders-horizontal" :size="18" color="var(--color-primary)" />
          <h1 class="text-xl font-bold truncate" :style="{ color: 'var(--color-text-primary)' }">
            Distribución financiera – {{ rental?.code ?? 'Alquiler' }}
          </h1>
        </div>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Monto ingresado, gastos, impuestos y comisiones de agentes
        </p>
      </div>
      <BaseButton variant="outline" size="sm" class="flex items-center gap-1.5 shrink-0" @click="goToEdit">
        <AppIcon icon="lucide:pencil" :size="14" />
        <span class="hidden sm:inline">Editar alquiler</span>
      </BaseButton>
    </div>

    <!-- Loading -->
    <div v-if="loadingRental" class="flex flex-col items-center justify-center py-24 gap-3">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
      <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando información...</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="rentalError || !rental"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="text-sm font-medium" :style="{ color: 'var(--color-error)' }">
        No se encontró el alquiler o ocurrió un error.
      </p>
      <BaseButton variant="outline" size="sm" @click="goBack">Volver</BaseButton>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <!-- Columna principal: configuración -->
        <div class="xl:col-span-2 space-y-5">

          <!-- Monto base -->
          <section
            class="p-5 rounded-xl"
            :style="{
              backgroundColor: 'var(--color-surface)',
              border: '2px solid var(--color-primary)',
              borderStyle: 'dashed',
            }"
          >
            <div class="flex items-center gap-2 mb-1">
              <AppIcon icon="lucide:banknote" :size="18" color="var(--color-primary)" />
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
                Monto ingresado por el alquiler
              </h2>
            </div>
            <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
              Importe real que la empresa recibe por este alquiler. Sobre este monto se calculan todos los descuentos.
              Si se deja vacío, se usa el monto del contrato
              <strong>{{ rental ? formatAmount(rental.monthlyAmount, rental.currency) : '' }}</strong>.
            </p>
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
          </section>

          <!-- Descuentos: Gastos e Impuestos -->
          <section
            class="p-5 rounded-xl"
            :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
          >
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-warning, #d97706)1a' }">
                <AppIcon icon="lucide:minus-circle" :size="17" color="var(--color-warning, #d97706)" />
              </div>
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Gastos e Impuestos</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <!-- Gastos -->
              <div
                class="p-4 rounded-lg space-y-3"
                :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
              >
                <div class="flex items-center gap-2">
                  <AppIcon icon="lucide:receipt" :size="15" color="var(--color-text-muted)" />
                  <label class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Gastos</label>
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
              </div>
              <!-- Impuestos -->
              <div
                class="p-4 rounded-lg space-y-3"
                :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
              >
                <div class="flex items-center gap-2">
                  <AppIcon icon="lucide:landmark" :size="15" color="var(--color-text-muted)" />
                  <label class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Impuestos</label>
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
              </div>
            </div>
          </section>

          <!-- Agente Externo -->
          <section
            class="p-5 rounded-xl"
            :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
          >
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
                <AppIcon icon="lucide:user-round-cog" :size="17" color="var(--color-primary)" />
              </div>
              <div>
                <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Agente externo</h2>
                <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Agente externo a la empresa</p>
              </div>
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
          </section>

          <!-- Agente Interno -->
          <section
            class="p-5 rounded-xl"
            :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
          >
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
                <AppIcon icon="lucide:user-check" :size="17" color="var(--color-primary)" />
              </div>
              <div>
                <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Agente interno</h2>
                <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Usuario de la empresa</p>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <FormSelect
                  v-model="internalAgentIdModel"
                  label="Seleccionar usuario interno"
                  :options="internalAgentOptions"
                  placeholder="Ninguno"
                />
                <div
                  v-if="selectedInternalUser"
                  class="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  :style="{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)' }"
                >
                  <AppIcon icon="lucide:mail" :size="14" />
                  <span>{{ selectedInternalUser.email }}</span>
                </div>
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
            </div>
          </section>

          <!-- Mensaje de éxito -->
          <div
            v-if="upsertFinancial.isSuccess.value"
            class="flex items-center gap-3 px-4 py-3 rounded-lg"
            :style="{ backgroundColor: 'var(--color-success, #16a34a)15', border: '1px solid var(--color-success, #16a34a)40', color: 'var(--color-success, #16a34a)' }"
          >
            <AppIcon icon="lucide:circle-check" :size="18" />
            <span class="text-sm font-medium">Configuración guardada correctamente.</span>
          </div>

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
          <!-- Resumen del contrato -->
          <section
            class="p-5 rounded-xl"
            :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
          >
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
                <AppIcon icon="lucide:file-text" :size="17" color="var(--color-primary)" />
              </div>
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Información del contrato</h2>
            </div>
            <dl class="space-y-3 text-sm">
              <div>
                <dt class="font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Monto mensual (contrato)</dt>
                <dd class="font-bold text-base" :style="{ color: 'var(--color-text-primary)' }">
                  {{ rental ? formatAmount(rental.monthlyAmount, rental.currency) : '—' }}
                </dd>
              </div>
              <div>
                <dt class="font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Monto base para distribución</dt>
                <dd class="font-bold text-base" :style="{ color: 'var(--color-primary)' }">
                  {{ breakdown ? formatAmount(breakdown.baseAmount, breakdown.currency) : '—' }}
                </dd>
                <dd class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
                  <span v-if="breakdown && breakdown.baseAmount !== breakdown.monthlyAmount">Monto personalizado</span>
                  <span v-else>Igual al contrato</span>
                </dd>
              </div>
            </dl>
          </section>

          <!-- Desglose actual -->
          <section
            class="p-5 rounded-xl"
            :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
          >
            <div class="flex items-center gap-2 mb-4">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
                <AppIcon icon="lucide:pie-chart" :size="17" color="var(--color-primary)" />
              </div>
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Desglose actual</h2>
            </div>

            <div v-if="loadingBreakdown" class="flex items-center gap-2 py-4" :style="{ color: 'var(--color-text-muted)' }">
              <AppIcon icon="svg-spinners:ring-resize" :size="18" color="var(--color-primary)" />
              <span class="text-sm">Calculando...</span>
            </div>

            <div v-else-if="breakdown" class="rounded-lg overflow-hidden" :style="{ border: '1px solid var(--color-border)' }">
              <table class="w-full text-xs">
                <tbody>
                  <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                    <td class="py-2.5 px-3 flex items-center gap-1.5" :style="{ color: 'var(--color-text-primary)' }">
                      <AppIcon icon="lucide:circle-plus" :size="13" color="var(--color-success, #16a34a)" />
                      Ingreso base
                    </td>
                    <td class="py-2.5 px-3 text-right font-semibold" :style="{ color: 'var(--color-text-primary)' }">
                      {{ formatAmount(breakdown.baseAmount, breakdown.currency) }}
                    </td>
                  </tr>
                  <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                    <td class="py-2.5 px-3" :style="{ color: 'var(--color-text-secondary)' }">
                      <span class="flex items-center gap-1.5">
                        <AppIcon icon="lucide:minus-circle" :size="13" color="var(--color-warning, #d97706)" />
                        Gastos
                      </span>
                    </td>
                    <td class="py-2.5 px-3 text-right" :style="{ color: 'var(--color-text-secondary)' }">
                      − {{ formatAmount(breakdown.expense, breakdown.currency) }}
                    </td>
                  </tr>
                  <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                    <td class="py-2.5 px-3" :style="{ color: 'var(--color-text-secondary)' }">
                      <span class="flex items-center gap-1.5">
                        <AppIcon icon="lucide:minus-circle" :size="13" color="var(--color-warning, #d97706)" />
                        Impuestos
                      </span>
                    </td>
                    <td class="py-2.5 px-3 text-right" :style="{ color: 'var(--color-text-secondary)' }">
                      − {{ formatAmount(breakdown.tax, breakdown.currency) }}
                    </td>
                  </tr>
                  <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                    <td class="py-2.5 px-3" :style="{ color: 'var(--color-text-secondary)' }">
                      <span class="flex items-center gap-1.5">
                        <AppIcon icon="lucide:minus-circle" :size="13" color="var(--color-warning, #d97706)" />
                        Ag. externo
                      </span>
                    </td>
                    <td class="py-2.5 px-3 text-right" :style="{ color: 'var(--color-text-secondary)' }">
                      − {{ formatAmount(breakdown.externalAgentCommission, breakdown.currency) }}
                    </td>
                  </tr>
                  <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                    <td class="py-2.5 px-3" :style="{ color: 'var(--color-text-secondary)' }">
                      <span class="flex items-center gap-1.5">
                        <AppIcon icon="lucide:minus-circle" :size="13" color="var(--color-warning, #d97706)" />
                        Ag. interno
                      </span>
                    </td>
                    <td class="py-2.5 px-3 text-right" :style="{ color: 'var(--color-text-secondary)' }">
                      − {{ formatAmount(breakdown.internalAgentCommission, breakdown.currency) }}
                    </td>
                  </tr>
                  <tr :style="{ backgroundColor: 'var(--color-primary)0d' }">
                    <td class="py-3 px-3 font-bold" :style="{ color: 'var(--color-text-primary)' }">
                      <span class="flex items-center gap-1.5">
                        <AppIcon icon="lucide:circle-check" :size="14" color="var(--color-primary)" />
                        Utilidad neta
                      </span>
                    </td>
                    <td class="py-3 px-3 text-right font-bold text-sm" :style="{ color: 'var(--color-primary)' }">
                      {{ formatAmount(breakdown.utility, breakdown.currency) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              v-else
              class="flex flex-col items-center py-6 gap-2 rounded-lg"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px dashed var(--color-border)' }"
            >
              <AppIcon icon="lucide:bar-chart-2" :size="24" color="var(--color-text-muted)" />
              <p class="text-xs text-center" :style="{ color: 'var(--color-text-muted)' }">
                Configura los valores para ver el desglose
              </p>
            </div>
          </section>

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
