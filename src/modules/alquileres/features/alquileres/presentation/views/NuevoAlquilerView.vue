<script setup lang="ts">
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { usePropertiesList } from '../../../propiedades/presentation/composables/useProperties'
import { useClientsList } from '../../../clientes/presentation/composables/useClients'
import { useCreateRental } from '../composables/useRentals'
import RentalContractAlertSettings from '../components/RentalContractAlertSettings.vue'
import RentalTenantsSection from '../components/RentalTenantsSection.vue'
import type { PropertyListItem } from '../../../propiedades/domain/property.types'
import type { ClientListItem } from '../../../clientes/domain/client.types'
import { navigateAfterAlquileresSave } from '../../../../presentation/navigation/navigateAfterAlquileresSave'
type NuevoRentalFormValues = {
  propertyId: string
  startDate: string
  endDate: string
  currency: string
  monthlyAmount: string | number
  securityDeposit: string | number
  paymentDueDay: number
  notes: string
  enableExpirationAlerts: boolean
  enableCollectionAlerts: boolean
}

const route = useRoute()
const router = useRouter()

const listPropertiesParams = ref({
  applicationSlug: 'alquileres' as const,
  page: 1,
  limit: 200,
  listingStatus: 'AVAILABLE' as const, // Solo propiedades disponibles (no alquiladas)
})
const listTenantsParams = ref({
  applicationSlug: 'alquileres' as const,
  page: 1,
  limit: 200,
  clientType: 'TENANT' as const,
})

const contractFile = ref<File | null>(null)
const deliveryActFile = ref<File | null>(null)

const schema = yup.object({
  propertyId: yup.string().required('Seleccione la propiedad'),
  startDate: yup.string().required('La fecha de inicio es requerida'),
  endDate: yup.string().required('La fecha de fin es requerida'),
  currency: yup.string().required(),
  monthlyAmount: yup
    .number()
    .transform((v) => (v === '' || isNaN(v) ? undefined : v))
    .min(0)
    .required('El monto mensual es requerido'),
  securityDeposit: yup
    .number()
    .transform((v) => (v === '' || isNaN(v) ? undefined : v))
    .min(0)
    .nullable(),
  paymentDueDay: yup
    .number()
    .transform((_v, originalValue) => {
      if (originalValue === '' || originalValue === null || originalValue === undefined) return NaN
      return Number(originalValue)
    })
    .min(1)
    .max(28)
    .required(),
  notes: yup.string().trim(),
  enableExpirationAlerts: yup.boolean().required(),
  enableCollectionAlerts: yup.boolean().required(),
})

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue } =
  useForm<NuevoRentalFormValues>({
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
      enableExpirationAlerts: true,
      enableCollectionAlerts: true,
    },
  })

const propertyIdBinds = defineComponentBinds('propertyId')
const startDateBinds = defineComponentBinds('startDate')
const tenantIds = ref<string[]>([''])
const tenantIdsError = ref<string | undefined>()
const endDateBinds = defineComponentBinds('endDate')
const currencyBinds = defineComponentBinds('currency')
const monthlyAmountBinds = defineComponentBinds('monthlyAmount')
const securityDepositBinds = defineComponentBinds('securityDeposit')
const paymentDueDayBinds = defineComponentBinds('paymentDueDay')
const notesBinds = defineComponentBinds('notes')

const { data: propertiesData } = usePropertiesList(listPropertiesParams)
const { data: tenantsData, refetch: refetchTenants } = useClientsList(listTenantsParams)
const createRentalMutation = useCreateRental()

const loading = computed(() => !propertiesData.value || !tenantsData.value)

const properties = computed(() => propertiesData.value?.data ?? [])
const tenants = computed(() => tenantsData.value?.data ?? [])

const propertyOptions = computed(() =>
  (properties.value as PropertyListItem[]).map((p) => ({
    value: p.id,
    label: `${p.code} - ${p.addressLine}`,
  })),
)
const tenantOptions = computed(() =>
  (tenants.value as ClientListItem[]).map((c) => ({
    value: c.id,
    label: c.fullName,
  })),
)

const currencyOptions = [
  { value: 'PEN', label: 'Soles (S/)' },
  { value: 'USD', label: 'Dólares (USD)' },
]
const paymentDueDayOptions = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `Día ${i + 1} de cada mes`,
}))

const selectedProperty = computed(() =>
  (properties.value as PropertyListItem[]).find((x) => x.id === values.propertyId),
)
const selectedPropertyLabel = computed(() => {
  const p = selectedProperty.value
  return p ? `${p.code} - ${p.addressLine}` : 'Sin seleccionar'
})

// Pre-llenar monto de alquiler (y garantía si hay datos) al elegir propiedad; el usuario puede modificar
watch(
  () => values.propertyId,
  (propertyId) => {
    const p = (properties.value as PropertyListItem[]).find((x) => x.id === propertyId)
    if (p && p.monthlyRent != null) setFieldValue('monthlyAmount', p.monthlyRent)
  },
)
const selectedTenantsLabel = computed(() => {
  const names = tenantIds.value
    .filter(Boolean)
    .map((id) => (tenants.value as ClientListItem[]).find((x) => x.id === id)?.fullName)
    .filter(Boolean)
  return names.length ? names.join(', ') : 'Sin seleccionar'
})

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
const vigenciaLabel = computed(() => {
  if (!values.startDate || !values.endDate) return 'Sin definir'
  return `${values.startDate} - ${values.endDate}`
})
const montoLabel = computed(() => {
  const n = Number(values.monthlyAmount)
  if (isNaN(n)) return 'S/ 0.00'
  const sym = values.currency === 'USD' ? 'US$' : 'S/'
  return `${sym} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
})

const goBack = () => router.push('/alquileres/contratos')
onMounted(async () => {
  const id = route.query.selectedClientId
  if (typeof id !== 'string' || !id) return
  await refetchTenants()
  const indexRaw = route.query.tenantIndex
  const index = typeof indexRaw === 'string' && indexRaw !== '' ? Number.parseInt(indexRaw, 10) : 0
  const next = [...tenantIds.value]
  const idx = Number.isFinite(index) && index >= 0 ? index : 0
  while (next.length <= idx) next.push('')
  next[idx] = id
  tenantIds.value = next
})

const toNum = (v: string | number | null | undefined): number | null => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

const onSubmit = handleSubmit(async (formValues: NuevoRentalFormValues) => {
  if (!validateTenantIds()) return
  try {
    await createRentalMutation.mutateAsync({
      data: {
        applicationSlug: 'alquileres',
        propertyId: formValues.propertyId,
        tenantIds: tenantIds.value.filter(Boolean),
        startDate: formValues.startDate,
        endDate: formValues.endDate,
        currency: formValues.currency,
        monthlyAmount: toNum(formValues.monthlyAmount) ?? 0,
        securityDeposit: toNum(formValues.securityDeposit),
        paymentDueDay: formValues.paymentDueDay,
        notes: formValues.notes?.trim() || null,
        enableExpirationAlerts: formValues.enableExpirationAlerts,
        enableCollectionAlerts: formValues.enableCollectionAlerts,
      },
      files: {
        contractFile: contractFile.value ?? undefined,
        deliveryActFile: deliveryActFile.value ?? undefined,
      },
    })
    contractFile.value = null
    deliveryActFile.value = null
    tenantIds.value = ['']

    await navigateAfterAlquileresSave(router, {
      listPath: '/alquileres/contratos',
      invalidate: () => createRentalMutation.invalidateList(),
    })
  } catch {
    void 0
  }
})
</script>

<template>
  <div >
    <PageHeader
      title="Alquiler"
      subtitle="Registrar un nuevo alquiler"
      back
      @back="goBack"
      class="mb-6"
    />

    <LoadingState v-if="loading" class="py-12" />

    <form v-else @submit.prevent="onSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-6">
        <FormSectionCard
          title="Propiedad"
          subtitle="Selecciona la propiedad a alquilar"
          icon="lucide:building-2"
        >
          <FormSelect
            v-bind="propertyIdBinds"
            label="Seleccionar propiedad"
            placeholder="Seleccionar propiedad"
            :options="propertyOptions"
            :error="errors.propertyId"
            required
          />
        </FormSectionCard>

        <RentalTenantsSection
          v-model:tenant-ids="tenantIds"
          :tenant-options="tenantOptions"
          :error="tenantIdsError"
          return-to="/alquileres/contratos/nuevo"
        />

        <FormSectionCard
          title="Fechas y Condiciones"
          subtitle="Vigencia, montos y día de pago"
          icon="lucide:calendar"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              v-bind="startDateBinds"
              type="date"
              label="Fecha de Inicio"
              :error="errors.startDate"
              required
            />
            <FormInput
              v-bind="endDateBinds"
              type="date"
              label="Fecha de Fin"
              :error="errors.endDate"
              required
            />
            <FormSelect
              v-bind="currencyBinds"
              label="Moneda"
              :options="currencyOptions"
            />
            <FormInput
              v-bind="monthlyAmountBinds"
              type="number"
              min="0"
              step="0.01"
              label="Monto Mensual"
              placeholder="0.00"
              :error="errors.monthlyAmount"
              required
            />
            <FormInput
              v-bind="securityDepositBinds"
              type="number"
              min="0"
              step="0.01"
              label="Depósito de Garantía"
              placeholder="0.00"
            />
            <FormSelect
              v-bind="paymentDueDayBinds"
              label="Día de Vencimiento de Pago"
              :options="paymentDueDayOptions"
            />
          </div>
        </FormSectionCard>

        <FormSectionCard
          title="Adjuntos"
          subtitle="Contrato y acta de entrega"
          icon="lucide:paperclip"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileDropzone
              v-model="contractFile"
              label="Adjuntar contrato"
              accept=".pdf,.doc,.docx,image/*"
              placeholder="Arrastra el contrato aquí o haz clic para seleccionar"
              :max-size="10 * 1024 * 1024"
              hint="PDF, Word o imágenes. Máx. 10 MB"
            />
            <FileDropzone
              v-model="deliveryActFile"
              label="Adjuntar Acta de entrega de la propiedad"
              accept=".pdf,.doc,.docx,image/*"
              placeholder="Arrastra el acta aquí o haz clic para seleccionar"
              :max-size="10 * 1024 * 1024"
              hint="PDF, Word o imágenes. Máx. 10 MB"
            />
          </div>
        </FormSectionCard>

        <RentalContractAlertSettings
          :enable-expiration-alerts="values.enableExpirationAlerts"
          :enable-collection-alerts="values.enableCollectionAlerts"
          @update:enable-expiration-alerts="setFieldValue('enableExpirationAlerts', $event)"
          @update:enable-collection-alerts="setFieldValue('enableCollectionAlerts', $event)"
        />

        <FormSectionCard
          title="Observaciones"
          subtitle="Notas adicionales sobre el contrato"
          icon="lucide:message-square"
        >
          <FormTextarea
            v-bind="notesBinds"
            placeholder="Notas adicionales sobre el contrato..."
            :rows="3"
          />
        </FormSectionCard>
      </div>

      <!-- Resumen -->
      <div class="lg:col-span-1">
        <FormSectionCard
          title="Resumen del Contrato"
          dense
        >
          <dl class="space-y-3 text-sm">
            <div>
              <dt class="font-medium text-gray-400 dark:text-gray-500">Propiedad</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ selectedPropertyLabel }}</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-400 dark:text-gray-500">Inquilino</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ selectedTenantsLabel }}</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-400 dark:text-gray-500">Vigencia</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ vigenciaLabel }}</dd>
            </div>
            <div>
              <dt class="font-medium text-gray-400 dark:text-gray-500">Monto Mensual</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ montoLabel }}</dd>
            </div>
          </dl>
          <div class="mt-6 flex flex-col gap-3">
            <BaseButton
              type="submit"
              variant="primary"
              class="w-full flex items-center justify-center gap-2"
              :loading="createRentalMutation.isPending.value"
            >
              <AppIcon icon="lucide:save" :size="20" color="currentColor" />
              Guardar Contrato
            </BaseButton>
            <BaseButton type="button" variant="outline" class="w-full" @click="goBack">
              Cancelar
            </BaseButton>
          </div>
        </FormSectionCard>
      </div>
    </form>
  </div>
</template>
