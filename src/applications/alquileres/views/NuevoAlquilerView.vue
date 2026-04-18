<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { FormInput, FormSelect, FormTextarea, FileDropzone } from '@shared/components'
import { usePropertiesList } from '@applications/alquileres/propiedades/composables/useProperties'
import { useClientsList } from '@applications/alquileres/clientes/composables/useClients'
import { useCreateRental } from '../composables/useRentals'
import type { PropertyListItem } from '@applications/alquileres/propiedades/services/properties.service'
import type { ClientListItem } from '@applications/alquileres/clientes/services/clients.service'

const route = useRoute()
const router = useRouter()
const appColor = 'var(--color-primary)'

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

const form = ref({
  propertyId: '',
  tenantId: '',
  startDate: '',
  endDate: '',
  currency: 'PEN',
  monthlyAmount: '' as string | number,
  securityDeposit: '' as string | number,
  paymentDueDay: 5 as number,
  notes: '',
  enableAlerts: true,
})
const contractFile = ref<File | null>(null)
const deliveryActFile = ref<File | null>(null)

const errors = ref<Record<string, string>>({})

const schema = yup.object({
  propertyId: yup.string().required('Seleccione la propiedad'),
  tenantId: yup.string().required('Seleccione el inquilino'),
  startDate: yup.string().required('La fecha de inicio es requerida'),
  endDate: yup.string().required('La fecha de fin es requerida'),
  currency: yup.string().required(),
  monthlyAmount: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).required('El monto mensual es requerido'),
  securityDeposit: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).nullable(),
  paymentDueDay: yup.number().min(1).max(28).required(),
  notes: yup.string().trim(),
})

const { data: propertiesData } = usePropertiesList(listPropertiesParams)
const { data: tenantsData, refetch: refetchTenants } = useClientsList(listTenantsParams)
const createRentalMutation = useCreateRental()

const loading = computed(
  () => !propertiesData.value || !tenantsData.value
)

const properties = computed(() => propertiesData.value?.data ?? [])
const tenants = computed(() => tenantsData.value?.data ?? [])

const propertyOptions = computed(() =>
  (properties.value as PropertyListItem[]).map((p) => ({
    value: p.id,
    label: `${p.code} - ${p.addressLine}`,
  }))
)
const tenantOptions = computed(() =>
  (tenants.value as ClientListItem[]).map((c) => ({
    value: c.id,
    label: c.fullName,
  }))
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
  (properties.value as PropertyListItem[]).find((x) => x.id === form.value.propertyId)
)
const selectedPropertyLabel = computed(() => {
  const p = selectedProperty.value
  return p ? `${p.code} - ${p.addressLine}` : 'Sin seleccionar'
})

// Pre-llenar monto de alquiler (y garantía si hay datos) al elegir propiedad; el usuario puede modificar
watch(
  () => form.value.propertyId,
  (propertyId) => {
    const p = (properties.value as PropertyListItem[]).find((x) => x.id === propertyId)
    if (p && p.monthlyRent != null) form.value.monthlyAmount = p.monthlyRent
  }
)
const selectedTenantLabel = computed(() => {
  const t = (tenants.value as ClientListItem[]).find((x) => x.id === form.value.tenantId)
  return t ? t.fullName : 'Sin seleccionar'
})
const vigenciaLabel = computed(() => {
  if (!form.value.startDate || !form.value.endDate) return 'Sin definir'
  return `${form.value.startDate} - ${form.value.endDate}`
})
const montoLabel = computed(() => {
  const n = Number(form.value.monthlyAmount)
  if (isNaN(n)) return 'S/ 0.00'
  const sym = form.value.currency === 'USD' ? 'US$' : 'S/'
  return `${sym} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
})

const goBack = () => router.push('/alquileres/contratos')
const goToNewTenant = () => {
  router.push({
    name: 'alquileres-clientes-nuevo',
    query: { clientType: 'TENANT', returnTo: '/alquileres/contratos/nuevo' },
  })
}
onMounted(async () => {
  const id = route.query.selectedClientId
  if (typeof id === 'string' && id) {
    await refetchTenants()
    form.value.tenantId = id
  }
})

const setError = (field: string, message: string) => {
  errors.value[field] = message
}
const clearErrors = () => {
  errors.value = {}
}

const toNum = (v: string | number): number | null => {
  if (v === '' || v === undefined) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

const handleSubmit = async () => {
  clearErrors()
  try {
    await schema.validate(form.value, { abortEarly: false })
  } catch (e) {
    if (e instanceof yup.ValidationError) {
      e.inner.forEach((err) => {
        if (err.path) setError(err.path, err.message)
      })
      return
    }
    throw e
  }

  try {
    await createRentalMutation.mutateAsync({
      data: {
        applicationSlug: 'alquileres',
        propertyId: form.value.propertyId,
        tenantId: form.value.tenantId,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        currency: form.value.currency,
        monthlyAmount: toNum(form.value.monthlyAmount) ?? 0,
        securityDeposit: toNum(form.value.securityDeposit),
        paymentDueDay: form.value.paymentDueDay,
        notes: form.value.notes.trim() || null,
        enableAlerts: form.value.enableAlerts,
      },
      files: {
        contractFile: contractFile.value ?? undefined,
        deliveryActFile: deliveryActFile.value ?? undefined,
      },
    })
    await createRentalMutation.invalidateList()
    router.push('/alquileres/contratos')
  } catch {
    void 0
  }
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" color="currentColor" />
      </button>
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Alquiler
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Registrar un nuevo alquiler
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <AppIcon icon="line-md:loading-loop" :size="32" :color="appColor" />
    </div>

    <form v-else @submit.prevent="handleSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <p v-if="errors._form" class="text-sm col-span-full" :style="{ color: 'var(--color-error)' }">
        {{ errors._form }}
      </p>

      <div class="lg:col-span-2 space-y-6">
        <!-- Propiedad -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-2">
            <AppIcon icon="lucide:file-text" :size="20" color="var(--color-primary)" />
            <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Propiedad</h2>
          </div>
          <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
            Selecciona la propiedad a alquilar
          </p>
          <FormSelect
            v-model="form.propertyId"
            label="Seleccionar propiedad"
            placeholder="Seleccionar propiedad"
            :options="propertyOptions"
            :error="errors.propertyId"
            required
          />
        </section>

        <!-- Inquilino -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-2">
            <AppIcon icon="lucide:user" :size="20" color="var(--color-primary)" />
            <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Inquilino</h2>
          </div>
          <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
            Selecciona o registra al Inquilino
          </p>
          <div class="flex flex-wrap items-end gap-3">
            <div class="flex-1 min-w-[200px]">
              <FormSelect
                v-model="form.tenantId"
                label="Seleccionar Inquilino"
                placeholder="Seleccionar Inquilino"
                :options="tenantOptions"
                :error="errors.tenantId"
                required
              />
            </div>
            <BaseButton type="button" variant="outline" class="flex items-center gap-2" @click="goToNewTenant">
              <AppIcon icon="lucide:user-plus" :size="20" color="currentColor" />
              Registrar nuevo Inquilino
            </BaseButton>
          </div>
        </section>

        <!-- Fechas y Condiciones -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-2">
            <AppIcon icon="lucide:calendar" :size="20" color="var(--color-primary)" />
            <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Fechas y Condiciones</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormInput
              v-model="form.startDate"
              type="date"
              label="Fecha de Inicio"
              :error="errors.startDate"
              required
            />
            <FormInput
              v-model="form.endDate"
              type="date"
              label="Fecha de Fin"
              :error="errors.endDate"
              required
            />
            <FormSelect
              v-model="form.currency"
              label="Moneda"
              :options="currencyOptions"
            />
            <FormInput
              v-model="form.monthlyAmount"
              type="number"
              min="0"
              step="0.01"
              label="Monto Mensual"
              placeholder="0.00"
              :error="errors.monthlyAmount"
              required
            />
            <FormInput
              v-model="form.securityDeposit"
              type="number"
              min="0"
              step="0.01"
              label="Depósito de Garantía"
              placeholder="0.00"
            />
            <FormSelect
              v-model="form.paymentDueDay"
              label="Día de Vencimiento de Pago"
              :options="paymentDueDayOptions"
            />
          </div>
        </section>

        <!-- Adjuntos -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">Adjuntos</h2>
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
        </section>

        <!-- Notificaciones -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-1">
            <AppIcon icon="lucide:bell" :size="20" color="var(--color-primary)" />
            <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Alertas y Notificaciones</h2>
          </div>
          <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
            Controla si recibirás alertas para este contrato (vencimientos, pagos)
          </p>
          <div class="flex items-center justify-between p-4 rounded-lg" :style="{ backgroundColor: 'var(--color-surface-elevated)' }">
            <div>
              <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">Recibir alertas para este contrato</p>
              <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
                Según la configuración global de alertas del sistema
              </p>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="form.enableAlerts"
              class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
              :style="{ backgroundColor: form.enableAlerts ? 'var(--color-primary)' : 'var(--color-border)' }"
              @click="form.enableAlerts = !form.enableAlerts"
            >
              <span
                class="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                :style="{ transform: form.enableAlerts ? 'translateX(20px)' : 'translateX(0)' }"
              />
            </button>
          </div>
        </section>

        <!-- Observaciones -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <h2 class="text-base font-semibold mb-2" :style="{ color: 'var(--color-text-primary)' }">Observaciones</h2>
          <FormTextarea
            v-model="form.notes"
            placeholder="Notas adicionales sobre el contrato..."
            :rows="3"
          />
        </section>
      </div>

      <!-- Resumen -->
      <div class="lg:col-span-1">
        <div
          class="p-5 rounded-xl border sticky top-4"
          :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
        >
          <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">
            Resumen del Contrato
          </h2>
          <dl class="space-y-3 text-sm">
            <div>
              <dt class="font-medium" :style="{ color: 'var(--color-text-muted)' }">Propiedad</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ selectedPropertyLabel }}</dd>
            </div>
            <div>
              <dt class="font-medium" :style="{ color: 'var(--color-text-muted)' }">Inquilino</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ selectedTenantLabel }}</dd>
            </div>
            <div>
              <dt class="font-medium" :style="{ color: 'var(--color-text-muted)' }">Vigencia</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ vigenciaLabel }}</dd>
            </div>
            <div>
              <dt class="font-medium" :style="{ color: 'var(--color-text-muted)' }">Monto Mensual</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ montoLabel }}</dd>
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
        </div>
      </div>
    </form>
  </div>
</template>
