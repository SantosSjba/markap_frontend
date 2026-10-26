<script setup lang="ts">
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { useService } from '@shared/presentation/di/services'
import { FILE_ACCESS } from '@shared/application/ports/file-access.port'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import {
  useVentasPropertyById,
  useVentasPropertyTypes,
  useVentasPropertyCurrencies,
  useVentasPropertyDepartments,
  useVentasPropertyProvinces,
  useVentasPropertyDistricts,
  useVentasPropertyOwners,
  useVentasUpdateProperty,
  useVentasUploadPropertyMedia,
} from '../composables/useVentasProperties'
import type {
  VentasPropertyType,
  VentasCurrency,
  VentasOwnerOption,
  VentasPropertyDetail,
  VentasPropertyMediaItem,
} from '../../domain/property.types'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { resolveFileDownloadUrl } from '@shared/utils/archivo-url'
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
import { navigateAfterVentasSave } from '../../../../presentation/navigation/navigateAfterVentasSave'
const fileAccess = useService(FILE_ACCESS)

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
  saleCurrency: string
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
  area: yup
    .number()
    .transform((v) => (v === '' || isNaN(Number(v)) ? undefined : Number(v)))
    .min(0)
    .nullable(),
  bedrooms: yup
    .number()
    .transform((v) => (v === '' || isNaN(Number(v)) ? undefined : Number(v)))
    .min(0)
    .integer()
    .nullable(),
  bathrooms: yup
    .number()
    .transform((v) => (v === '' || isNaN(Number(v)) ? undefined : Number(v)))
    .min(0)
    .integer()
    .nullable(),
  ageYears: yup
    .number()
    .transform((v) => (v === '' || isNaN(Number(v)) ? undefined : Number(v)))
    .min(0)
    .integer()
    .nullable(),
  floorLevel: yup.string().trim(),
  parkingSpaces: yup
    .number()
    .transform((v) => (v === '' || isNaN(Number(v)) ? undefined : Number(v)))
    .min(0)
    .integer()
    .nullable(),
  partida1: yup.string().trim().max(100),
  partida2: yup.string().trim().max(100),
  partida3: yup.string().trim().max(100),
  ownerId: yup.string().required('Seleccione el propietario'),
  projectName: yup.string().trim().max(200),
  saleCurrency: yup.string().required('Seleccione la moneda'),
  salePrice: yup
    .number()
    .transform((v) => (v === '' || isNaN(Number(v)) ? undefined : Number(v)))
    .required('Indique el precio de venta')
    .min(0),
  listingStatus: yup.mixed<ListingVentas>().oneOf(['AVAILABLE', 'RESERVED', 'SOLD']).required(),
})

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue, resetForm } =
  useForm<PropertyFormValues>({
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
      saleCurrency: 'PEN',
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
const projectNameBinds = defineComponentBinds('projectName')
const saleCurrencyBinds = defineComponentBinds('saleCurrency')
const salePriceBinds = defineComponentBinds('salePrice')
const listingStatusBinds = defineComponentBinds('listingStatus')

const selectedDepartmentId = computed(() => values.departmentId || undefined)
const selectedProvinceId = computed(() => values.provinceId || undefined)

const {
  data: property,
  isLoading: loadingProperty,
  isError: propertyError,
} = useVentasPropertyById(id)
const { data: propertyTypes, isLoading: loadingTypes } = useVentasPropertyTypes()
const { data: currencies, isLoading: loadingCurrencies } = useVentasPropertyCurrencies()
const { data: departments, isLoading: loadingDepartments } = useVentasPropertyDepartments()
const { data: provinces, isLoading: loadingProvinces } =
  useVentasPropertyProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } =
  useVentasPropertyDistricts(selectedProvinceId)
const { data: owners, isLoading: loadingOwners, refetch: refetchOwners } = useVentasPropertyOwners()
const updateMutation = useVentasUpdateProperty()
const { mutateAsync: uploadMedia, isPending: uploadingMedia } = useVentasUploadPropertyMedia()

const { isOtherLocation } = useClientAddressUbigeo({
  values,
  setFieldValue,
  isInitializing,
})

const mediaItems = ref<VentasPropertyMediaItem[]>([])
const newMediaFile = ref<File | null>(null)
const newMediaKind = ref<'photo' | 'plan'>('photo')
const newMediaError = ref('')
const ownerRows = ref<string[]>([''])

function addOwnerRow() {
  ownerRows.value.push('')
}
function removeOwnerRow(idx: number) {
  ownerRows.value.splice(idx, 1)
  if (!ownerRows.value.length) ownerRows.value = ['']
}

watch(
  () => ownerRows.value[0],
  (id) => {
    if (id && !isInitializing.value) setFieldValue('ownerId', id)
  },
)

const loading = computed(
  () =>
    loadingProperty.value ||
    loadingTypes.value ||
    loadingCurrencies.value ||
    loadingDepartments.value ||
    loadingOwners.value,
)

const currencyOptions = computed(() =>
  (currencies.value ?? []).map((c: VentasCurrency) => ({
    value: c.code,
    label: `${c.name} (${c.symbol})`,
  })),
)

const selectedCurrencySymbol = computed(() => {
  const c = (currencies.value ?? []).find((x) => x.code === values.saleCurrency)
  return c?.symbol ?? values.saleCurrency
})

const salePriceLabel = computed(() => `Precio de venta (${selectedCurrencySymbol.value})`)

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
    const ownerIdsFromProperty =
      p.owners && p.owners.length > 0 ? p.owners.map((o) => o.id) : ownerId ? [ownerId] : ['']
    ownerRows.value = ownerIdsFromProperty.length ? ownerIdsFromProperty : ['']
    const isOther = p.districtId === UBIGEO_OTHER_DISTRICT_ID
    const legacyLoc =
      isOther && !p.locationCustom ? parseLocationFromDescription(p.description) : null
    const loc = p.locationCustom ?? legacyLoc
    const m = p.mediaItems
    mediaItems.value = m && m.length > 0 ? m.map((x) => ({ ...x })) : []
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
        saleCurrency: p.saleCurrency ?? 'PEN',
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
  const t = (propertyTypes.value ?? []).find(
    (x: VentasPropertyType) => x.id === values.propertyTypeId,
  )
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

function removeMediaItem(i: number) {
  mediaItems.value.splice(i, 1)
}

async function onUploadMedia() {
  if (!newMediaFile.value) {
    newMediaError.value = 'Seleccione un archivo'
    return
  }
  newMediaError.value = ''
  const res = await uploadMedia({
    id: id.value,
    file: newMediaFile.value,
    kind: newMediaKind.value,
  })
  mediaItems.value = res.mediaItems ?? [...mediaItems.value, res.mediaItem]
  newMediaFile.value = null
}

async function openMediaItem(item: VentasPropertyMediaItem) {
  try {
    if (item.archivoId) {
      const data = await fileAccess.getDownloadUrl(encodeURIComponent(item.archivoId), {
        applicationSlug: 'ventas',
      })
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
        return
      }
    }
    if (/^https?:\/\//i.test(item.url)) {
      window.open(item.url, '_blank', 'noopener,noreferrer')
      return
    }
    const data = await fileAccess.resolveDownloadUrl(item.url, { applicationSlug: 'ventas' })
    if (data?.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer')
      return
    }
    const legacy = resolveFileDownloadUrl({ filePath: item.url })
    if (legacy !== '#') {
      window.open(legacy, '_blank', 'noopener,noreferrer')
      return
    }
    void markapAlert.toast.error('No hay archivo disponible')
  } catch (e) {
    void markapAlert.toast.error('No se pudo abrir el archivo', getApiErrorMessage(e))
  }
}

const toNum = (v: string | number | null | undefined): number | null => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function buildMediaItems(): VentasPropertyMediaItem[] | null {
  return mediaItems.value.length ? mediaItems.value : null
}

const onSubmit = handleSubmit(async (formValues: PropertyFormValues) => {
  try {
    const ownerClientIds = Array.from(new Set(ownerRows.value.filter(Boolean)))
    if (!ownerClientIds.length) return
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
        ownerId: ownerClientIds[0]!,
        ownerClientIds,
        projectName: formValues.projectName.trim() || null,
        salePrice: toNum(formValues.salePrice),
        saleCurrency: formValues.saleCurrency,
        listingStatus: formValues.listingStatus,
        mediaItems: buildMediaItems(),
      },
    })
    await navigateAfterVentasSave(router, {
      listPath: '/ventas/propiedades',
      invalidate: () => updateMutation.invalidateList(),
    })
  } catch {
    void 0
  }
})
</script>

<template>
  <div >
    <PageHeader
      :title="'Editar propiedad ' + (property?.code ? `– ${property.code}` : '')"
      subtitle="Ventas"
      back
      @back="goBack"
      class="mb-6"
    />

    <LoadingState v-if="loading && !property" text="Cargando..." class="py-24" />

    <div
      v-else-if="propertyError || (property === undefined && !loadingProperty)"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="text-sm font-medium text-error-500 dark:text-error-400">
        No se encontró la propiedad.
      </p>
      <BaseButton variant="outline" size="sm" icon="lucide:arrow-left" @click="goBack">Volver</BaseButton>
    </div>

    <form v-else class="grid grid-cols-1 xl:grid-cols-3 gap-5" @submit.prevent="onSubmit">
      <div class="xl:col-span-2 space-y-5">
        <FormSectionCard
          title="Datos del inmueble"
          subtitle="Código, tipo y ubicación"
          icon="lucide:building-2"
        >
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
            <FormSelect
              v-bind="saleCurrencyBinds"
              label="Moneda"
              placeholder="Seleccionar moneda"
              :options="currencyOptions"
              :loading="loadingCurrencies"
              :error="errors.saleCurrency"
              required
            />
            <FormInput
              v-bind="salePriceBinds"
              type="number"
              min="0"
              :label="salePriceLabel"
              :error="errors.salePrice"
              required
            />
          </div>
          <FormTextarea v-bind="descriptionBinds" class="mt-4" label="Descripción" :rows="3" />
        </FormSectionCard>

        <FormSectionCard
          title="Multimedia"
          subtitle="Fotos y planos del inmueble (MinIO)"
          icon="lucide:images"
        >
          <ul v-if="mediaItems.length" class="space-y-2 mb-4 text-sm">
            <li
              v-for="(item, idx) in mediaItems"
              :key="`${item.url}-${idx}`"
              class="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 border-gray-200 dark:border-gray-800"
            >
              <span>{{ item.kind === 'plan' ? 'Plano' : 'Foto' }} · {{ item.url.split('/').pop() }}</span>
              <div class="flex gap-2">
                <BaseButton type="button" variant="outline" size="sm" @click="openMediaItem(item)">
                  Ver
                </BaseButton>
                <BaseButton type="button" variant="ghost" size="sm" @click="removeMediaItem(idx)">
                  <AppIcon icon="lucide:trash-2" :size="16" />
                </BaseButton>
              </div>
            </li>
          </ul>
          <p v-else class="text-sm mb-3 opacity-70">Sin archivos multimedia.</p>
          <div class="flex flex-wrap gap-2 items-end mb-2">
            <div class="w-36">
              <FormSelect
                v-model="newMediaKind"
                :options="[{ value: 'photo', label: 'Foto' }, { value: 'plan', label: 'Plano' }]"
                label="Tipo"
              />
            </div>
          </div>
          <FileDropzone
            v-model="newMediaFile"
            label="Nuevo archivo"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            :max-size="25 * 1024 * 1024"
            :multiple="false"
            :error="newMediaError"
            @error="(m: string) => (newMediaError = m)"
          />
          <BaseButton
            type="button"
            variant="secondary"
            size="sm"
            class="mt-3 gap-1"
            :loading="uploadingMedia"
            @click="onUploadMedia"
          >
            <AppIcon icon="lucide:upload" :size="16" />
            Subir ahora
          </BaseButton>
        </FormSectionCard>

        <FormSectionCard
          title="Características"
          subtitle="Superficie, habitaciones y detalles"
          icon="lucide:list-checks"
        >
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FormInput v-bind="areaBinds" type="number" min="0" step="0.01" label="Área (m²)" :error="errors.area" />
            <FormInput v-bind="bedroomsBinds" type="number" min="0" label="Dormitorios" :error="errors.bedrooms" />
            <FormInput v-bind="bathroomsBinds" type="number" min="0" label="Baños" :error="errors.bathrooms" />
            <FormInput v-bind="ageYearsBinds" type="number" min="0" label="Antigüedad" :error="errors.ageYears" />
            <FormInput v-bind="floorLevelBinds" label="Piso" :error="errors.floorLevel" />
            <FormInput v-bind="parkingSpacesBinds" type="number" min="0" label="Estacionamientos" :error="errors.parkingSpaces" />
          </div>
        </FormSectionCard>

        <FormSectionCard
          title="Propietarios"
          subtitle="Copropietarios del inmueble"
          icon="lucide:user-check"
        >
          <div class="flex flex-wrap justify-end gap-2 mb-4">
            <BaseButton type="button" variant="outline" size="sm" icon="lucide:plus" @click="addOwnerRow">
              Agregar propietario
            </BaseButton>
            <BaseButton type="button" variant="outline" size="sm" icon="lucide:user-plus" @click="goToNewOwner">
              Nuevo
            </BaseButton>
          </div>
          <div
            v-for="(_, idx) in ownerRows"
            :key="`owner-row-${idx}`"
            class="flex gap-2 items-end mb-3"
          >
            <div class="flex-1">
              <FormSelect
                v-model="ownerRows[idx]"
                :label="idx === 0 ? 'Propietario principal' : `Propietario ${idx + 1}`"
                :options="ownerOptions"
                :error="idx === 0 ? errors.ownerId : undefined"
                required
              />
            </div>
            <BaseButton
              v-if="ownerRows.length > 1"
              type="button"
              variant="ghost"
              size="sm"
              icon="lucide:trash-2"
              @click="removeOwnerRow(idx)"
            >
              Quitar
            </BaseButton>
          </div>
        </FormSectionCard>

        <FormSectionCard
          title="Partidas"
          subtitle="Números de partida registral (opcional)"
          icon="lucide:hash"
        >
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput v-bind="partida1Binds" label="Partida 1" :error="errors.partida1" />
            <FormInput v-bind="partida2Binds" label="Partida 2" :error="errors.partida2" />
            <FormInput v-bind="partida3Binds" label="Partida 3" :error="errors.partida3" />
          </div>
        </FormSectionCard>

        <div class="xl:hidden flex gap-3">
          <BaseButton
            type="submit"
            variant="primary"
            icon="lucide:save"
            class="flex-1"
            :loading="updateMutation.isPending.value"
          >
            Guardar
          </BaseButton>
          <BaseButton type="button" variant="outline" icon="lucide:x" @click="goBack">Cancelar</BaseButton>
        </div>
      </div>

      <div class="xl:col-span-1">
        <FormSectionCard
          title="Resumen"
          dense
        >
          <dl class="space-y-2 text-sm">
            <div>
              <dt class="text-xs text-gray-400 dark:text-gray-500">Código</dt>
              <dd class="font-semibold">{{ values.code || '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400 dark:text-gray-500">Tipo</dt>
              <dd>{{ selectedTypeLabel }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400 dark:text-gray-500">Propietario</dt>
              <dd>{{ selectedOwnerLabel }}</dd>
            </div>
          </dl>
          <div class="hidden xl:flex flex-col gap-3 mt-6">
            <BaseButton
              type="submit"
              variant="primary"
              icon="lucide:save"
              class="w-full justify-center"
              :loading="updateMutation.isPending.value"
            >
              Guardar cambios
            </BaseButton>
            <BaseButton type="button" variant="outline" icon="lucide:x" class="w-full justify-center" @click="goBack">
              Cancelar
            </BaseButton>
          </div>
        </FormSectionCard>
      </div>
    </form>
  </div>
</template>
