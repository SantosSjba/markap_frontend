<script setup lang="ts">
import { useCurrencyCatalog } from '@shared/presentation/composables/useCurrencyCatalog'
import { computed, ref, watch } from 'vue'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { fieldLabelClass } from '@shared/presentation/components/forms/field-classes'
import { formatFormArea, formatFormStat } from '@shared/utils/format-form-stat'
import {
  useVentasPropertyTypes,
  useVentasPropertyDepartments,
  useVentasPropertyProvinces,
  useVentasPropertyDistricts,
  useVentasPropertyOwners,
} from '../composables/useVentasProperties'
import {
  UBIGEO_OTHER_DEPARTMENT_ID,
  UBIGEO_OTHER_DEPARTMENT_LABEL,
  UBIGEO_OTHER_DISTRICT_ID,
  UBIGEO_OTHER_PROVINCE_ID,
  mergeDepartmentOptions,
  buildPropertyUbigeoPayload,
  parseLocationFromDescription,
  stripLocationFromDescription,
} from '@shared/domain/ubigeo-other'
import { useClientAddressUbigeo } from '@shared/presentation/composables/useClientAddressUbigeo'
import { buildPropertyCode, suggestOwnerSurname } from '@modules/alquileres/features/propiedades/domain/property-code'
import PropertyOwnersSection from '@modules/alquileres/features/propiedades/presentation/components/PropertyOwnersSection.vue'
import VentasClienteFormModal from '../../../clientes/presentation/components/VentasClienteFormModal.vue'
import {
  VENTAS_LISTING_STATUS_OPTIONS,
  listingStatusLabel,
  listingStatusVariant,
  type VentasListingStatus,
} from '../../domain/listing-status'
import type { VentasCreatePropertyPayload, VentasPropertyDetail } from '../../domain/property.types'
/**
 * VentasPropiedadForm — formulario único de alta/edición de propiedades de Ventas,
 * con la misma estructura y nomenclatura que el de Alquileres: el código se arma con el tipo,
 * el distrito y el apellido del propietario principal (`property-code.ts`); al editar se conserva
 * y solo cambia si el usuario lo regenera. La multimedia la aporta cada vista en el slot `media`.
 */

interface Props {
  /** Propiedad a editar; sin ella, el formulario arranca vacío (alta) */
  initial?: VentasPropertyDetail | null
  /** Propietario a dejar seleccionado al abrir (ej. recién creado desde otra pantalla) */
  preselectedOwnerId?: string
  submitLabel: string
  submitting?: boolean
  canWrite?: boolean
  /** `modal`: una columna sin resumen ni botones propios; el modal los pone en su pie */
  variant?: 'page' | 'modal'
  /** id del `<form>`, para enviarlo desde un botón externo (pie del modal) */
  formId?: string
}

const props = withDefaults(defineProps<Props>(), {
  initial: null,
  preselectedOwnerId: undefined,
  submitting: false,
  canWrite: true,
  variant: 'page',
  formId: undefined,
})

const isModal = computed(() => props.variant === 'modal')

const emit = defineEmits<{
  submit: [payload: Omit<VentasCreatePropertyPayload, 'mediaItems'>]
  cancel: []
}>()

type PropertyFormValues = {
  code: string
  propertyTypeId: string
  projectName: string
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
  listingStatus: VentasListingStatus
  saleCurrency: string
  salePrice: string | number
}

const optionalNumber = () =>
  yup
    .number()
    .transform((v) => (v === '' || isNaN(v) ? undefined : v))
    .min(0, 'No puede ser negativo')
    .nullable()
const optionalInteger = () => optionalNumber().integer('Debe ser un número entero')

const schema = yup.object({
  code: yup.string().required('El código es requerido').trim().max(120),
  propertyTypeId: yup.string().required('Seleccione el tipo de propiedad'),
  projectName: yup.string().trim().max(200),
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
  area: optionalNumber(),
  bedrooms: optionalInteger(),
  bathrooms: optionalInteger(),
  ageYears: optionalInteger(),
  floorLevel: yup.string().trim(),
  parkingSpaces: optionalInteger(),
  partida1: yup.string().trim().max(100),
  partida2: yup.string().trim().max(100),
  partida3: yup.string().trim().max(100),
  ownerId: yup.string().required('Seleccione el propietario principal'),
  listingStatus: yup.string().required('Seleccione el estado comercial'),
  saleCurrency: yup.string().required('Seleccione la moneda'),
  salePrice: yup
    .number()
    .transform((v) => (v === '' || isNaN(v) ? undefined : v))
    .required('Indique el precio de venta')
    .min(0, 'No puede ser negativo'),
})

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue, resetForm, submitCount } =
  useForm<PropertyFormValues>({
    // yup output types (number | null) no coinciden con valores de input en UI (string | number); el esquema sigue validando en runtime
    validationSchema: toTypedSchema(schema) as never,
    initialValues: {
      code: '',
      propertyTypeId: '',
      projectName: '',
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
      listingStatus: 'AVAILABLE',
      saleCurrency: 'PEN',
      salePrice: '',
    },
  })

const propertyTypeIdBinds = defineComponentBinds('propertyTypeId')
const projectNameBinds = defineComponentBinds('projectName')
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
const listingStatusBinds = defineComponentBinds('listingStatus')
const saleCurrencyBinds = defineComponentBinds('saleCurrency')
const salePriceBinds = defineComponentBinds('salePrice')

const isInitializing = ref(false)
const ownerRows = ref<string[]>([props.preselectedOwnerId ?? ''])

// El propietario principal (fila 0) alimenta la validación de `ownerId`
watch(
  () => ownerRows.value[0],
  (id) => {
    // Sin validar hasta el primer intento de guardar: evita errores antes de que el usuario elija
    if (!isInitializing.value) setFieldValue('ownerId', id ?? '', submitCount.value > 0)
  },
  { immediate: true },
)

const selectedDepartmentId = computed(() => values.departmentId || undefined)
const selectedProvinceId = computed(() => values.provinceId || undefined)

const { data: propertyTypes, isLoading: loadingTypes } = useVentasPropertyTypes()
const { currencies, options: currencyOptions, isLoading: loadingCurrencies } = useCurrencyCatalog()
const { data: departments, isLoading: loadingDepartments } = useVentasPropertyDepartments()
const { data: provinces, isLoading: loadingProvinces } = useVentasPropertyProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } = useVentasPropertyDistricts(selectedProvinceId)
const { data: owners, isLoading: loadingOwners } = useVentasPropertyOwners()

const { isOtherLocation } = useClientAddressUbigeo({ values, setFieldValue, isInitializing })

const loading = computed(
  () => loadingTypes.value || loadingDepartments.value || loadingOwners.value || loadingCurrencies.value,
)

const propertyTypeOptions = computed(() =>
  (propertyTypes.value ?? []).map((p) => ({ value: p.id, label: p.name })),
)
const departmentOptions = computed(() => mergeDepartmentOptions(departments.value))
const provinceOptions = computed(() => (provinces.value ?? []).map((p) => ({ value: p.id, label: p.name })))
const districtOptions = computed(() => (districts.value ?? []).map((d) => ({ value: d.id, label: d.name })))
/** Símbolo de la moneda elegida para etiquetas y resumen (ej. S/, US$) */
const currencySymbol = computed(
  () => (currencies.value ?? []).find((c) => c.code === values.saleCurrency)?.symbol ?? values.saleCurrency,
)

// Los propietarios ya asignados se muestran aunque hoy no figuren en el combo
const ownerOptions = computed(() => {
  const list = (owners.value ?? []).map((o) => ({
    value: o.id,
    label: `${o.fullName} (${o.documentNumber})`,
  }))
  const missing = (props.initial?.owners ?? [])
    .filter((o) => !list.some((x) => x.value === o.id))
    .map((o) => ({ value: o.id, label: `${o.fullName} (${o.documentNumber})` }))
  return [...list, ...missing]
})

// ── Resumen lateral ──
const ownerName = (id: string) =>
  (owners.value ?? []).find((x) => x.id === id)?.fullName ??
  props.initial?.owners?.find((x) => x.id === id)?.fullName
const selectedOwnerLabel = computed(() => {
  const names = ownerRows.value.filter(Boolean).map(ownerName).filter(Boolean)
  return names.length ? names.join(', ') : '—'
})
const selectedTypeLabel = computed(
  () => (propertyTypes.value ?? []).find((x) => x.id === values.propertyTypeId)?.name ?? '—',
)
const locationSummary = computed(() => {
  if (isOtherLocation.value) {
    const parts = [
      values.locationCountry,
      values.locationDepartment,
      values.locationProvince,
      values.locationDistrict,
    ].filter(Boolean)
    return parts.length ? parts.join(', ') : UBIGEO_OTHER_DEPARTMENT_LABEL
  }
  const prov = (provinces.value ?? []).find((p) => p.id === values.provinceId)?.name
  const dist = (districts.value ?? []).find((d) => d.id === values.districtId)?.name
  const dep = (departments.value ?? []).find((d) => d.id === values.departmentId)?.name
  return [dist, prov, dep].filter(Boolean).join(', ') || '—'
})
const salePricePreview = computed(() => {
  if (values.salePrice === '' || values.salePrice == null) return null
  const n = Number(values.salePrice)
  return Number.isFinite(n) ? n : null
})
/** Precio por m² cuando hay precio y área */
const pricePerM2 = computed(() => {
  const area = Number(values.area)
  if (salePricePreview.value === null || !area) return null
  return salePricePreview.value / area
})

// ── Código descriptivo (misma nomenclatura que Alquileres) ──
const isEditing = computed(() => !!props.initial)
const districtName = computed(() => (districts.value ?? []).find((d) => d.id === values.districtId)?.name ?? '')
/** Propietario principal: del combo, o de la propiedad si ya no figura en él */
const primaryOwner = computed(() => {
  const id = ownerRows.value[0]
  if (!id) return null
  return (owners.value ?? []).find((o) => o.id === id) ?? props.initial?.owners?.find((o) => o.id === id) ?? null
})
/** Código con los datos del formulario: tipo + distrito + apellido del propietario principal */
const autoCode = computed(() =>
  buildPropertyCode({
    typeName: (propertyTypes.value ?? []).find((t) => t.id === values.propertyTypeId)?.name,
    location: isOtherLocation.value ? values.locationDistrict : districtName.value,
    ownerSurname: primaryOwner.value
      ? suggestOwnerSurname(primaryOwner.value.fullName, primaryOwner.value.documentNumber)
      : '',
  }),
)
// Alta: el código sigue a los datos. Edición: se conserva hasta pulsar «Regenerar».
watch(
  autoCode,
  (code) => {
    if (!isEditing.value && !isInitializing.value) setFieldValue('code', code, submitCount.value > 0)
  },
  { immediate: true },
)
const canRegenerateCode = computed(() => isEditing.value && autoCode.value !== values.code)
function regenerateCode() {
  setFieldValue('code', autoCode.value)
}

// ── Edición: cargar valores ──
watch(
  () => props.initial,
  (p) => {
    if (!p) return
    isInitializing.value = true
    const ownerIds = p.owners?.length ? p.owners.map((o) => o.id) : p.ownerId ? [p.ownerId] : ['']
    ownerRows.value = ownerIds
    const isOther = p.districtId === UBIGEO_OTHER_DISTRICT_ID
    // Datos antiguos guardaban la ubicación extranjera dentro de la descripción
    const legacyLoc = isOther && !p.locationCustom ? parseLocationFromDescription(p.description) : null
    const loc = p.locationCustom ?? legacyLoc
    const status = VENTAS_LISTING_STATUS_OPTIONS.some((o) => o.value === p.listingStatus)
      ? (p.listingStatus as VentasListingStatus)
      : 'AVAILABLE'
    resetForm({
      values: {
        code: p.code,
        propertyTypeId: p.propertyTypeId,
        projectName: p.projectName ?? '',
        addressLine: p.addressLine,
        departmentId: isOther ? UBIGEO_OTHER_DEPARTMENT_ID : (p.district?.province?.department?.id ?? ''),
        provinceId: isOther ? UBIGEO_OTHER_PROVINCE_ID : (p.district?.province?.id ?? ''),
        districtId: isOther ? UBIGEO_OTHER_DISTRICT_ID : p.districtId,
        locationCountry: loc?.country ?? '',
        locationDepartment: loc?.department ?? '',
        locationProvince: loc?.province ?? '',
        locationDistrict: loc?.district ?? '',
        description: isOther && legacyLoc ? stripLocationFromDescription(p.description) : (p.description ?? ''),
        area: p.area ?? '',
        bedrooms: p.bedrooms ?? '',
        bathrooms: p.bathrooms ?? '',
        ageYears: p.ageYears ?? '',
        floorLevel: p.floorLevel ?? '',
        parkingSpaces: p.parkingSpaces ?? '',
        partida1: p.partida1 ?? '',
        partida2: p.partida2 ?? '',
        partida3: p.partida3 ?? '',
        ownerId: ownerIds[0] ?? '',
        listingStatus: status,
        saleCurrency: p.saleCurrency || 'PEN',
        salePrice: p.salePrice ?? '',
      },
    })
    setTimeout(() => {
      isInitializing.value = false
    }, 0)
  },
  { immediate: true },
)

const toNum = (v: string | number | null | undefined): number | null => {
  if (v === '' || v === undefined || v === null) return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

const onSubmit = handleSubmit((v: PropertyFormValues) => {
  const ownerClientIds = Array.from(new Set(ownerRows.value.filter(Boolean)))
  if (!ownerClientIds.length) {
    setFieldValue('ownerId', '')
    return
  }
  const ubigeo = buildPropertyUbigeoPayload(v)
  emit('submit', {
    code: v.code.trim(),
    propertyTypeId: v.propertyTypeId,
    projectName: v.projectName.trim() || null,
    addressLine: v.addressLine.trim(),
    districtId: ubigeo.districtId,
    locationCustom: ubigeo.locationCustom,
    description: v.description?.trim() || null,
    area: toNum(v.area),
    bedrooms: toNum(v.bedrooms),
    bathrooms: toNum(v.bathrooms),
    ageYears: toNum(v.ageYears),
    floorLevel: v.floorLevel.trim() || null,
    parkingSpaces: toNum(v.parkingSpaces),
    partida1: v.partida1.trim() || null,
    partida2: v.partida2.trim() || null,
    partida3: v.partida3.trim() || null,
    ownerId: ownerClientIds[0]!,
    ownerClientIds,
    listingStatus: v.listingStatus,
    saleCurrency: v.saleCurrency,
    salePrice: toNum(v.salePrice),
  })
})
</script>

<template>
  <LoadingState v-if="loading" text="Cargando opciones..." class="py-24" />

  <form
    v-else
    :id="formId"
    :class="isModal ? 'space-y-5' : 'grid grid-cols-1 items-start gap-6 xl:grid-cols-3'"
    novalidate
    @submit.prevent="onSubmit"
  >
    <!-- ── Columna principal ── -->
    <div :class="isModal ? 'space-y-5' : 'space-y-6 xl:col-span-2'">
      <FormSectionCard title="Datos generales" subtitle="El código se arma con el tipo, el distrito y el propietario principal">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormSelect
            v-bind="propertyTypeIdBinds"
            label="Tipo de propiedad"
            placeholder="Seleccionar"
            :options="propertyTypeOptions"
            :error="errors.propertyTypeId"
            required
          />
          <!-- Código generado (solo lectura) -->
          <div class="md:col-span-2">
            <p :class="fieldLabelClass">Código</p>
            <div
              class="mt-2 flex min-h-11 flex-wrap items-center gap-3 rounded-[10px] border border-dashed border-gray-300 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
            >
              <span class="min-w-0 flex-1 font-semibold tracking-wide break-all text-gray-800 dark:text-white/90">
                {{ values.code || '—' }}
              </span>
              <BaseButton
                v-if="canRegenerateCode && canWrite"
                type="button"
                variant="outline"
                size="sm"
                icon="lucide:refresh-cw"
                @click="regenerateCode"
              >
                Regenerar
              </BaseButton>
            </div>
            <p v-if="errors.code" role="alert" class="mt-1.5 text-theme-xs text-error-500">{{ errors.code }}</p>
            <p v-else-if="canRegenerateCode" class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
              Con los datos actuales sería <strong>{{ autoCode }}</strong>
            </p>
            <p v-else-if="!isEditing" class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
              Se completa al elegir tipo, propietario y distrito.
            </p>
          </div>

          <FormInput
            v-bind="projectNameBinds"
            class="md:col-span-3"
            label="Proyecto / edificio"
            placeholder="Ej. Residencial Los Álamos (opcional)"
            :error="errors.projectName"
          />
          <FormTextarea
            v-bind="descriptionBinds"
            class="md:col-span-3"
            label="Descripción"
            placeholder="Distribución, acabados, áreas comunes, vista..."
            :rows="3"
          />
        </div>
      </FormSectionCard>

      <PropertyOwnersSection v-model:owner-ids="ownerRows" :owner-options="ownerOptions" :error="errors.ownerId">
        <template #new-owner-modal="{ open, setOpen, onCreated }">
          <VentasClienteFormModal
            :open="open"
            client-type="OWNER"
            @update:open="setOpen"
            @created="onCreated"
          />
        </template>
      </PropertyOwnersSection>

      <FormSectionCard title="Ubicación" subtitle="Dirección del inmueble">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-6">
          <FormInput
            v-bind="addressLineBinds"
            class="md:col-span-6"
            label="Dirección"
            placeholder="Av. Principal 123, Dpto. 501"
            :error="errors.addressLine"
            required
          />
          <FormSelect
            v-bind="departmentIdBinds"
            class="md:col-span-2"
            label="Departamento"
            placeholder="Seleccionar"
            :options="departmentOptions"
            :loading="loadingDepartments"
            :error="errors.departmentId"
            required
          />
          <template v-if="isOtherLocation">
            <FormInput
              v-bind="locationCountryBinds"
              class="md:col-span-2"
              label="País"
              placeholder="Ej. España, Chile"
              :error="errors.locationCountry"
              required
            />
            <FormInput
              v-bind="locationDepartmentBinds"
              class="md:col-span-2"
              label="Departamento / Estado"
              placeholder="Ej. Madrid, California"
              :error="errors.locationDepartment"
              required
            />
            <FormInput
              v-bind="locationProvinceBinds"
              class="md:col-span-3"
              label="Provincia"
              placeholder="Ej. Madrid, Los Ángeles"
              :error="errors.locationProvince"
              required
            />
            <FormInput
              v-bind="locationDistrictBinds"
              class="md:col-span-3"
              label="Distrito / Localidad"
              placeholder="Ej. Centro, Beverly Hills"
              :error="errors.locationDistrict"
              required
            />
          </template>
          <template v-else>
            <FormSelect
              v-bind="provinceIdBinds"
              class="md:col-span-2"
              label="Provincia"
              placeholder="Seleccionar"
              :options="provinceOptions"
              :loading="loadingProvinces"
              :disabled="!values.departmentId"
            />
            <FormSelect
              v-bind="districtIdBinds"
              class="md:col-span-2"
              label="Distrito"
              placeholder="Seleccionar"
              :options="districtOptions"
              :loading="loadingDistricts"
              :disabled="!values.provinceId"
              :error="errors.districtId"
              required
            />
          </template>
        </div>
      </FormSectionCard>

      <FormSectionCard title="Condiciones de venta" subtitle="Estado comercial, moneda y precio">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormSelect
            v-bind="listingStatusBinds"
            label="Estado comercial"
            :options="VENTAS_LISTING_STATUS_OPTIONS"
            :error="errors.listingStatus"
            required
          />
          <FormSelect
            v-bind="saleCurrencyBinds"
            label="Moneda"
            :options="currencyOptions"
            :error="errors.saleCurrency"
            required
          />
          <FormInput
            v-bind="salePriceBinds"
            type="number"
            min="0"
            step="0.01"
            :label="`Precio de venta (${currencySymbol})`"
            placeholder="350000"
            :error="errors.salePrice"
            required
          />
        </div>
      </FormSectionCard>

      <FormSectionCard title="Características" subtitle="Superficie, ambientes y detalles">
        <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
          <FormInput v-bind="areaBinds" type="number" min="0" step="0.01" label="Área (m²)" placeholder="120" :error="errors.area" />
          <FormInput v-bind="bedroomsBinds" type="number" min="0" label="Dormitorios" placeholder="3" :error="errors.bedrooms" />
          <FormInput v-bind="bathroomsBinds" type="number" min="0" label="Baños" placeholder="2" :error="errors.bathrooms" />
          <FormInput
            v-bind="parkingSpacesBinds"
            type="number"
            min="0"
            label="Estacionamientos"
            placeholder="1"
            :error="errors.parkingSpaces"
          />
          <FormInput v-bind="floorLevelBinds" label="Piso / Nivel" placeholder="5to piso" :error="errors.floorLevel" />
          <FormInput
            v-bind="ageYearsBinds"
            type="number"
            min="0"
            label="Antigüedad (años)"
            placeholder="5"
            :error="errors.ageYears"
          />
        </div>
      </FormSectionCard>

      <FormSectionCard title="Partidas registrales" subtitle="Hasta 3 números de partida (opcional)">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormInput v-bind="partida1Binds" label="Partida 1" placeholder="Ej. 12345678" :error="errors.partida1" />
          <FormInput v-bind="partida2Binds" label="Partida 2" placeholder="Ej. 12345679" :error="errors.partida2" />
          <FormInput v-bind="partida3Binds" label="Partida 3" placeholder="Ej. 12345680" :error="errors.partida3" />
        </div>
      </FormSectionCard>

      <slot name="media" />
    </div>

    <!-- ── Lateral: resumen + acciones (fijo en escritorio) ── -->
    <aside v-if="!isModal" class="space-y-6 xl:sticky xl:top-24">
      <FormSectionCard title="Resumen">
        <dl class="space-y-3 text-sm">
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Código · Tipo</dt>
            <dd class="font-semibold text-gray-800 dark:text-white/90">{{ values.code || '—' }} · {{ selectedTypeLabel }}</dd>
          </div>
          <div v-if="values.projectName">
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Proyecto</dt>
            <dd class="text-gray-800 dark:text-white/90">{{ values.projectName }}</dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Dirección</dt>
            <dd class="text-gray-800 dark:text-white/90">{{ values.addressLine || '—' }}</dd>
            <dd v-if="values.departmentId" class="text-theme-xs text-gray-500 dark:text-gray-400">{{ locationSummary }}</dd>
          </div>
          <div>
            <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Propietario(s)</dt>
            <dd class="text-gray-800 dark:text-white/90">{{ selectedOwnerLabel }}</dd>
          </div>
          <div class="flex items-center justify-between gap-2">
            <div>
              <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Precio de venta</dt>
              <dd class="font-bold text-brand-500 dark:text-brand-400">
                {{
                  salePricePreview !== null
                    ? `${currencySymbol} ${salePricePreview.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
                    : '—'
                }}
              </dd>
              <dd v-if="pricePerM2 !== null" class="text-theme-xs text-gray-500 dark:text-gray-400">
                {{ currencySymbol }} {{ pricePerM2.toLocaleString('es-PE', { maximumFractionDigits: 0 }) }} por m²
              </dd>
            </div>
            <Badge :variant="listingStatusVariant(values.listingStatus)">{{ listingStatusLabel(values.listingStatus) }}</Badge>
          </div>
        </dl>
        <div class="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800">
          <div class="flex flex-col items-center gap-1 text-center">
            <AppIcon icon="lucide:bed-double" :size="16" color="var(--color-text-muted)" />
            <span class="text-sm font-bold text-gray-800 dark:text-white/90">{{ formatFormStat(values.bedrooms) }}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500">Dorm.</span>
          </div>
          <div class="flex flex-col items-center gap-1 text-center">
            <AppIcon icon="lucide:bath" :size="16" color="var(--color-text-muted)" />
            <span class="text-sm font-bold text-gray-800 dark:text-white/90">{{ formatFormStat(values.bathrooms) }}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500">Baños</span>
          </div>
          <div class="flex flex-col items-center gap-1 text-center">
            <AppIcon icon="lucide:ruler" :size="16" color="var(--color-text-muted)" />
            <span class="text-sm font-bold text-gray-800 dark:text-white/90">{{ formatFormArea(values.area) }}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500">Área</span>
          </div>
        </div>
      </FormSectionCard>

      <div class="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
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
        <BaseButton variant="outline" type="button" block @click="emit('cancel')">Cancelar</BaseButton>
        <p class="text-center text-theme-xs text-gray-400 dark:text-gray-500">
          Los campos con <span class="text-error-500">*</span> son obligatorios
        </p>
      </div>
    </aside>
  </form>
</template>
