<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import { usePropertiesList } from '../../../propiedades/presentation/composables/useProperties'
import { useClientsList } from '../../../clientes/presentation/composables/useClients'
import { useCurrencyCatalog } from '../../../../presentation/composables/useCurrencyCatalog'
import type { PropertyListItem } from '../../../propiedades/domain/property.types'
import type { ClientListItem } from '../../../clientes/domain/client.types'
import type { RentalDetail, RentalFormPayload } from '../../domain/rental.types'
import RentalContractAlertSettings from './RentalContractAlertSettings.vue'
import RentalTenantsSection from './RentalTenantsSection.vue'
/**
 * AlquilerForm — formulario único de alta/edición de contratos de alquiler.
 * Alta: se elige una propiedad disponible y hereda su monto y moneda.
 * Edición: la propiedad no cambia y se puede actualizar el estado.
 * Los adjuntos difieren entre alta y edición: cada vista los aporta en el slot `attachments`.
 */

interface Props {
  /** Contrato a editar; sin él, el formulario arranca vacío (alta) */
  initial?: RentalDetail | null
  submitLabel: string
  submitting?: boolean
  canWrite?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initial: null,
  submitting: false,
  canWrite: true,
})

const emit = defineEmits<{
  submit: [payload: RentalFormPayload]
  cancel: []
}>()

type RentalFormValues = {
  propertyId: string
  startDate: string
  endDate: string
  currency: string
  monthlyAmount: string | number
  securityDeposit: string | number
  paymentDueDay: number
  notes: string
  status: string
  enableExpirationAlerts: boolean
  enableCollectionAlerts: boolean
}

const isEditing = computed(() => !!props.initial)

const schema = yup.object({
  propertyId: yup
    .string()
    .test('required-on-create', 'Seleccione la propiedad', (v) => isEditing.value || !!v),
  startDate: yup.string().required('La fecha de inicio es requerida'),
  endDate: yup
    .string()
    .required('La fecha de fin es requerida')
    .test('after-start', 'La fecha de fin debe ser posterior al inicio', function (value) {
      const start = this.parent.startDate as string | undefined
      return !value || !start || value > start
    }),
  currency: yup.string().required('Seleccione la moneda'),
  monthlyAmount: yup
    .number()
    .transform((v) => (v === '' || isNaN(v) ? undefined : v))
    .moreThan(0, 'El monto mensual debe ser mayor a 0')
    .required('El monto mensual es requerido'),
  securityDeposit: yup
    .number()
    .transform((v) => (v === '' || isNaN(v) ? undefined : v))
    .min(0, 'No puede ser negativo')
    .nullable(),
  paymentDueDay: yup
    .number()
    .transform((_v, originalValue) =>
      originalValue === '' || originalValue == null ? NaN : Number(originalValue),
    )
    .min(1)
    .max(28)
    .required('Seleccione el día de pago'),
  notes: yup.string().trim(),
  status: yup.string().oneOf(['ACTIVE', 'EXPIRED', 'CANCELLED']).required(),
  enableExpirationAlerts: yup.boolean().required(),
  enableCollectionAlerts: yup.boolean().required(),
})

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue, resetForm } =
  useForm<RentalFormValues>({
    // yup output types no coinciden con valores de input en UI; el esquema sigue validando en runtime
    validationSchema: toTypedSchema(schema) as never,
    initialValues: {
      propertyId: '',
      startDate: '',
      endDate: '',
      currency: 'PEN',
      monthlyAmount: '',
      securityDeposit: '',
      paymentDueDay: 5,
      notes: '',
      status: 'ACTIVE',
      enableExpirationAlerts: true,
      enableCollectionAlerts: true,
    },
  })

const propertyIdBinds = defineComponentBinds('propertyId')
const startDateBinds = defineComponentBinds('startDate')
const endDateBinds = defineComponentBinds('endDate')
const currencyBinds = defineComponentBinds('currency')
const monthlyAmountBinds = defineComponentBinds('monthlyAmount')
const securityDepositBinds = defineComponentBinds('securityDeposit')
const paymentDueDayBinds = defineComponentBinds('paymentDueDay')
const notesBinds = defineComponentBinds('notes')
const statusBinds = defineComponentBinds('status')

const tenantIds = ref<string[]>([''])
const tenantIdsError = ref<string | undefined>()

// ── Catálogos ──
const { options: currencyOptions, symbol: currencySymbol, format: formatMoney, isLoading: loadingCurrencies } =
  useCurrencyCatalog()
// Alta: solo propiedades disponibles (sin contrato vigente)
const { data: propertiesData, isLoading: loadingProperties } = usePropertiesList(
  ref({ applicationSlug: 'alquileres', page: 1, limit: 200, listingStatus: 'AVAILABLE' }),
)
const { data: tenantsData, isLoading: loadingTenants } = useClientsList(
  ref({ applicationSlug: 'alquileres' as const, page: 1, limit: 200, clientType: 'TENANT' as const }),
)

const loading = computed(
  () => loadingCurrencies.value || loadingTenants.value || (!isEditing.value && loadingProperties.value),
)

const properties = computed(() => (propertiesData.value?.data ?? []) as PropertyListItem[])
const tenants = computed(() => (tenantsData.value?.data ?? []) as ClientListItem[])

const propertyOptions = computed(() =>
  properties.value.map((p) => ({ value: p.id, label: `${p.code} · ${p.addressLine}` })),
)
// Los inquilinos ya asignados se muestran aunque hoy no figuren en el combo
const tenantOptions = computed(() => {
  const list = tenants.value.map((c) => ({ value: c.id, label: c.fullName }))
  const missing = (props.initial?.tenants ?? [])
    .filter((t) => !list.some((x) => x.value === t.id))
    .map((t) => ({ value: t.id, label: t.fullName }))
  return [...list, ...missing]
})
const paymentDueDayOptions = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `Día ${i + 1} de cada mes`,
}))
const statusOptions = [
  { value: 'ACTIVE', label: 'Vigente' },
  { value: 'EXPIRED', label: 'Vencido' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

const selectedProperty = computed(() => properties.value.find((x) => x.id === values.propertyId))

// Alta: al elegir la propiedad se heredan su monto y su moneda (el usuario puede cambiarlos)
watch(
  () => values.propertyId,
  (propertyId) => {
    if (isEditing.value) return
    const p = properties.value.find((x) => x.id === propertyId)
    if (!p) return
    if (p.monthlyRent != null) setFieldValue('monthlyAmount', p.monthlyRent)
    if (p.rentCurrency) setFieldValue('currency', p.rentCurrency)
  },
)

// ── Edición: cargar valores ──
watch(
  () => props.initial,
  (r) => {
    if (!r) return
    resetForm({
      values: {
        propertyId: r.propertyId,
        startDate: r.startDate ? toCalendarDateString(r.startDate) : '',
        endDate: r.endDate ? toCalendarDateString(r.endDate) : '',
        currency: r.currency ?? 'PEN',
        monthlyAmount: r.monthlyAmount ?? '',
        securityDeposit: r.securityDeposit ?? '',
        paymentDueDay: r.paymentDueDay ?? 5,
        notes: r.notes ?? '',
        status: r.status ?? 'ACTIVE',
        enableExpirationAlerts: r.enableExpirationAlerts ?? true,
        enableCollectionAlerts: r.enableCollectionAlerts ?? true,
      },
    })
    const ids = r.tenants?.length ? r.tenants.map((t) => t.id) : r.tenant?.id ? [r.tenant.id] : []
    tenantIds.value = ids.length ? ids : ['']
  },
  { immediate: true },
)

// ── Resumen lateral ──
/** Código del contrato: operación + año de inicio + código de la propiedad */
const codePreview = computed(() => {
  if (props.initial) return props.initial.code
  if (!selectedProperty.value) return '—'
  const year = values.startDate ? values.startDate.slice(0, 4) : String(new Date().getFullYear())
  return `ALQUILER-${year}-${selectedProperty.value.code}`
})
const propertyLabel = computed(() => {
  const p = props.initial?.property ?? selectedProperty.value
  return p ? `${p.code} · ${p.addressLine}` : '—'
})
const tenantsLabel = computed(() => {
  const names = tenantIds.value
    .filter(Boolean)
    .map((id) => tenantOptions.value.find((x) => x.value === id)?.label)
    .filter(Boolean)
  return names.length ? names.join(', ') : '—'
})
/** Meses completos del contrato (la fecha de fin es inclusiva: 01/01 – 31/12 = 12 meses) */
const durationMonths = computed(() => {
  if (!values.startDate || !values.endDate || values.endDate <= values.startDate) return null
  const [sy, sm, sd] = values.startDate.split('-').map(Number)
  const [ey, em, ed] = values.endDate.split('-').map(Number)
  const dayAfterEnd = new Date(ey!, em! - 1, ed! + 1)
  let months = (dayAfterEnd.getFullYear() - sy!) * 12 + (dayAfterEnd.getMonth() - (sm! - 1))
  if (dayAfterEnd.getDate() < sd!) months -= 1
  return Math.max(months, 0)
})
const termLabel = computed(() => {
  if (!values.startDate || !values.endDate) return '—'
  const range = `${formatShortDate(values.startDate)} – ${formatShortDate(values.endDate)}`
  return durationMonths.value ? `${range} (${durationMonths.value} meses)` : range
})
const toNum = (v: string | number | null | undefined): number | null => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function validateTenantIds(): boolean {
  const ids = tenantIds.value.filter(Boolean)
  if (ids.length === 0) {
    tenantIdsError.value = 'Seleccione al menos un inquilino'
    return false
  }
  if (new Set(ids).size !== ids.length) {
    tenantIdsError.value = 'No repita el mismo inquilino'
    return false
  }
  tenantIdsError.value = undefined
  return true
}
watch(tenantIds, () => {
  if (tenantIdsError.value) validateTenantIds()
})

const onSubmit = handleSubmit(
  (v: RentalFormValues) => {
    if (!validateTenantIds()) return
    emit('submit', {
      ...(isEditing.value ? { status: v.status as RentalFormPayload['status'] } : { propertyId: v.propertyId }),
      tenantIds: tenantIds.value.filter(Boolean),
      startDate: v.startDate,
      endDate: v.endDate,
      currency: v.currency,
      monthlyAmount: toNum(v.monthlyAmount) ?? 0,
      securityDeposit: toNum(v.securityDeposit),
      paymentDueDay: Number(v.paymentDueDay),
      notes: v.notes?.trim() || null,
      enableExpirationAlerts: v.enableExpirationAlerts,
      enableCollectionAlerts: v.enableCollectionAlerts,
    })
  },
  // Con errores en el resto del formulario, mostrar también los de inquilinos
  () => {
    validateTenantIds()
  },
)
</script>

<template>
  <LoadingState v-if="loading" class="py-12" />

  <form
    v-else
    class="grid grid-cols-1 items-start gap-6 xl:grid-cols-3"
    novalidate
    @submit.prevent="onSubmit"
  >
    <!-- ── Columna principal ── -->
    <div class="space-y-6 xl:col-span-2">
      <FormSectionCard
        title="Propiedad"
        :subtitle="isEditing ? 'Inmueble del contrato (no se puede cambiar)' : 'Solo se listan propiedades disponibles'"
      >
        <FormSelect
          v-if="!isEditing"
          v-bind="propertyIdBinds"
          label="Propiedad"
          placeholder="Seleccionar propiedad"
          :options="propertyOptions"
          :error="errors.propertyId"
          required
        />
        <div
          v-else
          class="rounded-[10px] border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
        >
          <p class="font-semibold text-gray-800 dark:text-white/90">{{ initial?.property?.code }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ initial?.property?.addressLine }} · Propietario: {{ initial?.property?.owner?.fullName }}
          </p>
        </div>
        <p v-if="!isEditing && propertyOptions.length === 0" class="mt-2 text-theme-xs text-gray-500 dark:text-gray-400">
          No hay propiedades disponibles: todas tienen un contrato vigente.
        </p>
      </FormSectionCard>

      <RentalTenantsSection v-model:tenant-ids="tenantIds" :tenant-options="tenantOptions" :error="tenantIdsError" />

      <FormSectionCard title="Vigencia y pago" subtitle="Fechas del contrato y día de vencimiento de cada cuota">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormInput v-bind="startDateBinds" type="date" label="Fecha de inicio" :error="errors.startDate" required />
          <FormInput
            v-bind="endDateBinds"
            type="date"
            label="Fecha de fin"
            :min="values.startDate || undefined"
            :hint="durationMonths ? `${durationMonths} meses de contrato` : undefined"
            :error="errors.endDate"
            required
          />
          <FormSelect
            v-bind="paymentDueDayBinds"
            label="Día de pago"
            :options="paymentDueDayOptions"
            :error="errors.paymentDueDay"
            required
          />
          <FormSelect
            v-if="isEditing"
            v-bind="statusBinds"
            label="Estado del contrato"
            :options="statusOptions"
            :error="errors.status"
          />
        </div>
      </FormSectionCard>

      <FormSectionCard title="Montos" subtitle="Moneda, alquiler mensual y garantía">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormSelect
            v-bind="currencyBinds"
            label="Moneda"
            :options="currencyOptions"
            :error="errors.currency"
            required
          />
          <FormInput
            v-bind="monthlyAmountBinds"
            type="number"
            min="0"
            step="0.01"
            :label="`Monto mensual (${currencySymbol(values.currency)})`"
            placeholder="0.00"
            :error="errors.monthlyAmount"
            required
          />
          <FormInput
            v-bind="securityDepositBinds"
            type="number"
            min="0"
            step="0.01"
            :label="`Garantía (${currencySymbol(values.currency)})`"
            placeholder="0.00"
            :error="errors.securityDeposit"
          />
        </div>
        <p
          v-if="!isEditing && selectedProperty && selectedProperty.rentCurrency && selectedProperty.rentCurrency !== values.currency"
          class="mt-2 text-theme-xs text-warning-600 dark:text-orange-400"
        >
          La propiedad tiene su alquiler en {{ currencySymbol(selectedProperty.rentCurrency) }}.
        </p>
      </FormSectionCard>

      <slot name="attachments" />

      <RentalContractAlertSettings
        :enable-expiration-alerts="values.enableExpirationAlerts"
        :enable-collection-alerts="values.enableCollectionAlerts"
        @update:enable-expiration-alerts="setFieldValue('enableExpirationAlerts', $event)"
        @update:enable-collection-alerts="setFieldValue('enableCollectionAlerts', $event)"
      />

      <FormSectionCard title="Observaciones" subtitle="Notas internas sobre el contrato">
        <FormTextarea v-bind="notesBinds" placeholder="Acuerdos, condiciones especiales..." :rows="3" />
      </FormSectionCard>
    </div>

    <!-- ── Lateral: resumen + acciones (fijo en escritorio) ── -->
    <aside class="space-y-6 xl:sticky xl:top-24">
      <FormSectionCard title="Resumen">
        <dl class="space-y-3 text-sm">
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Código</dt>
            <dd class="font-semibold break-all text-gray-800 dark:text-white/90">{{ codePreview }}</dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Propiedad</dt>
            <dd class="text-gray-800 dark:text-white/90">{{ propertyLabel }}</dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Inquilino(s)</dt>
            <dd class="text-gray-800 dark:text-white/90">{{ tenantsLabel }}</dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Vigencia</dt>
            <dd class="text-gray-800 dark:text-white/90">{{ termLabel }}</dd>
          </div>
          <div class="flex gap-6">
            <div>
              <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Monto mensual</dt>
              <dd class="font-bold text-brand-500 dark:text-brand-400">
                {{ formatMoney(toNum(values.monthlyAmount) ?? 0, values.currency) }}
              </dd>
            </div>
            <div v-if="toNum(values.securityDeposit)">
              <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Garantía</dt>
              <dd class="text-gray-800 dark:text-white/90">
                {{ formatMoney(toNum(values.securityDeposit), values.currency) }}
              </dd>
            </div>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Alertas</dt>
            <dd class="mt-1 flex flex-wrap gap-1">
              <Badge :variant="values.enableExpirationAlerts ? 'success' : 'neutral'">
                Vencimiento {{ values.enableExpirationAlerts ? 'activas' : 'apagadas' }}
              </Badge>
              <Badge :variant="values.enableCollectionAlerts ? 'success' : 'neutral'">
                Cobranza {{ values.enableCollectionAlerts ? 'activas' : 'apagadas' }}
              </Badge>
            </dd>
          </div>
        </dl>
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
          :loading="submitting"
          loading-text="Guardando..."
        >
          {{ submitLabel }}
        </BaseButton>
        <BaseButton variant="outline" type="button" block @click="emit('cancel')">
          Cancelar
        </BaseButton>
        <p class="text-center text-theme-xs text-gray-400 dark:text-gray-500">
          Los campos con <span class="text-error-500">*</span> son obligatorios
        </p>
      </div>
    </aside>
  </form>
</template>
