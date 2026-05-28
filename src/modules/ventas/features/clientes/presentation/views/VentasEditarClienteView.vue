<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import { BaseButton, FormSectionCard } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import {
  useVentasClient,
  useVentasClientDocumentTypes,
  useVentasUpdateClient,
  useVentasClientDepartments,
  useVentasClientProvinces,
  useVentasClientDistricts,
} from '../../application/useVentasClients'
import { useVentasAgentsList } from '@modules/ventas/features/agentes'
import type { VentasDocumentType } from '../../domain/client.types'
import { VENTAS_LEAD_ORIGIN_OPTIONS, VENTAS_SALES_STATUS_OPTIONS } from '../../domain/leadOrigins.constants'
import type { VentasLeadOriginCode } from '../../domain/leadOrigins.constants'
import {
  UBIGEO_OTHER_DEPARTMENT_ID,
  UBIGEO_OTHER_DISTRICT_ID,
  mergeDepartmentOptions,
  buildLocationCustomPayload,
} from '@modules/alquileres/features/clientes/constants/ubigeo-other'
import { useClientAddressUbigeo } from '@modules/alquileres/features/clientes/composables/useClientAddressUbigeo'

interface VentasClienteFormValues {
  documentTypeId: string
  documentNumber: string
  fullName: string
  legalRepresentativeName: string
  legalRepresentativePosition: string
  primaryPhone: string
  secondaryPhone: string
  primaryEmail: string
  secondaryEmail: string
  salesStatus: 'PROSPECT' | 'INTERESTED' | 'CLIENT'
  leadOrigin: VentasLeadOriginCode | ''
  assignedAgentId: string
  notes: string
  addressLine: string
  departmentId: string
  provinceId: string
  districtId: string
  reference: string
  locationCountry: string
  locationDepartment: string
  locationProvince: string
  locationDistrict: string
}

const route = useRoute()
const router = useRouter()
const appColor = 'var(--color-primary)'

const id = computed(() => String(route.params.id ?? ''))

const editKind = ref<'BUYER' | 'OWNER'>('BUYER')
const isInitializing = ref(false)
/** Evita sobrescribir el formulario y el tipo al revalidar la misma query. */
const hydratedForClientId = ref<string | null>(null)

const baseShape = {
  documentTypeId: yup.string().required('Seleccione el tipo de documento'),
  documentNumber: yup.string().required('El DNI / documento es requerido').trim(),
  fullName: yup.string().required('El nombre es requerido').trim(),
  legalRepresentativeName: yup.string().trim(),
  legalRepresentativePosition: yup.string().trim(),
  primaryPhone: yup.string().required('El teléfono es requerido').trim(),
  secondaryPhone: yup.string().trim(),
  primaryEmail: yup
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .email('Email inválido')
    .optional(),
  secondaryEmail: yup
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .email('Email inválido')
    .optional(),
  notes: yup.string().trim(),
}

const buyerSchema = yup.object({
  ...baseShape,
  salesStatus: yup
    .string()
    .oneOf(['PROSPECT', 'INTERESTED', 'CLIENT'])
    .required('Seleccione el estado del cliente'),
  leadOrigin: yup.string().required('Seleccione el origen del lead'),
  assignedAgentId: yup.string().trim(),
})

const ownerSchema = yup.object({
  ...baseShape,
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
  reference: yup.string().trim(),
})

const validationSchema = computed(() =>
  toTypedSchema(editKind.value === 'OWNER' ? ownerSchema : buyerSchema),
)

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue, resetForm } =
  useForm<VentasClienteFormValues>({
  validationSchema,
  initialValues: {
    documentTypeId: '',
    documentNumber: '',
    fullName: '',
    legalRepresentativeName: '',
    legalRepresentativePosition: '',
    primaryPhone: '',
    secondaryPhone: '',
    primaryEmail: '',
    secondaryEmail: '',
    salesStatus: 'PROSPECT' as const,
    leadOrigin: '' as VentasLeadOriginCode | '',
    assignedAgentId: '',
    notes: '',
    addressLine: '',
    departmentId: '',
    provinceId: '',
    districtId: '',
    reference: '',
    locationCountry: '',
    locationDepartment: '',
    locationProvince: '',
    locationDistrict: '',
  },
  })

const documentTypeIdBinds = defineComponentBinds('documentTypeId')
const documentNumberBinds = defineComponentBinds('documentNumber')
const fullNameBinds = defineComponentBinds('fullName')
const legalRepresentativeNameBinds = defineComponentBinds('legalRepresentativeName')
const legalRepresentativePositionBinds = defineComponentBinds('legalRepresentativePosition')
const primaryPhoneBinds = defineComponentBinds('primaryPhone')
const secondaryPhoneBinds = defineComponentBinds('secondaryPhone')
const primaryEmailBinds = defineComponentBinds('primaryEmail')
const secondaryEmailBinds = defineComponentBinds('secondaryEmail')
const salesStatusBinds = defineComponentBinds('salesStatus')
const leadOriginBinds = defineComponentBinds('leadOrigin')
const assignedAgentIdBinds = defineComponentBinds('assignedAgentId')
const notesBinds = defineComponentBinds('notes')
const addressLineBinds = defineComponentBinds('addressLine')
const departmentIdBinds = defineComponentBinds('departmentId')
const provinceIdBinds = defineComponentBinds('provinceId')
const districtIdBinds = defineComponentBinds('districtId')
const referenceBinds = defineComponentBinds('reference')
const locationCountryBinds = defineComponentBinds('locationCountry')
const locationDepartmentBinds = defineComponentBinds('locationDepartment')
const locationProvinceBinds = defineComponentBinds('locationProvince')
const locationDistrictBinds = defineComponentBinds('locationDistrict')

const { isOtherLocation } = useClientAddressUbigeo({
  values,
  setFieldValue,
  isInitializing,
})

const selectedDepartmentId = computed(() => values.departmentId || undefined)
const selectedProvinceId = computed(() => values.provinceId || undefined)

const { data: client, isLoading: loadingClient, isError: clientError } = useVentasClient(id)
const { data: documentTypes, isLoading: loadingDocs } = useVentasClientDocumentTypes()
const { data: departments, isLoading: loadingDepartments } = useVentasClientDepartments()
const { data: provinces, isLoading: loadingProvinces } =
  useVentasClientProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } =
  useVentasClientDistricts(selectedProvinceId)
const updateMutation = useVentasUpdateClient()

const agentsListParams = ref({
  page: 1,
  limit: 500,
  isActive: true,
})
const { data: agentsResult, isLoading: loadingAgents } = useVentasAgentsList(agentsListParams)

const loading = computed(
  () =>
    loadingClient.value ||
    loadingDocs.value ||
    loadingDepartments.value ||
    (editKind.value === 'BUYER' && loadingAgents.value),
)

const documentTypeOptions = computed(() =>
  (documentTypes.value ?? []).map((d: VentasDocumentType) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  })),
)

const departmentOptions = computed(() => mergeDepartmentOptions(departments.value))
const provinceOptions = computed(() =>
  (provinces.value ?? []).map((p) => ({ value: p.id, label: p.name })),
)
const districtOptions = computed(() =>
  (districts.value ?? []).map((d) => ({ value: d.id, label: d.name })),
)

const agentOptions = computed(() => [
  { value: '', label: 'Sin asignar' },
  ...(agentsResult.value?.data ?? []).map((a) => ({
    value: a.id,
    label: a.fullName,
  })),
])

watch(id, () => {
  hydratedForClientId.value = null
})

watch(
  () => [id.value, client.value] as const,
  ([routeId, c]) => {
    if (!routeId || !c || c.id !== routeId) return
    if (c.applicationSlug !== 'ventas' || (c.clientType !== 'BUYER' && c.clientType !== 'OWNER')) {
      void router.replace('/ventas/clientes')
      return
    }
    if (hydratedForClientId.value === routeId) return
    hydratedForClientId.value = routeId
    isInitializing.value = true
    editKind.value = c.clientType
    const addr = c.primaryAddress
    resetForm({
      values: {
        documentTypeId: c.documentTypeId,
        documentNumber: c.documentNumber,
        fullName: c.fullName,
        legalRepresentativeName: c.legalRepresentativeName ?? '',
        legalRepresentativePosition: c.legalRepresentativePosition ?? '',
        primaryPhone: c.primaryPhone,
        secondaryPhone: c.secondaryPhone ?? '',
        primaryEmail: c.primaryEmail ?? '',
        secondaryEmail: c.secondaryEmail ?? '',
        salesStatus: (c.salesStatus ?? 'PROSPECT') as 'PROSPECT' | 'INTERESTED' | 'CLIENT',
        leadOrigin: (c.leadOrigin ?? '') as VentasLeadOriginCode | '',
        assignedAgentId: c.assignedAgentId ?? '',
        notes: c.notes ?? '',
        addressLine: addr?.addressLine ?? '',
        departmentId: addr?.district?.province?.department?.id ?? '',
        provinceId: addr?.district?.province?.id ?? '',
        districtId: addr?.districtId ?? '',
        locationCountry: addr?.locationCustom?.country ?? '',
        locationDepartment: addr?.locationCustom?.department ?? '',
        locationProvince: addr?.locationCustom?.province ?? '',
        locationDistrict: addr?.locationCustom?.district ?? '',
        reference: addr?.reference ?? '',
      },
    })
    setTimeout(() => {
      isInitializing.value = false
    }, 0)
  },
  { immediate: true },
)

watch(
  () => clientError.value,
  (isErr) => {
    if (isErr) void router.replace('/ventas/clientes')
  },
)

function selectClientKind(kind: 'BUYER' | 'OWNER') {
  if (kind === editKind.value) return
  editKind.value = kind
  if (kind === 'BUYER' && !values.salesStatus) {
    setFieldValue('salesStatus', 'PROSPECT')
  }
}

const goBack = () => router.push('/ventas/clientes')

const onSubmit = handleSubmit(async (formValues) => {
  try {
    if (editKind.value === 'BUYER') {
      await updateMutation.mutateAsync({
        id: id.value,
        data: {
          clientType: 'BUYER',
          documentTypeId: formValues.documentTypeId,
          documentNumber: formValues.documentNumber.trim(),
          fullName: formValues.fullName.trim(),
          legalRepresentativeName: formValues.legalRepresentativeName?.trim() || null,
          legalRepresentativePosition:
            formValues.legalRepresentativePosition?.trim() || null,
          primaryPhone: formValues.primaryPhone.trim(),
          secondaryPhone: formValues.secondaryPhone?.trim() || null,
          primaryEmail: formValues.primaryEmail?.trim() || null,
          secondaryEmail: formValues.secondaryEmail?.trim() || null,
          notes: formValues.notes?.trim() || null,
          salesStatus: formValues.salesStatus as 'PROSPECT' | 'INTERESTED' | 'CLIENT',
          leadOrigin: formValues.leadOrigin || null,
          assignedAgentId: formValues.assignedAgentId?.trim() || null,
        },
      })
    } else {
      await updateMutation.mutateAsync({
        id: id.value,
        data: {
          clientType: 'OWNER',
          documentTypeId: formValues.documentTypeId,
          documentNumber: formValues.documentNumber.trim(),
          fullName: formValues.fullName.trim(),
          legalRepresentativeName: formValues.legalRepresentativeName?.trim() || null,
          legalRepresentativePosition:
            formValues.legalRepresentativePosition?.trim() || null,
          primaryPhone: formValues.primaryPhone.trim(),
          secondaryPhone: formValues.secondaryPhone?.trim() || null,
          primaryEmail: formValues.primaryEmail?.trim() || null,
          secondaryEmail: formValues.secondaryEmail?.trim() || null,
          notes: formValues.notes?.trim() || null,
          salesStatus: null,
          leadOrigin: null,
          assignedAgentId: null,
          address: {
            addressLine: formValues.addressLine.trim(),
            districtId:
              formValues.departmentId === UBIGEO_OTHER_DEPARTMENT_ID
                ? UBIGEO_OTHER_DISTRICT_ID
                : formValues.districtId,
            reference: formValues.reference?.trim() || null,
            ...(formValues.departmentId === UBIGEO_OTHER_DEPARTMENT_ID
              ? {
                  locationCustom: buildLocationCustomPayload({
                    locationCountry: formValues.locationCountry,
                    locationDepartment: formValues.locationDepartment,
                    locationProvince: formValues.locationProvince,
                    locationDistrict: formValues.locationDistrict,
                  }),
                }
              : { locationCustom: null }),
          },
        },
      })
    }
    void router.push('/ventas/clientes')
  } catch {
    void 0
  }
})
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
          Editar cliente
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          {{
            editKind === 'OWNER'
              ? 'Propietario — datos y dirección fiscal'
              : 'Comprador / lead — embudo y asignación'
          }}
          · Puedes cambiar el tipo igual que al crear.
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <AppIcon icon="line-md:loading-loop" :size="32" :color="appColor" />
    </div>

    <form v-else-if="client" @submit.prevent="onSubmit" class="space-y-8">
      <FormSectionCard
        title="Tipo de cliente"
        subtitle="Comprador / lead o propietario de inventario. Si es titular de propiedades, no podrás pasarlo a comprador hasta liberar el inventario."
        icon="lucide:users"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            class="p-4 rounded-lg border-2 text-left transition-all"
            :style="{
              borderColor: editKind === 'BUYER' ? appColor : 'var(--color-border)',
              color: editKind === 'BUYER' ? appColor : 'var(--color-text-primary)',
            }"
            @click="selectClientKind('BUYER')"
          >
            <div class="flex items-center gap-3">
              <AppIcon icon="lucide:user-plus" :size="32" color="currentColor" class="shrink-0" />
              <div>
                <span class="font-medium block">Comprador / lead</span>
                <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                  Embudo, origen del lead y asesor
                </span>
              </div>
            </div>
          </button>
          <button
            type="button"
            class="p-4 rounded-lg border-2 text-left transition-all"
            :style="{
              borderColor: editKind === 'OWNER' ? appColor : 'var(--color-border)',
              color: editKind === 'OWNER' ? appColor : 'var(--color-text-primary)',
            }"
            @click="selectClientKind('OWNER')"
          >
            <div class="flex items-center gap-3">
              <AppIcon icon="lucide:building-2" :size="32" color="currentColor" class="shrink-0" />
              <div>
                <span class="font-medium block">Propietario</span>
                <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                  Titular de propiedades en ventas (requiere dirección)
                </span>
              </div>
            </div>
          </button>
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Datos personales"
        subtitle="Identificación y nombre"
        icon="lucide:id-card"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            v-bind="documentTypeIdBinds"
            label="Tipo de documento"
            placeholder="Seleccionar"
            :options="documentTypeOptions"
            :error="errors.documentTypeId"
            required
          />
          <FormInput
            v-bind="documentNumberBinds"
            label="N° documento"
            :error="errors.documentNumber"
            required
          />
          <FormInput
            v-bind="fullNameBinds"
            class="md:col-span-2"
            label="Nombre completo / Razón social"
            :placeholder="editKind === 'OWNER' ? 'Nombre del propietario' : 'Nombre del lead o comprador'"
            :error="errors.fullName"
            required
          />
          <FormInput
            v-bind="legalRepresentativeNameBinds"
            label="Representante legal (opcional)"
            :error="errors.legalRepresentativeName"
          />
          <FormInput
            v-bind="legalRepresentativePositionBinds"
            label="Cargo"
            :error="errors.legalRepresentativePosition"
          />
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Contacto"
        subtitle="Teléfonos y correos"
        icon="lucide:phone"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-bind="primaryPhoneBinds"
            type="tel"
            label="Teléfono"
            :error="errors.primaryPhone"
            required
          />
          <FormInput
            v-bind="secondaryPhoneBinds"
            type="tel"
            label="Teléfono alternativo"
            :error="errors.secondaryPhone"
          />
          <FormInput
            v-bind="primaryEmailBinds"
            type="email"
            label="Email"
            placeholder="Opcional"
            :error="errors.primaryEmail"
          />
          <FormInput
            v-bind="secondaryEmailBinds"
            type="email"
            label="Email alternativo"
            :error="errors.secondaryEmail"
          />
        </div>
      </FormSectionCard>

      <FormSectionCard
        v-if="editKind === 'OWNER'"
        title="Dirección fiscal"
        subtitle="Obligatoria para propietarios (misma regla que en nuevo cliente)."
        icon="lucide:map-pin"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-bind="addressLineBinds"
            class="md:col-span-2"
            label="Dirección completa"
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
          <FormInput
            v-bind="referenceBinds"
            class="md:col-span-2"
            label="Referencia (opcional)"
            :error="errors.reference"
          />
        </div>
      </FormSectionCard>

      <FormSectionCard
        v-if="editKind === 'BUYER'"
        title="Lead y asignación"
        subtitle="Estado en el embudo, origen y asesor responsable"
        icon="lucide:target"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            v-bind="salesStatusBinds"
            label="Estado del cliente"
            :options="VENTAS_SALES_STATUS_OPTIONS"
            :error="errors.salesStatus"
            required
          />
          <FormSelect
            v-bind="leadOriginBinds"
            label="Origen del lead"
            :options="VENTAS_LEAD_ORIGIN_OPTIONS"
            :error="errors.leadOrigin"
            required
          />
          <FormSelect
            v-bind="assignedAgentIdBinds"
            class="md:col-span-2"
            label="Asesor asignado"
            :options="agentOptions"
            :error="errors.assignedAgentId"
          />
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Notas"
        subtitle="Observaciones del cliente"
        icon="lucide:notebook-pen"
      >
        <FormTextarea
          v-bind="notesBinds"
          label="Observaciones"
          :placeholder="
            editKind === 'OWNER'
              ? 'Datos del titular, segunda firma, etc.'
              : 'Detalle de interés, presupuesto, propiedad buscada…'
          "
          :rows="4"
        />
      </FormSectionCard>

      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="goBack">Cancelar</BaseButton>
        <BaseButton type="submit" :loading="updateMutation.isPending.value" variant="primary">
          <AppIcon
            v-if="!updateMutation.isPending.value"
            icon="lucide:save"
            :size="20"
            color="currentColor"
          />
          Guardar cambios
        </BaseButton>
      </div>
    </form>
  </div>
</template>
