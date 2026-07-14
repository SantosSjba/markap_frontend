<script setup lang="ts">
import { toCalendarDateString } from '@/shared/utils/formatters'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import { BaseButton, AppIcon, FormSectionCard } from '@shared/components'
import { FormInput, FormSelect, FormTextarea, FileDropzone } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import { useRental, useUpdateRental } from '../../application/useRentals'
import { getAttachmentUrl } from '../../infrastructure/http/rental-attachment-url'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import RentalContractAlertSettings from '../components/RentalContractAlertSettings.vue'
import RentalTenantsSection from '../components/RentalTenantsSection.vue'
import { useClientsList } from '@modules/alquileres/features/clientes'
import type { ClientListItem } from '@modules/alquileres/features/clientes'
import { navigateAfterAlquileresSave } from '@modules/alquileres/application'

type EditarRentalFormValues = {
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

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const contractFile = ref<File | null>(null)
const deliveryActFile = ref<File | null>(null)

const schema = yup.object({
  startDate: yup.string().required('La fecha de inicio es requerida'),
  endDate: yup.string().required('La fecha de fin es requerida'),
  currency: yup.string().required(),
  monthlyAmount: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).required('El monto mensual es requerido'),
  securityDeposit: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).nullable(),
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
  status: yup.string().oneOf(['ACTIVE', 'EXPIRED', 'CANCELLED']).required(),
  enableExpirationAlerts: yup.boolean().required(),
  enableCollectionAlerts: yup.boolean().required(),
})

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue, resetForm } = useForm<EditarRentalFormValues>({
  validationSchema: toTypedSchema(schema) as never,
  initialValues: {
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

const startDateBinds = defineComponentBinds('startDate')
const endDateBinds = defineComponentBinds('endDate')
const currencyBinds = defineComponentBinds('currency')
const monthlyAmountBinds = defineComponentBinds('monthlyAmount')
const securityDepositBinds = defineComponentBinds('securityDeposit')
const paymentDueDayBinds = defineComponentBinds('paymentDueDay')
const notesBinds = defineComponentBinds('notes')
const statusBinds = defineComponentBinds('status')

const {
  data: rental,
  isLoading: loadingRental,
  isError: rentalError,
  error: rentalFetchError,
  refetch: refetchRental,
} = useRental(id)
const updateMutation = useUpdateRental()

const listTenantsParams = ref({
  applicationSlug: 'alquileres' as const,
  page: 1,
  limit: 200,
  clientType: 'TENANT' as const,
})
const { data: tenantsData, refetch: refetchTenants } = useClientsList(listTenantsParams)
const tenantIds = ref<string[]>([''])
const tenantIdsError = ref<string | undefined>()

const tenantOptions = computed(() =>
  ((tenantsData.value?.data ?? []) as ClientListItem[]).map((c) => ({
    value: c.id,
    label: c.fullName,
  })),
)

const loading = computed(() => loadingRental.value)

watch(
  rental,
  (r) => {
    if (!r) return
    resetForm({
      values: {
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
    const ids =
      r.tenants?.length ? r.tenants.map((t) => t.id) : r.tenant?.id ? [r.tenant.id] : []
    tenantIds.value = ids.length ? ids : ['']
  },
  { immediate: true },
)

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

const currencyOptions = [
  { value: 'PEN', label: 'Soles (S/)' },
  { value: 'USD', label: 'Dólares (USD)' },
]
const paymentDueDayOptions = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `Día ${i + 1} de cada mes`,
}))
const statusOptions = [
  { value: 'ACTIVE', label: 'Vigente' },
  { value: 'EXPIRED', label: 'Vencido' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

const goBack = () => router.push(`/alquileres/contratos/${id.value}`)

onMounted(async () => {
  const clientId = route.query.selectedClientId
  if (typeof clientId !== 'string' || !clientId) return
  await refetchTenants()
  const indexRaw = route.query.tenantIndex
  const index =
    typeof indexRaw === 'string' && indexRaw !== '' ? Number.parseInt(indexRaw, 10) : 0
  const next = [...tenantIds.value]
  const idx = Number.isFinite(index) && index >= 0 ? index : 0
  while (next.length <= idx) next.push('')
  next[idx] = clientId
  tenantIds.value = next
})

const toNum = (v: string | number | null | undefined): number | null => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

const onSubmit = handleSubmit(async (formValues: EditarRentalFormValues) => {
  if (!validateTenantIds()) return
  try {
    await updateMutation.mutateAsync({
      id: id.value,
      data: {
        startDate: formValues.startDate,
        endDate: formValues.endDate,
        currency: formValues.currency,
        monthlyAmount: toNum(formValues.monthlyAmount) ?? 0,
        securityDeposit: toNum(formValues.securityDeposit),
        paymentDueDay: formValues.paymentDueDay,
        notes: formValues.notes?.trim() || null,
        status: formValues.status as 'ACTIVE' | 'EXPIRED' | 'CANCELLED',
        enableExpirationAlerts: formValues.enableExpirationAlerts,
        enableCollectionAlerts: formValues.enableCollectionAlerts,
        tenantIds: tenantIds.value.filter(Boolean),
      },
      files: {
        contractFile: contractFile.value ?? undefined,
        deliveryActFile: deliveryActFile.value ?? undefined,
      },
    })
    contractFile.value = null
    deliveryActFile.value = null

    await navigateAfterAlquileresSave(router, {
      listPath: '/alquileres/contratos',
      invalidate: () => updateMutation.invalidateList(),
    })
  } catch {
    void 0
  }
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
          <AppIcon icon="lucide:pencil" :size="18" color="var(--color-primary)" />
          <h1 class="text-xl font-bold truncate" :style="{ color: 'var(--color-text-primary)' }">
            Editar alquiler {{ rental?.code ?? '' }}
          </h1>
        </div>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Modificar fechas, montos, adjuntos y estado del contrato
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-3">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
      <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando contrato...</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="rentalError || !rental"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="text-sm font-medium text-center max-w-md" :style="{ color: 'var(--color-error)' }">
        {{ rentalError ? getApiErrorMessage(rentalFetchError) : 'No se encontró el alquiler.' }}
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <BaseButton v-if="rentalError" variant="outline" size="sm" @click="() => refetchRental()">Reintentar</BaseButton>
        <BaseButton variant="outline" size="sm" @click="goBack">Volver</BaseButton>
      </div>
    </div>

    <form v-else class="grid grid-cols-1 xl:grid-cols-3 gap-5" @submit.prevent="onSubmit">
      <!-- Columna principal -->
      <div class="xl:col-span-2 space-y-5">

        <FormSectionCard
          title="Propiedad"
          subtitle="Datos del inmueble del contrato"
          icon="lucide:building-2"
        >
          <span
            class="inline-block mb-3 text-xs px-2 py-0.5 rounded-full font-medium"
            :style="{ backgroundColor: 'var(--color-surface-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }"
          >
            Solo lectura
          </span>
          <div
            class="flex items-center gap-3 p-3 rounded-lg"
            :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
          >
            <AppIcon icon="lucide:map-pin" :size="16" color="var(--color-text-muted)" />
            <div class="min-w-0">
              <p class="text-xs font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Propiedad</p>
              <p class="text-sm font-semibold truncate" :style="{ color: 'var(--color-text-primary)' }">
                {{ rental?.property?.code }} – {{ rental?.property?.addressLine }}
              </p>
            </div>
          </div>
        </FormSectionCard>

        <RentalTenantsSection
          v-model:tenant-ids="tenantIds"
          :tenant-options="tenantOptions"
          :error="tenantIdsError"
          :return-to="`/alquileres/contratos/${id}/editar`"
        />

        <FormSectionCard
          title="Fechas y condiciones"
          subtitle="Vigencia, montos y estado del contrato"
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
            <div class="md:col-span-2">
              <FormSelect
                v-bind="statusBinds"
                label="Estado del contrato"
                :options="statusOptions"
              />
            </div>
          </div>
        </FormSectionCard>

        <FormSectionCard
          title="Adjuntos"
          subtitle="Reemplaza o agrega documentos al contrato (PDF, Word o imágenes, máx. 10 MB)"
          icon="lucide:paperclip"
        >
          <!-- Adjuntos actuales con descarga -->
          <div class="space-y-2 mb-4">
            <!-- Contrato actual -->
            <div
              class="flex items-center gap-3 p-3 rounded-lg text-sm"
              :style="{
                backgroundColor: rental.hasContract ? 'var(--color-success, #16a34a)0f' : 'var(--color-surface-elevated)',
                border: `1px solid ${rental.hasContract ? 'var(--color-success, #16a34a)33' : 'var(--color-border)'}`,
              }"
            >
              <AppIcon
                :icon="rental.hasContract ? 'lucide:file-check-2' : 'lucide:file-x-2'"
                :size="16"
                :color="rental.hasContract ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)'"
              />
              <div class="flex-1 min-w-0">
                <span class="font-medium block" :style="{ color: rental.hasContract ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }">
                  Contrato firmado
                </span>
                <span v-if="rental.attachments?.find(a => a.type === 'CONTRACT')" class="text-xs truncate block" :style="{ color: 'var(--color-text-muted)' }">
                  {{ rental.attachments.find(a => a.type === 'CONTRACT')!.originalFileName }}
                </span>
                <span v-else class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Sin archivo — sube uno abajo</span>
              </div>
              <a
                v-if="rental.attachments?.find(a => a.type === 'CONTRACT')"
                :href="getAttachmentUrl(rental.attachments.find(a => a.type === 'CONTRACT')!)"
                target="_blank"
                download
                class="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md shrink-0"
                :style="{ color: 'var(--color-primary)', background: 'var(--color-primary)1a' }"
              >
                <AppIcon icon="lucide:download" :size="12" />
                Descargar
              </a>
            </div>

            <!-- Acta actual -->
            <div
              class="flex items-center gap-3 p-3 rounded-lg text-sm"
              :style="{
                backgroundColor: rental.hasDeliveryAct ? 'var(--color-success, #16a34a)0f' : 'var(--color-surface-elevated)',
                border: `1px solid ${rental.hasDeliveryAct ? 'var(--color-success, #16a34a)33' : 'var(--color-border)'}`,
              }"
            >
              <AppIcon
                :icon="rental.hasDeliveryAct ? 'lucide:file-check-2' : 'lucide:file-x-2'"
                :size="16"
                :color="rental.hasDeliveryAct ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)'"
              />
              <div class="flex-1 min-w-0">
                <span class="font-medium block" :style="{ color: rental.hasDeliveryAct ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }">
                  Acta de entrega
                </span>
                <span v-if="rental.attachments?.find(a => a.type === 'DELIVERY_ACT')" class="text-xs truncate block" :style="{ color: 'var(--color-text-muted)' }">
                  {{ rental.attachments.find(a => a.type === 'DELIVERY_ACT')!.originalFileName }}
                </span>
                <span v-else class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Sin archivo — sube uno abajo</span>
              </div>
              <a
                v-if="rental.attachments?.find(a => a.type === 'DELIVERY_ACT')"
                :href="getAttachmentUrl(rental.attachments.find(a => a.type === 'DELIVERY_ACT')!)"
                target="_blank"
                download
                class="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md shrink-0"
                :style="{ color: 'var(--color-primary)', background: 'var(--color-primary)1a' }"
              >
                <AppIcon icon="lucide:download" :size="12" />
                Descargar
              </a>
            </div>
          </div>

          <p class="text-xs mb-3" :style="{ color: 'var(--color-text-muted)' }">
            Subir un nuevo archivo reemplazará el existente.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FileDropzone
              v-model="contractFile"
              label="Contrato firmado"
              accept=".pdf,.doc,.docx,image/*"
              placeholder="Arrastra el contrato aquí o haz clic para seleccionar"
              :max-size="10 * 1024 * 1024"
              hint="Reemplaza el contrato actual. PDF, Word o imágenes."
            />
            <FileDropzone
              v-model="deliveryActFile"
              label="Acta de entrega de la propiedad"
              accept=".pdf,.doc,.docx,image/*"
              placeholder="Arrastra el acta aquí o haz clic para seleccionar"
              :max-size="10 * 1024 * 1024"
              hint="Reemplaza el acta actual. PDF, Word o imágenes."
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

      <!-- Columna lateral: resumen y acciones -->
      <div class="xl:col-span-1">
        <div
          class="p-5 rounded-xl border sticky top-4"
          :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
        >
          <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">
            Resumen del contrato
          </h2>
          <dl class="space-y-3 text-sm mb-6">
            <div>
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:map-pin" :size="13" />
                Propiedad
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ rental?.property?.code }} – {{ rental?.property?.addressLine }}</dd>
            </div>
            <div>
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:user" :size="13" />
                Inquilino
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">
                {{
                  (rental?.tenants?.length
                    ? rental.tenants.map((t) => t.fullName)
                    : rental?.tenant?.fullName
                      ? [rental.tenant.fullName]
                      : []
                  ).join(', ') || '—'
                }}
              </dd>
            </div>
            <div class="border-t pt-3" :style="{ borderColor: 'var(--color-border)' }">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:calendar" :size="13" />
                Vigencia
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">
                {{ values.startDate || '—' }} → {{ values.endDate || '—' }}
              </dd>
            </div>
            <div>
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:banknote" :size="13" />
                Monto mensual
              </dt>
              <dd class="font-bold" :style="{ color: 'var(--color-primary)' }">
                {{ values.currency === 'USD' ? 'US$' : 'S/' }}
                {{ values.monthlyAmount !== '' && values.monthlyAmount !== undefined ? Number(values.monthlyAmount).toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '0.00' }}
              </dd>
            </div>
          </dl>

          <div class="flex flex-col gap-3">
            <BaseButton
              type="submit"
              variant="primary"
              class="w-full flex items-center justify-center gap-2"
              :loading="updateMutation.isPending.value"
            >
              <AppIcon icon="lucide:save" :size="16" />
              Guardar cambios
            </BaseButton>
            <BaseButton type="button" variant="outline" class="w-full flex items-center justify-center gap-2" @click="goBack">
              <AppIcon icon="lucide:x" :size="16" />
              Cancelar
            </BaseButton>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
