<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import * as yup from 'yup'
import { BaseButton, AppIcon } from '@shared/components'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import {
  usePropertyTypes,
  usePropertyDepartments,
  usePropertyProvinces,
  usePropertyDistricts,
  usePropertyOwners,
  useCreateProperty,
} from '../composables/useProperties'
import type { PropertyType, OwnerOption } from '../services/properties.service'

const route = useRoute()
const router = useRouter()

const form = ref({
  code: 'PROP-',
  propertyTypeId: '',
  addressLine: '',
  departmentId: '',
  provinceId: '',
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

const selectedDepartmentId = computed(() => form.value.departmentId || undefined)
const selectedProvinceId = computed(() => form.value.provinceId || undefined)

const { data: propertyTypes, isLoading: loadingTypes } = usePropertyTypes()
const { data: departments, isLoading: loadingDepartments } = usePropertyDepartments()
const { data: provinces, isLoading: loadingProvinces } = usePropertyProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } = usePropertyDistricts(selectedProvinceId)
const { data: owners, isLoading: loadingOwners, refetch: refetchOwners } = usePropertyOwners('alquileres')
const createMutation = useCreateProperty()

const loading = computed(
  () => loadingTypes.value || loadingDepartments.value || loadingOwners.value
)

watch(() => form.value.departmentId, () => {
  form.value.provinceId = ''
  form.value.districtId = ''
})

watch(() => form.value.provinceId, () => {
  form.value.districtId = ''
})

const propertyTypeOptions = computed(() =>
  (propertyTypes.value ?? []).map((p: PropertyType) => ({ value: p.id, label: p.name }))
)
const departmentOptions = computed(() =>
  (departments.value ?? []).map((d) => ({ value: d.id, label: d.name }))
)
const provinceOptions = computed(() =>
  (provinces.value ?? []).map((p) => ({ value: p.id, label: p.name }))
)
const districtOptions = computed(() =>
  (districts.value ?? []).map((d) => ({ value: d.id, label: d.name }))
)
const ownerOptions = computed(() =>
  (owners.value ?? []).map((o: OwnerOption) => ({
    value: o.id,
    label: `${o.fullName} (${o.documentNumber})`,
  }))
)

const selectedOwnerLabel = computed(() => {
  const o = (owners.value ?? []).find((x: OwnerOption) => x.id === form.value.ownerId)
  return o ? o.fullName : '—'
})
const selectedTypeLabel = computed(() => {
  const t = (propertyTypes.value ?? []).find((x: PropertyType) => x.id === form.value.propertyTypeId)
  return t ? t.name : '—'
})

const goBack = () => router.push('/alquileres/propiedades')
const goToNewOwner = () => {
  router.push({
    name: 'alquileres-clientes-nuevo',
    query: { clientType: 'OWNER', returnTo: '/alquileres/propiedades/nueva' },
  })
}

onMounted(async () => {
  const id = route.query.selectedClientId
  if (typeof id === 'string' && id) {
    await refetchOwners()
    form.value.ownerId = id
  }
})

const setError = (field: string, message: string) => { errors.value[field] = message }
const clearErrors = () => { errors.value = {} }

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
      e.inner.forEach((err) => { if (err.path) setError(err.path, err.message) })
      return
    }
    throw e
  }

  try {
    await createMutation.mutateAsync({
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
    })
    await createMutation.invalidateList()
    router.push('/alquileres/propiedades')
  } catch (error) {
    const msg =
      isAxiosError(error) && error.response?.data?.message
        ? String(error.response.data.message)
        : 'Error al guardar la propiedad'
    setError('_form', msg)
  }
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg transition-colors hover:bg-[var(--color-hover)] shrink-0"
        :style="{ color: 'var(--color-text-secondary)' }"
        title="Volver al listado"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <AppIcon icon="lucide:plus-circle" :size="18" color="var(--color-primary)" />
          <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
            Nueva Propiedad
          </h1>
        </div>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Registrar un nuevo inmueble en alquiler
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-3">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
      <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando opciones...</p>
    </div>

    <form v-else class="grid grid-cols-1 xl:grid-cols-3 gap-5" @submit.prevent="handleSubmit">
      <!-- Error global -->
      <div
        v-if="errors._form"
        class="xl:col-span-3 flex items-center gap-3 px-4 py-3 rounded-lg"
        :style="{ backgroundColor: 'var(--color-error)15', border: '1px solid var(--color-error)40', color: 'var(--color-error)' }"
      >
        <AppIcon icon="lucide:alert-circle" :size="18" />
        <span class="text-sm font-medium">{{ errors._form }}</span>
      </div>

      <!-- Columna principal -->
      <div class="xl:col-span-2 space-y-5">

        <!-- Información básica -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
              <AppIcon icon="lucide:building-2" :size="17" color="var(--color-primary)" />
            </div>
            <div>
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Información de la Propiedad</h2>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Datos básicos del inmueble</p>
            </div>
          </div>
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
              v-model="form.departmentId"
              label="Departamento"
              placeholder="Seleccionar departamento"
              :options="departmentOptions"
              :loading="loadingDepartments"
            />
            <FormSelect
              v-model="form.provinceId"
              label="Provincia"
              placeholder="Seleccionar provincia"
              :options="provinceOptions"
              :loading="loadingProvinces"
              :disabled="!form.departmentId"
            />
            <FormSelect
              v-model="form.districtId"
              label="Distrito"
              placeholder="Seleccionar distrito"
              :options="districtOptions"
              :loading="loadingDistricts"
              :disabled="!form.provinceId"
              :error="errors.districtId"
              required
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
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
              <AppIcon icon="lucide:layout-list" :size="17" color="var(--color-primary)" />
            </div>
            <div>
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Características</h2>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Superficie, habitaciones y detalles</p>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-1.5 mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:ruler" :size="13" />
                <span class="text-xs font-medium">Área</span>
              </div>
              <FormInput
                v-model="form.area"
                type="number"
                min="0"
                step="0.01"
                label="Área (m²)"
                placeholder="120"
                :error="errors.area"
              />
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-1.5 mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:bed-double" :size="13" />
                <span class="text-xs font-medium">Dormitorios</span>
              </div>
              <FormInput
                v-model="form.bedrooms"
                type="number"
                min="0"
                label="Habitaciones"
                placeholder="3"
                :error="errors.bedrooms"
              />
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-1.5 mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:bath" :size="13" />
                <span class="text-xs font-medium">Baños</span>
              </div>
              <FormInput
                v-model="form.bathrooms"
                type="number"
                min="0"
                label="Baños"
                placeholder="2"
                :error="errors.bathrooms"
              />
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-1.5 mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:calendar-clock" :size="13" />
                <span class="text-xs font-medium">Antigüedad</span>
              </div>
              <FormInput
                v-model="form.ageYears"
                type="number"
                min="0"
                label="Antigüedad (años)"
                placeholder="5"
                :error="errors.ageYears"
              />
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-1.5 mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:layers" :size="13" />
                <span class="text-xs font-medium">Piso</span>
              </div>
              <FormInput
                v-model="form.floorLevel"
                label="Piso / Nivel"
                placeholder="5to piso"
                :error="errors.floorLevel"
              />
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-1.5 mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:car" :size="13" />
                <span class="text-xs font-medium">Estacionamientos</span>
              </div>
              <FormInput
                v-model="form.parkingSpaces"
                type="number"
                min="0"
                label="Estacionamientos"
                placeholder="1"
                :error="errors.parkingSpaces"
              />
            </div>
          </div>
        </section>

        <!-- Propietario -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
              <AppIcon icon="lucide:briefcase" :size="17" color="var(--color-primary)" />
            </div>
            <div>
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Propietario</h2>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Cliente propietario del inmueble</p>
            </div>
          </div>
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
            <BaseButton type="button" variant="outline" class="flex items-center gap-1.5" @click="goToNewOwner">
              <AppIcon icon="lucide:user-plus" :size="15" />
              Nuevo Propietario
            </BaseButton>
          </div>
          <p v-if="ownerOptions.length === 0" class="text-sm mt-3 flex items-center gap-2" :style="{ color: 'var(--color-text-muted)' }">
            <AppIcon icon="lucide:info" :size="14" />
            No hay propietarios registrados. Registra un cliente tipo «Propietario» desde Clientes.
          </p>
        </section>

        <!-- Números de partida -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
              <AppIcon icon="lucide:hash" :size="17" color="var(--color-primary)" />
            </div>
            <div>
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Números de partida</h2>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Hasta 3 números de partida registral (opcional)</p>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput v-model="form.partida1" label="Partida 1" placeholder="Ej. 12345678" :error="errors.partida1" />
            <FormInput v-model="form.partida2" label="Partida 2" placeholder="Ej. 12345679" :error="errors.partida2" />
            <FormInput v-model="form.partida3" label="Partida 3" placeholder="Ej. 12345680" :error="errors.partida3" />
          </div>
        </section>

        <!-- Información de Alquiler -->
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-primary)1a' }">
              <AppIcon icon="lucide:banknote" :size="17" color="var(--color-primary)" />
            </div>
            <div>
              <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Información de Alquiler</h2>
              <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Montos de referencia y garantía</p>
            </div>
          </div>
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

        <!-- Botones móvil -->
        <div class="xl:hidden flex gap-3">
          <BaseButton
            type="submit"
            variant="primary"
            class="flex-1 flex items-center justify-center gap-2"
            :loading="createMutation.isPending.value"
          >
            <AppIcon icon="lucide:save" :size="16" />
            Guardar Propiedad
          </BaseButton>
          <BaseButton type="button" variant="outline" class="flex items-center gap-2" @click="goBack">
            <AppIcon icon="lucide:x" :size="16" />
            Cancelar
          </BaseButton>
        </div>
      </div>

      <!-- Columna lateral -->
      <div class="xl:col-span-1">
        <div
          class="p-5 rounded-xl border sticky top-4"
          :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
        >
          <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">
            Resumen de la propiedad
          </h2>
          <dl class="space-y-3 text-sm mb-6">
            <div>
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:hash" :size="13" />
                Código
              </dt>
              <dd class="font-semibold" :style="{ color: 'var(--color-text-primary)' }">
                {{ form.code || '—' }}
              </dd>
            </div>
            <div>
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:home" :size="13" />
                Tipo
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ selectedTypeLabel }}</dd>
            </div>
            <div>
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:map-pin" :size="13" />
                Dirección
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ form.addressLine || '—' }}</dd>
            </div>
            <div v-if="form.provinceId || form.departmentId">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:globe" :size="13" />
                Ubicación
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">
                {{ [(provinces?.find(p => p.id === form.provinceId)?.name), (departments?.find(d => d.id === form.departmentId)?.name)].filter(Boolean).join(', ') || '—' }}
              </dd>
            </div>
            <div class="border-t pt-3" :style="{ borderColor: 'var(--color-border)' }">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:briefcase" :size="13" />
                Propietario
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ selectedOwnerLabel }}</dd>
            </div>
            <div v-if="form.monthlyRent !== ''">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:banknote" :size="13" />
                Alquiler mensual
              </dt>
              <dd class="font-bold" :style="{ color: 'var(--color-primary)' }">
                S/ {{ Number(form.monthlyRent).toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}
              </dd>
            </div>
          </dl>

          <!-- Características resumen -->
          <div
            class="grid grid-cols-3 gap-2 mb-6 p-3 rounded-lg"
            :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
          >
            <div class="flex flex-col items-center gap-1 text-center">
              <AppIcon icon="lucide:bed-double" :size="16" color="var(--color-text-muted)" />
              <span class="text-sm font-bold" :style="{ color: 'var(--color-text-primary)' }">
                {{ form.bedrooms !== '' ? form.bedrooms : '—' }}
              </span>
              <span class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Dorm.</span>
            </div>
            <div class="flex flex-col items-center gap-1 text-center">
              <AppIcon icon="lucide:bath" :size="16" color="var(--color-text-muted)" />
              <span class="text-sm font-bold" :style="{ color: 'var(--color-text-primary)' }">
                {{ form.bathrooms !== '' ? form.bathrooms : '—' }}
              </span>
              <span class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Baños</span>
            </div>
            <div class="flex flex-col items-center gap-1 text-center">
              <AppIcon icon="lucide:ruler" :size="16" color="var(--color-text-muted)" />
              <span class="text-sm font-bold" :style="{ color: 'var(--color-text-primary)' }">
                {{ form.area !== '' ? `${form.area}m²` : '—' }}
              </span>
              <span class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Área</span>
            </div>
          </div>

          <div class="hidden xl:flex flex-col gap-3">
            <BaseButton
              type="submit"
              variant="primary"
              class="w-full flex items-center justify-center gap-2"
              :loading="createMutation.isPending.value"
            >
              <AppIcon icon="lucide:save" :size="16" />
              Guardar Propiedad
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
