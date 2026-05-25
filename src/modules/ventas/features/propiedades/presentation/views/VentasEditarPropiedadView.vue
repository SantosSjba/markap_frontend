<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import { BaseButton, AppIcon } from '@shared/components'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import {
  useVentasPropertyById,
  useVentasPropertyTypes,
  useVentasPropertyDepartments,
  useVentasPropertyProvinces,
  useVentasPropertyDistricts,
  useVentasPropertyOwners,
  useVentasUpdateProperty,
} from '../../application/useVentasProperties'
import type {
  VentasPropertyType,
  VentasOwnerOption,
  VentasPropertyDetail,
  VentasPropertyMediaItem,
} from '../../domain/property.types'
import {
  UBIGEO_OTHER_DEPARTMENT_ID,
  UBIGEO_OTHER_PROVINCE_ID,
  UBIGEO_OTHER_DISTRICT_ID,
  mergeDepartmentOptions,
  buildPropertyUbigeoPayload,
  parseLocationFromDescription,
  stripLocationFromDescription,
} from '@modules/alquileres/features/clientes/constants/ubigeo-other'
import { useClientAddressUbigeo } from '@modules/alquileres/features/clientes/composables/useClientAddressUbigeo'

type ListingVentas = 'AVAILABLE' | 'RESERVED' | 'SOLD'

type PropertyFormValues = {
  code: string
  propertyTypeId: string
  addressLine: string
  departmentId: string
  provinceId: string
  districtId: string
  locationCountry: string
  locationDepartment: string
  locationProvince: string
  locationDistrict: string
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
  projectName: string
  salePrice: string | number
  listingStatus: ListingVentas
}

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))
const isInitializing = ref(false)

const schema = yup.object({
  code: yup.string().required('El código es requerido').trim(),
  propertyTypeId: yup.string().required('Seleccione el tipo de propiedad'),
  addressLine: yup.string().required('La dirección es requerida').trim(),
  departmentId: yup.string().required('Seleccione el departamento').trim(),
  provinceId: yup.string().trim(),
  districtId: yup.string().when('departmentId', {
    is: (v: string) => v !== UBIGEO_OTHER_DEPARTMENT_ID,
    then: (s) => s.required('Seleccione el distrito'),
    otherwise: (s) => s.trim(),
  }),
  locationCountry: yup.string().when('departmentId', {
    is: UBIGEO_OTHER_DEPARTMENT_ID,
    then: (s) => s.required('Indique el país').trim(),
    otherwise: (s) => s.trim(),
  }),
  locationDepartment: yup.string().when('departmentId', {
    is: UBIGEO_OTHER_DEPARTMENT_ID,
    then: (s) => s.required('Indique departamento / estado').trim(),
    otherwise: (s) => s.trim(),
  }),
  locationProvince: yup.string().when('departmentId', {
    is: UBIGEO_OTHER_DEPARTMENT_ID,
    then: (s) => s.required('Indique la provincia').trim(),
    otherwise: (s) => s.trim(),
  }),
  locationDistrict: yup.string().when('departmentId', {
    is: UBIGEO_OTHER_DEPARTMENT_ID,
    then: (s) => s.required('Indique el distrito / localidad').trim(),
    otherwise: (s) => s.trim(),
  }),
  description: yup.string().trim(),
  area: yup.number().transform((v) => (v === '' || isNaN(Number(v)) ? undefined : Number(v))).min(0).nullable(),
  bedrooms: yup.number().transform((v) => (v === '' || isNaN(Number(v)) ? undefined : Number(v))).min(0).integer().nullable(),
  bathrooms: yup.number().transform((v) => (v === '' || isNaN(Number(v)) ? undefined : Number(v))).min(0).integer().nullable(),
  ageYears: yup.number().transform((v) => (v === '' || isNaN(Number(v)) ? undefined : Number(v))).min(0).integer().nullable(),
  floorLevel: yup.string().trim(),
  parkingSpaces: yup.number().transform((v) => (v === '' || isNaN(Number(v)) ? undefined : Number(v))).min(0).integer().nullable(),
  partida1: yup.string().trim().max(100),
  partida2: yup.string().trim().max(100),
  partida3: yup.string().trim().max(100),
  ownerId: yup.string().required('Seleccione el propietario'),
  projectName: yup.string().trim().max(200),
  salePrice: yup
    .number()
    .transform((v) => (v === '' || isNaN(Number(v)) ? undefined : Number(v)))
    .required('Indique el precio de venta')
    .min(0),
  listingStatus: yup.mixed<ListingVentas>().oneOf(['AVAILABLE', 'RESERVED', 'SOLD']).required(),
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
    locationCountry: '',
    locationDepartment: '',
    locationProvince: '',
    locationDistrict: '',
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
    projectName: '',
    salePrice: '',
    listingStatus: 'AVAILABLE',
  },
})

const codeBinds = defineComponentBinds('code')
const propertyTypeIdBinds = defineComponentBinds('propertyTypeId')
const addressLineBinds = defineComponentBinds('addressLine')
const departmentIdBinds = defineComponentBinds('departmentId')
const provinceIdBinds = defineComponentBinds('provinceId')
const districtIdBinds = defineComponentBinds('districtId')
const locationCountryBinds = defineComponentBinds('locationCountry')
const locationDepartmentBinds = defineComponentBinds('locationDepartment')
const locationProvinceBinds = defineComponentBinds('locationProvince')
const locationDistrictBinds = defineComponentBinds('locationDistrict')
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
const projectNameBinds = defineComponentBinds('projectName')
const salePriceBinds = defineComponentBinds('salePrice')
const listingStatusBinds = defineComponentBinds('listingStatus')

const selectedDepartmentId = computed(() => values.departmentId || undefined)
const selectedProvinceId = computed(() => values.provinceId || undefined)

const { data: property, isLoading: loadingProperty, isError: propertyError } = useVentasPropertyById(id)
const { data: propertyTypes, isLoading: loadingTypes } = useVentasPropertyTypes()
const { data: departments, isLoading: loadingDepartments } = useVentasPropertyDepartments()
const { data: provinces, isLoading: loadingProvinces } = useVentasPropertyProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } = useVentasPropertyDistricts(selectedProvinceId)
const { data: owners, isLoading: loadingOwners, refetch: refetchOwners } = useVentasPropertyOwners()
const updateMutation = useVentasUpdateProperty()

const { isOtherLocation } = useClientAddressUbigeo({
  values,
  setFieldValue,
  isInitializing,
})

const mediaRows = ref<{ url: string; kind: 'photo' | 'plan' }[]>([{ url: '', kind: 'photo' }])

const loading = computed(
  () => loadingProperty.value || loadingTypes.value || loadingDepartments.value || loadingOwners.value,
)

function normalizeListingStatus(p: VentasPropertyDetail): ListingVentas {
  const s = p.listingStatus
  if (s === 'AVAILABLE' || s === 'RESERVED' || s === 'SOLD') return s
  return 'AVAILABLE'
}

watch(
  property,
  (p) => {
    if (!p) return
    isInitializing.value = true
    const selectedId = route.query.selectedClientId
    const ownerId = typeof selectedId === 'string' && selectedId ? selectedId : p.ownerId
    const isOther = p.districtId === UBIGEO_OTHER_DISTRICT_ID
    const legacyLoc =
      isOther && !p.locationCustom ? parseLocationFromDescription(p.description) : null
    const loc = p.locationCustom ?? legacyLoc
    const m = p.mediaItems
    mediaRows.value =
      m && m.length > 0
        ? m.map((x) => ({ url: x.url, kind: x.kind === 'plan' ? 'plan' : 'photo' }))
        : [{ url: '', kind: 'photo' }]
    resetForm({
      values: {
        code: p.code,
        propertyTypeId: p.propertyTypeId,
        addressLine: p.addressLine,
        departmentId: isOther
          ? UBIGEO_OTHER_DEPARTMENT_ID
          : (p.district?.province?.department?.id ?? ''),
        provinceId: isOther ? UBIGEO_OTHER_PROVINCE_ID : (p.district?.province?.id ?? ''),
        districtId: isOther ? UBIGEO_OTHER_DISTRICT_ID : p.districtId,
        locationCountry: loc?.country ?? '',
        locationDepartment: loc?.department ?? '',
        locationProvince: loc?.province ?? '',
        locationDistrict: loc?.district ?? '',
        description:
          isOther && legacyLoc
            ? stripLocationFromDescription(p.description)
            : (p.description ?? ''),
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
        projectName: p.projectName ?? '',
        salePrice: p.salePrice ?? '',
        listingStatus: normalizeListingStatus(p),
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
  (propertyTypes.value ?? []).map((p: VentasPropertyType) => ({ value: p.id, label: p.name })),
)
const departmentOptions = computed(() => mergeDepartmentOptions(departments.value))
const provinceOptions = computed(() =>
  (provinces.value ?? []).map((p) => ({ value: p.id, label: p.name })),
)
const districtOptions = computed(() =>
  (districts.value ?? []).map((d) => ({ value: d.id, label: d.name })),
)
const ownerOptions = computed(() =>
  (owners.value ?? []).map((o: VentasOwnerOption) => ({
    value: o.id,
    label: `${o.fullName} (${o.documentNumber})`,
  })),
)

const listingStatusOptions = [
  { value: 'AVAILABLE' as const, label: 'Disponible' },
  { value: 'RESERVED' as const, label: 'Separada' },
  { value: 'SOLD' as const, label: 'Vendida' },
]

const selectedOwnerLabel = computed(() => {
  const o = (owners.value ?? []).find((x: VentasOwnerOption) => x.id === values.ownerId)
  return o ? o.fullName : '—'
})
const selectedTypeLabel = computed(() => {
  const t = (propertyTypes.value ?? []).find((x: VentasPropertyType) => x.id === values.propertyTypeId)
  return t ? t.name : '—'
})

const goBack = () => router.push('/ventas/propiedades')
const goToNewOwner = () => {
  router.push({
    name: 'ventas-clientes-nuevo',
    query: {
      clientType: 'OWNER',
      returnTo: `/ventas/propiedades/${route.params.id}/editar`,
    },
  })
}

function addMediaRow() {
  mediaRows.value.push({ url: '', kind: 'photo' })
}
function removeMediaRow(i: number) {
  mediaRows.value.splice(i, 1)
  if (mediaRows.value.length === 0) mediaRows.value.push({ url: '', kind: 'photo' })
}

const toNum = (v: string | number | null | undefined): number | null => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function buildMediaItems(): VentasPropertyMediaItem[] | null {
  const items = mediaRows.value
    .map((r) => ({
      url: r.url.trim(),
      kind: r.kind === 'plan' ? ('plan' as const) : ('photo' as const),
    }))
    .filter((r) => r.url.length > 0)
  return items.length ? items : null
}

const onSubmit = handleSubmit(async (formValues: PropertyFormValues) => {
  try {
    const ubigeo = buildPropertyUbigeoPayload(formValues)
    await updateMutation.mutateAsync({
      id: id.value,
      data: {
        code: formValues.code.trim(),
        propertyTypeId: formValues.propertyTypeId,
        addressLine: formValues.addressLine.trim(),
        districtId: ubigeo.districtId,
        locationCustom: ubigeo.locationCustom,
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
        projectName: formValues.projectName.trim() || null,
        salePrice: toNum(formValues.salePrice),
        listingStatus: formValues.listingStatus,
        mediaItems: buildMediaItems(),
      },
    })
    await updateMutation.invalidateList()
    router.push('/ventas/propiedades')
  } catch {
    void 0
  }
})
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto">
    <div class="flex items-center gap-3 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg transition-colors hover:bg-[var(--color-hover)] shrink-0"
        :style="{ color: 'var(--color-text-secondary)' }"
        title="Volver"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <AppIcon icon="lucide:pencil" :size="18" color="var(--color-primary)" />
          <h1 class="text-xl font-bold truncate" :style="{ color: 'var(--color-text-primary)' }">
            Editar propiedad {{ property?.code ? `– ${property.code}` : '' }}
          </h1>
        </div>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">Ventas</p>
      </div>
    </div>

    <div v-if="loading && !property" class="flex flex-col items-center justify-center py-24 gap-3">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
      <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando...</p>
    </div>

    <div
      v-else-if="propertyError || (property === undefined && !loadingProperty)"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="text-sm font-medium" :style="{ color: 'var(--color-error)' }">
        No se encontró la propiedad.
      </p>
      <BaseButton variant="outline" size="sm" @click="goBack">Volver</BaseButton>
    </div>

    <form v-else class="grid grid-cols-1 xl:grid-cols-3 gap-5" @submit.prevent="onSubmit">
      <div class="xl:col-span-2 space-y-5">
        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">Datos del inmueble</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput v-bind="codeBinds" label="Código" :error="errors.code" required />
            <FormSelect
              v-bind="propertyTypeIdBinds"
              label="Tipo"
              :options="propertyTypeOptions"
              :error="errors.propertyTypeId"
              required
            />
            <FormInput
              v-bind="projectNameBinds"
              label="Proyecto (opcional)"
              class="md:col-span-2"
              :error="errors.projectName"
            />
            <FormInput
              v-bind="addressLineBinds"
              class="md:col-span-2"
              label="Dirección"
              :error="errors.addressLine"
              required
            />
            <FormSelect
              v-bind="departmentIdBinds"
              label="Departamento"
              placeholder="Seleccionar departamento"
              :options="departmentOptions"
              :loading="loadingDepartments"
              :error="errors.departmentId"
              required
            />
            <template v-if="isOtherLocation">
              <FormInput
                v-bind="locationCountryBinds"
                label="País"
                placeholder="Ej. España, Chile, Estados Unidos"
                :error="errors.locationCountry"
                required
              />
              <FormInput
                v-bind="locationDepartmentBinds"
                label="Departamento / Estado"
                placeholder="Ej. Madrid, California"
                :error="errors.locationDepartment"
                required
              />
              <FormInput
                v-bind="locationProvinceBinds"
                label="Provincia"
                placeholder="Ej. Madrid, Los Angeles"
                :error="errors.locationProvince"
                required
              />
              <FormInput
                v-bind="locationDistrictBinds"
                label="Distrito / Localidad"
                placeholder="Ej. Centro, Beverly Hills"
                :error="errors.locationDistrict"
                required
              />
            </template>
            <template v-else>
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
            </template>
            <FormSelect
              v-bind="listingStatusBinds"
              label="Estado comercial"
              :options="listingStatusOptions"
              :error="errors.listingStatus"
              required
            />
            <FormInput
              v-bind="salePriceBinds"
              type="number"
              min="0"
              label="Precio de venta (S/)"
              :error="errors.salePrice"
              required
            />
          </div>
          <FormTextarea v-bind="descriptionBinds" class="mt-4" label="Descripción" :rows="3" />
        </section>

        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <div class="flex items-center gap-2 mb-3">
            <AppIcon icon="lucide:images" :size="18" color="var(--color-primary)" />
            <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">Multimedia</h2>
          </div>
          <div v-for="(row, idx) in mediaRows" :key="idx" class="flex flex-wrap gap-2 mb-3 items-end">
            <div class="flex-1 min-w-[200px]">
              <FormInput v-model="row.url" label="URL" />
            </div>
            <div class="w-36">
              <label class="text-xs mb-1 block" :style="{ color: 'var(--color-text-muted)' }">Tipo</label>
              <select
                v-model="row.kind"
                class="w-full rounded-lg border px-3 py-2 text-sm"
                :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
              >
                <option value="photo">Foto</option>
                <option value="plan">Plano</option>
              </select>
            </div>
            <BaseButton type="button" variant="ghost" @click="removeMediaRow(idx)">
              <AppIcon icon="lucide:trash-2" :size="16" />
            </BaseButton>
          </div>
          <BaseButton type="button" variant="outline" size="sm" class="gap-1" @click="addMediaRow">
            <AppIcon icon="lucide:plus" :size="16" />
            Añadir
          </BaseButton>
        </section>

        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">Características</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormInput v-bind="areaBinds" type="number" min="0" step="0.01" label="Área (m²)" :error="errors.area" />
            <FormInput v-bind="bedroomsBinds" type="number" min="0" label="Dormitorios" :error="errors.bedrooms" />
            <FormInput v-bind="bathroomsBinds" type="number" min="0" label="Baños" :error="errors.bathrooms" />
            <FormInput v-bind="ageYearsBinds" type="number" min="0" label="Antigüedad" :error="errors.ageYears" />
            <FormInput v-bind="floorLevelBinds" label="Piso" :error="errors.floorLevel" />
            <FormInput v-bind="parkingSpacesBinds" type="number" min="0" label="Estacionamientos" :error="errors.parkingSpaces" />
          </div>
        </section>

        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">Propietario</h2>
          <div class="flex flex-wrap gap-3 items-end">
            <div class="flex-1 min-w-[200px]">
              <FormSelect
                v-bind="ownerIdBinds"
                label="Propietario"
                :options="ownerOptions"
                :error="errors.ownerId"
                required
              />
            </div>
            <BaseButton type="button" variant="outline" @click="goToNewOwner">
              <AppIcon icon="lucide:user-plus" :size="15" class="mr-1" />
              Nuevo
            </BaseButton>
          </div>
        </section>

        <section
          class="p-5 rounded-xl"
          :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
        >
          <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">Partidas</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput v-bind="partida1Binds" label="Partida 1" :error="errors.partida1" />
            <FormInput v-bind="partida2Binds" label="Partida 2" :error="errors.partida2" />
            <FormInput v-bind="partida3Binds" label="Partida 3" :error="errors.partida3" />
          </div>
        </section>

        <div class="xl:hidden flex gap-3">
          <BaseButton
            type="submit"
            variant="primary"
            class="flex-1"
            :loading="updateMutation.isPending.value"
          >
            Guardar
          </BaseButton>
          <BaseButton type="button" variant="outline" @click="goBack">Cancelar</BaseButton>
        </div>
      </div>

      <div class="xl:col-span-1">
        <div
          class="p-5 rounded-xl border sticky top-4"
          :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
        >
          <h2 class="text-base font-semibold mb-4" :style="{ color: 'var(--color-text-primary)' }">Resumen</h2>
          <dl class="space-y-2 text-sm">
            <div>
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Código</dt>
              <dd class="font-semibold">{{ values.code || '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Tipo</dt>
              <dd>{{ selectedTypeLabel }}</dd>
            </div>
            <div>
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Propietario</dt>
              <dd>{{ selectedOwnerLabel }}</dd>
            </div>
          </dl>
          <div class="hidden xl:flex flex-col gap-3 mt-6">
            <BaseButton
              type="submit"
              variant="primary"
              class="w-full justify-center"
              :loading="updateMutation.isPending.value"
            >
              Guardar cambios
            </BaseButton>
            <BaseButton type="button" variant="outline" class="w-full justify-center" @click="goBack">
              Cancelar
            </BaseButton>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>
