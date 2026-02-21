<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import { FormInput, FormSelect, FormTextarea, FileDropzone } from '@shared/components'
import { usePropertiesList } from '../composables/useProperties'
import { useClientsList } from '../composables/useClients'
import { useCreateRental } from '../composables/useRentals'
import type { PropertyListItem } from '../services/properties.service'
import type { ClientListItem } from '../services/clients.service'

const router = useRouter()
const appColor = 'var(--color-primary)'

const listPropertiesParams = ref({
  applicationSlug: 'alquileres' as const,
  page: 1,
  limit: 200,
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
const { data: tenantsData } = useClientsList(listTenantsParams)
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

const selectedPropertyLabel = computed(() => {
  const p = (properties.value as PropertyListItem[]).find((x) => x.id === form.value.propertyId)
  return p ? `${p.code} - ${p.addressLine}` : 'Sin seleccionar'
})
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
const goToNewTenant = () => router.push('/alquileres/clientes/nuevo')

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

  createRentalMutation.mutate(
    {
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
      },
      files: {
        contractFile: contractFile.value ?? undefined,
        deliveryActFile: deliveryActFile.value ?? undefined,
      },
    },
    {
      onSuccess: () => router.push('/alquileres/contratos'),
      onError: (error: Error) => {
        const msg =
          isAxiosError(error) && error.response?.data?.message
            ? String(error.response.data.message)
            : 'Error al guardar el contrato'
        setError('_form', msg)
      },
    }
  )
}
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
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
      <svg
        class="animate-spin h-8 w-8"
        :style="{ color: appColor }"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
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
            <svg class="w-5 h-5" :style="{ color: 'var(--color-primary)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
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
            <svg class="w-5 h-5" :style="{ color: 'var(--color-primary)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
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
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3z" />
              </svg>
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
            <svg class="w-5 h-5" :style="{ color: 'var(--color-primary)' }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
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
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
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
