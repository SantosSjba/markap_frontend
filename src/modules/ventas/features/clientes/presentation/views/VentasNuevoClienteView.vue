<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import {
  useVentasClientDocumentTypes,
  useVentasCreateClient,
  useVentasClientDepartments,
  useVentasClientProvinces,
  useVentasClientDistricts,
} from '../../application/useVentasClients'
import { useVentasAgentsList } from '@modules/ventas/features/agentes'
import { ventasPropertyKeys } from '@modules/ventas/features/propiedades'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
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

/** Un solo tipo de valores: el schema dinámico valida según comprador vs propietario. */
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
const queryClient = useQueryClient()
const appColor = 'var(--color-primary)'

const clientKind = ref<'BUYER' | 'OWNER'>('BUYER')

const returnTo = computed(() =>
  typeof route.query.returnTo === 'string' ? route.query.returnTo : '',
)

onMounted(() => {
  const q = route.query.clientType
  if (q === 'OWNER' || q === 'BUYER') clientKind.value = q
})

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
  toTypedSchema(clientKind.value === 'OWNER' ? ownerSchema : buyerSchema),
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

const { isOtherLocation } = useClientAddressUbigeo({ values, setFieldValue })

const selectedDepartmentId = computed(() => values.departmentId || undefined)
const selectedProvinceId = computed(() => values.provinceId || undefined)

const { data: documentTypes, isLoading: loadingDocs } = useVentasClientDocumentTypes()
const { data: departments, isLoading: loadingDepartments } = useVentasClientDepartments()
const { data: provinces, isLoading: loadingProvinces } =
  useVentasClientProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } =
  useVentasClientDistricts(selectedProvinceId)

const createMutation = useVentasCreateClient()

const agentsListParams = ref({
  page: 1,
  limit: 500,
  isActive: true,
})
const { data: agentsResult, isLoading: loadingAgents } = useVentasAgentsList(agentsListParams)

const loading = computed(
  () =>
    loadingDocs.value ||
    loadingDepartments.value ||
    (clientKind.value === 'BUYER' && loadingAgents.value),
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

function selectClientKind(kind: 'BUYER' | 'OWNER') {
  clientKind.value = kind
  resetForm()
}

const goBack = () => {
  if (returnTo.value) void router.push(returnTo.value)
  else void router.push('/ventas/clientes')
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    if (clientKind.value === 'BUYER') {
      const data = await createMutation.mutateAsync({
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
      })
      if (returnTo.value && data?.id) {
        await invalidateQuerySubtree(queryClient, ventasPropertyKeys.root)
        void router.push({ path: returnTo.value, query: { selectedClientId: data.id } })
      } else {
        void router.push('/ventas/clientes')
      }
      return
    }

    const data = await createMutation.mutateAsync({
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
          : {}),
      },
    })
    if (returnTo.value && data?.id) {
      await invalidateQuerySubtree(queryClient, ventasPropertyKeys.root)
      void router.push({ path: returnTo.value, query: { selectedClientId: data.id } })
    } else {
      void router.push('/ventas/clientes')
    }
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
          Nuevo cliente
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Comprador / lead o propietario (inventario ventas)
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <AppIcon icon="line-md:loading-loop" :size="32" :color="appColor" />
    </div>

    <form v-else @submit.prevent="onSubmit" class="space-y-8">
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Tipo de cliente
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Igual que en Alquileres: propietario lleva dirección fiscal; comprador lleva embudo de ventas.
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            class="p-4 rounded-lg border-2 text-left transition-all"
            :style="{
              borderColor: clientKind === 'BUYER' ? appColor : 'var(--color-border)',
              color: clientKind === 'BUYER' ? appColor : 'var(--color-text-primary)',
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
              borderColor: clientKind === 'OWNER' ? appColor : 'var(--color-border)',
              color: clientKind === 'OWNER' ? appColor : 'var(--color-text-primary)',
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
      </section>

      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Datos personales
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Identificación y nombre
        </p>
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
            label="N° documento (DNI / RUC)"
            placeholder="12345678"
            :error="errors.documentNumber"
            required
          />
          <FormInput
            v-bind="fullNameBinds"
            class="md:col-span-2"
            label="Nombre completo / Razón social"
            :placeholder="clientKind === 'OWNER' ? 'Nombre del propietario' : 'Nombre del lead o comprador'"
            :error="errors.fullName"
            required
          />
          <FormInput
            v-bind="legalRepresentativeNameBinds"
            label="Representante legal (opcional)"
            placeholder="Si aplica"
            :error="errors.legalRepresentativeName"
          />
          <FormInput
            v-bind="legalRepresentativePositionBinds"
            label="Cargo"
            placeholder="Gerente general"
            :error="errors.legalRepresentativePosition"
          />
        </div>
      </section>

      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Contacto
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <FormInput
            v-bind="primaryPhoneBinds"
            type="tel"
            label="Teléfono"
            placeholder="999 999 999"
            :error="errors.primaryPhone"
            required
          />
          <FormInput
            v-bind="secondaryPhoneBinds"
            type="tel"
            label="Teléfono alternativo"
            placeholder="Opcional"
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
            placeholder="Opcional"
            :error="errors.secondaryEmail"
          />
        </div>
      </section>

      <section
        v-if="clientKind === 'OWNER'"
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Dirección fiscal
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Misma lógica que propietarios en Alquileres (ubigeo + dirección).
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-bind="addressLineBinds"
            class="md:col-span-2"
            label="Dirección completa"
            placeholder="Calle, número, urbanización…"
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
            placeholder="Frente a…"
            :error="errors.reference"
          />
        </div>
      </section>

      <section
        v-if="clientKind === 'BUYER'"
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Lead y asignación
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Estado en el embudo, origen y asesor responsable
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            v-bind="salesStatusBinds"
            label="Estado del cliente"
            placeholder="Seleccionar"
            :options="VENTAS_SALES_STATUS_OPTIONS"
            :error="errors.salesStatus"
            required
          />
          <FormSelect
            v-bind="leadOriginBinds"
            label="Origen del lead"
            placeholder="Seleccionar"
            :options="VENTAS_LEAD_ORIGIN_OPTIONS"
            :error="errors.leadOrigin"
            required
          />
          <FormSelect
            v-bind="assignedAgentIdBinds"
            class="md:col-span-2"
            label="Asesor asignado"
            placeholder="Seleccionar asesor"
            :options="agentOptions"
            :error="errors.assignedAgentId"
          />
        </div>
      </section>

      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Notas
        </h2>
        <FormTextarea
          v-bind="notesBinds"
          label="Observaciones"
          :placeholder="
            clientKind === 'OWNER'
              ? 'Datos del titular, segunda firma, etc.'
              : 'Detalle de interés, presupuesto, propiedad buscada…'
          "
          :rows="4"
        />
      </section>

      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="goBack">Cancelar</BaseButton>
        <BaseButton type="submit" :loading="createMutation.isPending.value" variant="primary">
          <AppIcon
            v-if="!createMutation.isPending.value"
            icon="lucide:save"
            :size="20"
            color="currentColor"
          />
          Guardar
        </BaseButton>
      </div>
    </form>
  </div>
</template>
