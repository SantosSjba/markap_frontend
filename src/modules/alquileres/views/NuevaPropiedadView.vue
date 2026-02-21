<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import {
  usePropertyTypes,
  usePropertyDistricts,
  usePropertyOwners,
  useCreateProperty,
} from '../composables/useProperties'
import type { PropertyType, District, OwnerOption } from '../services/properties.service'

const router = useRouter()
const appColor = 'var(--color-primary)'

const form = ref({
  code: 'PROP-',
  propertyTypeId: '',
  addressLine: '',
  districtId: '',
  description: '',
  area: '' as string | number,
  bedrooms: '' as string | number,
  bathrooms: '' as string | number,
  ageYears: '' as string | number,
  floorLevel: '',
  parkingSpaces: '' as string | number,
  partida1: '',
  partida2: '',
  partida3: '',
  ownerId: '',
  monthlyRent: '' as string | number,
  maintenanceAmount: '' as string | number,
  depositMonths: '' as string | number,
})

const errors = ref<Record<string, string>>({})

const schema = yup.object({
  code: yup.string().required('El código es requerido').trim(),
  propertyTypeId: yup.string().required('Seleccione el tipo de propiedad'),
  addressLine: yup.string().required('La dirección es requerida').trim(),
  districtId: yup.string().required('Seleccione el distrito'),
  description: yup.string().trim(),
  area: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).nullable(),
  bedrooms: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).integer().nullable(),
  bathrooms: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).integer().nullable(),
  ageYears: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).integer().nullable(),
  floorLevel: yup.string().trim(),
  parkingSpaces: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).integer().nullable(),
  partida1: yup.string().trim().max(100),
  partida2: yup.string().trim().max(100),
  partida3: yup.string().trim().max(100),
  ownerId: yup.string().required('Seleccione el propietario'),
  monthlyRent: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).nullable(),
  maintenanceAmount: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).nullable(),
  depositMonths: yup.number().transform((v) => (v === '' || isNaN(v) ? undefined : v)).min(0).integer().nullable(),
})

const { data: propertyTypes, isLoading: loadingTypes } = usePropertyTypes()
const { data: districts, isLoading: loadingDistricts } = usePropertyDistricts()
const { data: owners, isLoading: loadingOwners } = usePropertyOwners('alquileres')
const createMutation = useCreateProperty()

const loading = computed(
  () => loadingTypes.value || loadingDistricts.value || loadingOwners.value
)

const selectedDistrict = computed(() =>
  (districts.value ?? []).find((d: District) => d.id === form.value.districtId)
)
const provinceName = computed(() => selectedDistrict.value?.province?.name ?? '')
const departmentName = computed(
  () => selectedDistrict.value?.province?.department?.name ?? ''
)

const propertyTypeOptions = computed(() =>
  (propertyTypes.value ?? []).map((p: PropertyType) => ({
    value: p.id,
    label: p.name,
  }))
)
const districtOptions = computed(() =>
  (districts.value ?? []).map((d: District) => ({ value: d.id, label: d.name }))
)
const ownerOptions = computed(() =>
  (owners.value ?? []).map((o: OwnerOption) => ({
    value: o.id,
    label: `${o.fullName} (${o.documentNumber})`,
  }))
)

const goBack = () => router.push('/alquileres/propiedades')
const goToNewOwner = () => router.push('/alquileres/clientes/nuevo')

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

  createMutation.mutate(
    {
      applicationSlug: 'alquileres',
      code: form.value.code.trim(),
      propertyTypeId: form.value.propertyTypeId,
      addressLine: form.value.addressLine.trim(),
      districtId: form.value.districtId,
      description: form.value.description.trim() || null,
      area: toNum(form.value.area),
      bedrooms: toNum(form.value.bedrooms),
      bathrooms: toNum(form.value.bathrooms),
      ageYears: toNum(form.value.ageYears),
      floorLevel: form.value.floorLevel.trim() || null,
      parkingSpaces: toNum(form.value.parkingSpaces),
      partida1: form.value.partida1.trim() || null,
      partida2: form.value.partida2.trim() || null,
      partida3: form.value.partida3.trim() || null,
      ownerId: form.value.ownerId,
      monthlyRent: toNum(form.value.monthlyRent),
      maintenanceAmount: toNum(form.value.maintenanceAmount),
      depositMonths: toNum(form.value.depositMonths),
    },
    {
      onSuccess: () => router.push('/alquileres/propiedades'),
      onError: (error: Error) => {
        const msg =
          isAxiosError(error) && error.response?.data?.message
            ? String(error.response.data.message)
            : 'Error al guardar la propiedad'
        setError('_form', msg)
      },
    }
  )
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
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
          Nueva Propiedad
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Registrar un nuevo inmueble en alquiler
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

    <form v-else @submit.prevent="handleSubmit" class="space-y-8">
      <p v-if="errors._form" class="text-sm" :style="{ color: 'var(--color-error)' }">
        {{ errors._form }}
      </p>

      <!-- Información de la Propiedad -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Información de la Propiedad
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Datos básicos del inmueble
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-model="form.code"
            label="Código de Propiedad"
            placeholder="PROP-001"
            :error="errors.code"
            required
          />
          <FormSelect
            v-model="form.propertyTypeId"
            label="Tipo de Propiedad"
            placeholder="Seleccionar tipo"
            :options="propertyTypeOptions"
            :error="errors.propertyTypeId"
            required
          />
          <FormInput
            v-model="form.addressLine"
            class="md:col-span-2"
            label="Dirección Completa"
            placeholder="Av. Principal 123, Dpto 501"
            :error="errors.addressLine"
            required
          />
          <FormSelect
            v-model="form.districtId"
            label="Distrito"
            placeholder="Seleccionar distrito"
            :options="districtOptions"
            :error="errors.districtId"
            required
          />
          <FormInput
            :model-value="provinceName"
            label="Provincia"
            placeholder="Lima"
            disabled
          />
          <FormInput
            :model-value="departmentName"
            label="Departamento"
            placeholder="Lima"
            disabled
          />
        </div>
        <FormTextarea
          v-model="form.description"
          class="mt-4"
          label="Descripción"
          placeholder="Descripción detallada de la propiedad..."
          :rows="3"
        />
      </section>

      <!-- Características -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Características
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Superficie, habitaciones y detalles
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormInput
            v-model="form.area"
            type="number"
            min="0"
            step="0.01"
            label="Área (m²)"
            placeholder="120"
            :error="errors.area"
          />
          <FormInput
            v-model="form.bedrooms"
            type="number"
            min="0"
            label="Habitaciones"
            placeholder="3"
            :error="errors.bedrooms"
          />
          <FormInput
            v-model="form.bathrooms"
            type="number"
            min="0"
            label="Baños"
            placeholder="2"
            :error="errors.bathrooms"
          />
          <FormInput
            v-model="form.ageYears"
            type="number"
            min="0"
            label="Antigüedad (años)"
            placeholder="5"
            :error="errors.ageYears"
          />
          <FormInput
            v-model="form.floorLevel"
            label="Piso / Nivel"
            placeholder="5to piso"
            :error="errors.floorLevel"
          />
          <FormInput
            v-model="form.parkingSpaces"
            type="number"
            min="0"
            label="Estacionamientos"
            placeholder="1"
            :error="errors.parkingSpaces"
          />
        </div>
      </section>

      <!-- Números de partida (máx. 3) -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Números de partida
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Hasta 3 números de partida por propiedad (opcional)
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            v-model="form.partida1"
            label="Número de partida 1"
            placeholder="Ej. 12345678"
            :error="errors.partida1"
          />
          <FormInput
            v-model="form.partida2"
            label="Número de partida 2"
            placeholder="Ej. 12345679"
            :error="errors.partida2"
          />
          <FormInput
            v-model="form.partida3"
            label="Número de partida 3"
            placeholder="Ej. 12345680"
            :error="errors.partida3"
          />
        </div>
      </section>

      <!-- Propietario -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Propietario
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Cliente propietario del inmueble
        </p>
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex-1 min-w-[200px]">
            <FormSelect
              v-model="form.ownerId"
              label="Seleccionar Propietario (Cliente)"
              placeholder="Buscar o seleccionar propietario"
              :options="ownerOptions"
              :error="errors.ownerId"
              required
            />
          </div>
          <BaseButton
            type="button"
            variant="outline"
            @click="goToNewOwner"
          >
            Nuevo Propietario
          </BaseButton>
        </div>
        <p v-if="ownerOptions.length === 0" class="text-sm mt-2" :style="{ color: 'var(--color-text-muted)' }">
          No hay propietarios registrados. Registra un cliente tipo «Propietario» desde Clientes.
        </p>
      </section>

      <!-- Información de Alquiler -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Información de Alquiler
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Montos y garantía
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            v-model="form.monthlyRent"
            type="number"
            min="0"
            step="0.01"
            label="Alquiler Mensual (S/)"
            placeholder="2500"
            :error="errors.monthlyRent"
          />
          <FormInput
            v-model="form.maintenanceAmount"
            type="number"
            min="0"
            step="0.01"
            label="Mantenimiento (S/)"
            placeholder="200"
            :error="errors.maintenanceAmount"
          />
          <FormInput
            v-model="form.depositMonths"
            type="number"
            min="0"
            label="Garantía (meses)"
            placeholder="2"
            :error="errors.depositMonths"
          />
        </div>
      </section>

      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="goBack">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" :loading="createMutation.isPending.value" variant="primary">
          <svg v-if="!createMutation.isPending.value" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Guardar Propiedad
        </BaseButton>
      </div>
    </form>
  </div>
</template>
