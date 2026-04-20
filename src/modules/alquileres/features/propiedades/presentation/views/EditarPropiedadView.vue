<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import { BaseButton, AppIcon } from '@shared/components'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import {
  usePropertyById,
  usePropertyTypes,
  usePropertyDepartments,
  usePropertyProvinces,
  usePropertyDistricts,
  usePropertyOwners,
  useUpdateProperty,
} from '../../application/useProperties'
import type { PropertyType, OwnerOption } from '../../domain/property.types'

type PropertyFormValues = {
  code: string
  propertyTypeId: string
  addressLine: string
  departmentId: string
  provinceId: string
  districtId: string
  description: string
  area: string | number
  bedrooms: string | number
  bathrooms: string | number
  ageYears: string | number
  floorLevel: string
  parkingSpaces: string | number
  partida1: string
  partida2: string
  partida3: string
  ownerId: string
  monthlyRent: string | number
  maintenanceAmount: string | number
  depositMonths: string | number
}

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))
const isInitializing = ref(false)

const schema = yup.object({
  code: yup.string().required('El código es requerido').trim(),
  propertyTypeId: yup.string().required('Seleccione el tipo de propiedad'),
  addressLine: yup.string().required('La dirección es requerida').trim(),
  departmentId: yup.string().trim(),
  provinceId: yup.string().trim(),
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

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue, resetForm } = useForm<PropertyFormValues>({
  validationSchema: toTypedSchema(schema) as never,
  initialValues: {
    code: '',
    propertyTypeId: '',
    addressLine: '',
    departmentId: '',
    provinceId: '',
    districtId: '',
    description: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    ageYears: '',
    floorLevel: '',
    parkingSpaces: '',
    partida1: '',
    partida2: '',
    partida3: '',
    ownerId: '',
    monthlyRent: '',
    maintenanceAmount: '',
    depositMonths: '',
  },
})

const codeBinds = defineComponentBinds('code')
const propertyTypeIdBinds = defineComponentBinds('propertyTypeId')
const addressLineBinds = defineComponentBinds('addressLine')
const departmentIdBinds = defineComponentBinds('departmentId')
const provinceIdBinds = defineComponentBinds('provinceId')
const districtIdBinds = defineComponentBinds('districtId')
const descriptionBinds = defineComponentBinds('description')
const areaBinds = defineComponentBinds('area')
const bedroomsBinds = defineComponentBinds('bedrooms')
const bathroomsBinds = defineComponentBinds('bathrooms')
const ageYearsBinds = defineComponentBinds('ageYears')
const floorLevelBinds = defineComponentBinds('floorLevel')
const parkingSpacesBinds = defineComponentBinds('parkingSpaces')
const partida1Binds = defineComponentBinds('partida1')
const partida2Binds = defineComponentBinds('partida2')
const partida3Binds = defineComponentBinds('partida3')
const ownerIdBinds = defineComponentBinds('ownerId')
const monthlyRentBinds = defineComponentBinds('monthlyRent')
const maintenanceAmountBinds = defineComponentBinds('maintenanceAmount')
const depositMonthsBinds = defineComponentBinds('depositMonths')

const selectedDepartmentId = computed(() => values.departmentId || undefined)
const selectedProvinceId = computed(() => values.provinceId || undefined)

const { data: property, isLoading: loadingProperty, isError: propertyError } = usePropertyById(id)
const { data: propertyTypes, isLoading: loadingTypes } = usePropertyTypes()
const { data: departments, isLoading: loadingDepartments } = usePropertyDepartments()
const { data: provinces, isLoading: loadingProvinces } = usePropertyProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } = usePropertyDistricts(selectedProvinceId)
const { data: owners, isLoading: loadingOwners, refetch: refetchOwners } = usePropertyOwners('alquileres')
const updateMutation = useUpdateProperty()

const loading = computed(
  () => loadingProperty.value || loadingTypes.value || loadingDepartments.value || loadingOwners.value
)

watch(
  () => values.departmentId,
  () => {
    if (isInitializing.value) return
    setFieldValue('provinceId', '')
    setFieldValue('districtId', '')
  },
)

watch(
  () => values.provinceId,
  () => {
    if (isInitializing.value) return
    setFieldValue('districtId', '')
  },
)

watch(
  property,
  (p) => {
    if (!p) return
    isInitializing.value = true
    const selectedId = route.query.selectedClientId
    const ownerId = typeof selectedId === 'string' && selectedId ? selectedId : p.ownerId
    resetForm({
      values: {
        code: p.code,
        propertyTypeId: p.propertyTypeId,
        addressLine: p.addressLine,
        departmentId: p.district?.province?.department?.id ?? '',
        provinceId: p.district?.province?.id ?? '',
        districtId: p.districtId,
        description: p.description ?? '',
        area: p.area ?? '',
        bedrooms: p.bedrooms ?? '',
        bathrooms: p.bathrooms ?? '',
        ageYears: p.ageYears ?? '',
        floorLevel: p.floorLevel ?? '',
        parkingSpaces: p.parkingSpaces ?? '',
        partida1: p.partida1 ?? '',
        partida2: p.partida2 ?? '',
        partida3: p.partida3 ?? '',
        ownerId,
        monthlyRent: p.monthlyRent ?? '',
        maintenanceAmount: p.maintenanceAmount ?? '',
        depositMonths: p.depositMonths ?? '',
      },
    })
    setTimeout(() => {
      isInitializing.value = false
    }, 0)
  },
  { immediate: true },
)

onMounted(async () => {
  const selectedId = route.query.selectedClientId
  if (typeof selectedId === 'string' && selectedId) await refetchOwners()
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
  const o = (owners.value ?? []).find((x: OwnerOption) => x.id === values.ownerId)
  return o ? o.fullName : '—'
})
const selectedTypeLabel = computed(() => {
  const t = (propertyTypes.value ?? []).find((x: PropertyType) => x.id === values.propertyTypeId)
  return t ? t.name : '—'
})

const goBack = () => router.push('/alquileres/propiedades')
const goToNewOwner = () => {
  router.push({
    name: 'alquileres-clientes-nuevo',
    query: {
      clientType: 'OWNER',
      returnTo: `/alquileres/propiedades/${route.params.id}/editar`,
    },
  })
}

const toNum = (v: string | number | null | undefined): number | null => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

const onSubmit = handleSubmit(async (formValues: PropertyFormValues) => {
  try {
    await updateMutation.mutateAsync({
      id: id.value,
      data: {
        code: formValues.code.trim(),
        propertyTypeId: formValues.propertyTypeId,
        addressLine: formValues.addressLine.trim(),
        districtId: formValues.districtId,
        description: formValues.description.trim() || null,
        area: toNum(formValues.area),
        bedrooms: toNum(formValues.bedrooms),
        bathrooms: toNum(formValues.bathrooms),
        ageYears: toNum(formValues.ageYears),
        floorLevel: formValues.floorLevel.trim() || null,
        parkingSpaces: toNum(formValues.parkingSpaces),
        partida1: formValues.partida1.trim() || null,
        partida2: formValues.partida2.trim() || null,
        partida3: formValues.partida3.trim() || null,
        ownerId: formValues.ownerId,
        monthlyRent: toNum(formValues.monthlyRent),
        maintenanceAmount: toNum(formValues.maintenanceAmount),
        depositMonths: toNum(formValues.depositMonths),
      },
    })
    await updateMutation.invalidateList()
    router.push('/alquileres/propiedades')
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
        title="Volver al listado"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <AppIcon icon="lucide:pencil" :size="18" color="var(--color-primary)" />
          <h1 class="text-xl font-bold truncate" :style="{ color: 'var(--color-text-primary)' }">
            Editar Propiedad {{ property?.code ? `– ${property.code}` : '' }}
          </h1>
        </div>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Modificar datos del inmueble
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && !property" class="flex flex-col items-center justify-center py-24 gap-3">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
      <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando propiedad...</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="propertyError || (property === undefined && !loadingProperty)"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="text-sm font-medium" :style="{ color: 'var(--color-error)' }">
        No se encontró la propiedad o no tienes acceso.
      </p>
      <BaseButton variant="outline" size="sm" @click="goBack">Volver al listado</BaseButton>
    </div>

    <form v-else class="grid grid-cols-1 xl:grid-cols-3 gap-5" @submit.prevent="onSubmit">
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
              v-bind="codeBinds"
              label="Código de Propiedad"
              placeholder="PROP-001"
              :error="errors.code"
              required
            />
            <FormSelect
              v-bind="propertyTypeIdBinds"
              label="Tipo de Propiedad"
              placeholder="Seleccionar tipo"
              :options="propertyTypeOptions"
              :error="errors.propertyTypeId"
              required
            />
            <FormInput
              v-bind="addressLineBinds"
              class="md:col-span-2"
              label="Dirección Completa"
              placeholder="Av. Principal 123, Dpto 501"
              :error="errors.addressLine"
              required
            />
            <FormSelect
              v-bind="departmentIdBinds"
              label="Departamento"
              placeholder="Seleccionar departamento"
              :options="departmentOptions"
              :loading="loadingDepartments"
            />
            <FormSelect
              v-bind="provinceIdBinds"
              label="Provincia"
              placeholder="Seleccionar provincia"
              :options="provinceOptions"
              :loading="loadingProvinces"
              :disabled="!values.departmentId"
            />
            <FormSelect
              v-bind="districtIdBinds"
              label="Distrito"
              placeholder="Seleccionar distrito"
              :options="districtOptions"
              :loading="loadingDistricts"
              :disabled="!values.provinceId"
              :error="errors.districtId"
              required
            />
          </div>
          <FormTextarea
            v-bind="descriptionBinds"
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
                v-bind="areaBinds"
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
                v-bind="bedroomsBinds"
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
                v-bind="bathroomsBinds"
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
                v-bind="ageYearsBinds"
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
                v-bind="floorLevelBinds"
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
                v-bind="parkingSpacesBinds"
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
                v-bind="ownerIdBinds"
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
            <FormInput v-bind="partida1Binds" label="Partida 1" placeholder="Ej. 12345678" :error="errors.partida1" />
            <FormInput v-bind="partida2Binds" label="Partida 2" placeholder="Ej. 12345679" :error="errors.partida2" />
            <FormInput v-bind="partida3Binds" label="Partida 3" placeholder="Ej. 12345680" :error="errors.partida3" />
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
              v-bind="monthlyRentBinds"
              type="number"
              min="0"
              step="0.01"
              label="Alquiler Mensual (S/)"
              placeholder="2500"
              :error="errors.monthlyRent"
            />
            <FormInput
              v-bind="maintenanceAmountBinds"
              type="number"
              min="0"
              step="0.01"
              label="Mantenimiento (S/)"
              placeholder="200"
              :error="errors.maintenanceAmount"
            />
            <FormInput
              v-bind="depositMonthsBinds"
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
            :loading="updateMutation.isPending.value"
          >
            <AppIcon icon="lucide:save" :size="16" />
            Guardar Cambios
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
                {{ values.code || '—' }}
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
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ values.addressLine || '—' }}</dd>
            </div>
            <div v-if="values.provinceId || values.departmentId">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:globe" :size="13" />
                Ubicación
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">
                {{ [(provinces?.find(p => p.id === values.provinceId)?.name), (departments?.find(d => d.id === values.departmentId)?.name)].filter(Boolean).join(', ') || '—' }}
              </dd>
            </div>
            <div class="border-t pt-3" :style="{ borderColor: 'var(--color-border)' }">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:briefcase" :size="13" />
                Propietario
              </dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ selectedOwnerLabel }}</dd>
            </div>
            <div v-if="values.monthlyRent !== ''">
              <dt class="flex items-center gap-1.5 font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">
                <AppIcon icon="lucide:banknote" :size="13" />
                Alquiler mensual
              </dt>
              <dd class="font-bold" :style="{ color: 'var(--color-primary)' }">
                S/ {{ Number(values.monthlyRent).toLocaleString('es-PE', { minimumFractionDigits: 2 }) }}
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
                {{ values.bedrooms !== '' ? values.bedrooms : '—' }}
              </span>
              <span class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Dorm.</span>
            </div>
            <div class="flex flex-col items-center gap-1 text-center">
              <AppIcon icon="lucide:bath" :size="16" color="var(--color-text-muted)" />
              <span class="text-sm font-bold" :style="{ color: 'var(--color-text-primary)' }">
                {{ values.bathrooms !== '' ? values.bathrooms : '—' }}
              </span>
              <span class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Baños</span>
            </div>
            <div class="flex flex-col items-center gap-1 text-center">
              <AppIcon icon="lucide:ruler" :size="16" color="var(--color-text-muted)" />
              <span class="text-sm font-bold" :style="{ color: 'var(--color-text-primary)' }">
                {{ values.area !== '' ? `${values.area}m²` : '—' }}
              </span>
              <span class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Área</span>
            </div>
          </div>

          <div class="hidden xl:flex flex-col gap-3">
            <BaseButton
              type="submit"
              variant="primary"
              class="w-full flex items-center justify-center gap-2"
              :loading="updateMutation.isPending.value"
            >
              <AppIcon icon="lucide:save" :size="16" />
              Guardar Cambios
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
