<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import OptionCardGroup from '@shared/presentation/components/forms/OptionCardGroup.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import {
  useVentasClientDocumentTypes,
  useVentasClientDepartments,
  useVentasClientProvinces,
  useVentasClientDistricts,
} from '../composables/useVentasClients'
import { useVentasAgentsList } from '../../../agentes/presentation/composables/useAgents'
import {
  UBIGEO_OTHER_DEPARTMENT_ID,
  UBIGEO_OTHER_DISTRICT_ID,
  buildLocationCustomPayload,
  mergeDepartmentOptions,
} from '@modules/alquileres/features/clientes/constants/ubigeo-other'
import { useClientAddressUbigeo } from '@modules/alquileres/features/clientes/composables/useClientAddressUbigeo'
import {
  VENTAS_LEAD_ORIGIN_OPTIONS,
  VENTAS_SALES_STATUS_OPTIONS,
} from '../../domain/leadOrigins.constants'
import type {
  CreateVentasClientPayload,
  SalesPipelineStatus,
  VentasClientDetail,
  VentasClientType,
  VentasDocumentType,
} from '../../domain/client.types'
/**
 * VentasClienteForm — formulario único de alta/edición de clientes de Ventas
 * (comprador / lead o propietario), con la misma estructura que el de Alquileres.
 * El propietario requiere dirección; en el comprador es opcional.
 * La vista decide qué hacer con el payload emitido.
 */

interface Props {
  /** Cliente a editar; sin él, el formulario arranca vacío (alta) */
  initial?: VentasClientDetail | null
  defaultClientType?: VentasClientType
  submitLabel: string
  submitting?: boolean
  canWrite?: boolean
  /** `modal`: una sola columna sin botones propios; el modal los pone en su pie */
  variant?: 'page' | 'modal'
  /** Oculta el selector de tipo y usa `defaultClientType` (ej. alta de propietario) */
  lockClientType?: boolean
  /** id del `<form>`, para enviarlo desde un botón externo (pie del modal) */
  formId?: string
}

const props = withDefaults(defineProps<Props>(), {
  initial: null,
  defaultClientType: 'BUYER',
  submitting: false,
  canWrite: true,
  variant: 'page',
  lockClientType: false,
  formId: undefined,
})

const isModal = computed(() => props.variant === 'modal')

const emit = defineEmits<{
  submit: [payload: CreateVentasClientPayload]
  cancel: []
}>()

/** Documentos numéricos: se fuerza teclado numérico y solo dígitos */
const NUMERIC_DOCUMENT_CODES = ['DNI', 'RUC']

const clientType = ref<VentasClientType>(props.defaultClientType)
watch(
  () => props.defaultClientType,
  (t) => {
    if (!props.initial) clientType.value = t
  },
)
const isBuyer = computed(() => clientType.value === 'BUYER')

const { data: documentTypes, isLoading: loadingDocs } = useVentasClientDocumentTypes()
function findDocumentType(id: string | undefined): VentasDocumentType | undefined {
  return (documentTypes.value ?? []).find((d) => d.id === id)
}

const optionalEmail = () =>
  yup
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .email('Email inválido')
    .optional()

/** Mismo formato que valida el backend (dígitos, espacios, +, guiones, paréntesis) */
const PHONE_RE = /^\+?[0-9\s().-]{6,20}$/
const phone = () => yup.string().trim().matches(PHONE_RE, { message: 'Teléfono no válido', excludeEmptyString: true })

/**
 * Dirección: obligatoria para propietarios; para compradores solo se valida si se empezó a llenar.
 */
function buildSchema(requireAddress: boolean) {
  const addressStarted = (line: unknown) => requireAddress || Boolean(String(line ?? '').trim())
  const isOther = (dep: unknown) => dep === UBIGEO_OTHER_DEPARTMENT_ID
  return yup.object({
    documentTypeId: yup.string().required('Seleccione el tipo de documento'),
    documentNumber: yup
      .string()
      .required('El número de documento es requerido')
      .trim()
      .test('document-format', '', function (value) {
        const doc = findDocumentType(this.parent.documentTypeId as string | undefined)
        if (!value || !doc) return true
        if (NUMERIC_DOCUMENT_CODES.includes(doc.code) && !/^\d+$/.test(value)) {
          return this.createError({ message: `El ${doc.code} solo admite dígitos` })
        }
        if (doc.length && value.length !== doc.length) {
          return this.createError({ message: `El ${doc.code} debe tener ${doc.length} caracteres` })
        }
        return true
      }),
    fullName: yup.string().required('El nombre es requerido').trim(),
    legalRepresentativeName: yup.string().trim(),
    legalRepresentativePosition: yup.string().trim(),
    primaryPhone: phone().required('El teléfono principal es requerido'),
    secondaryPhone: phone(),
    primaryEmail: optionalEmail(),
    secondaryEmail: optionalEmail(),
    salesStatus: yup.string().trim(),
    leadOrigin: yup.string().trim(),
    assignedAgentId: yup.string().trim(),
    addressLine: requireAddress ? yup.string().required('La dirección es requerida').trim() : yup.string().trim(),
    departmentId: yup.string().trim().test('dep', 'Seleccione el departamento', function (v) {
      return !addressStarted(this.parent.addressLine) || Boolean(v)
    }),
    provinceId: yup.string().trim(),
    districtId: yup.string().trim().test('dist', 'Seleccione el distrito', function (v) {
      if (!addressStarted(this.parent.addressLine) || isOther(this.parent.departmentId)) return true
      return Boolean(v)
    }),
    locationCountry: yup.string().trim().test('c', 'Indique el país', function (v) {
      return !isOther(this.parent.departmentId) || Boolean(v)
    }),
    locationDepartment: yup.string().trim().test('d', 'Indique departamento / estado', function (v) {
      return !isOther(this.parent.departmentId) || Boolean(v)
    }),
    locationProvince: yup.string().trim().test('p', 'Indique la provincia', function (v) {
      return !isOther(this.parent.departmentId) || Boolean(v)
    }),
    locationDistrict: yup.string().trim().test('di', 'Indique el distrito', function (v) {
      return !isOther(this.parent.departmentId) || Boolean(v)
    }),
    reference: yup.string().trim(),
    notes: yup.string().trim(),
  })
}

const buyerSchema = buildSchema(false)
  .shape({
    salesStatus: yup.string().required('Seleccione el estado'),
    leadOrigin: yup.string().required('Seleccione el origen del lead'),
  })
const ownerSchema = buildSchema(true)
const validationSchema = computed(() => toTypedSchema(isBuyer.value ? buyerSchema : ownerSchema))

const emptyValues = {
  documentTypeId: '',
  documentNumber: '',
  fullName: '',
  legalRepresentativeName: '',
  legalRepresentativePosition: '',
  primaryPhone: '',
  secondaryPhone: '',
  primaryEmail: '',
  secondaryEmail: '',
  salesStatus: 'PROSPECT',
  leadOrigin: '',
  assignedAgentId: '',
  addressLine: '',
  departmentId: '',
  provinceId: '',
  districtId: '',
  locationCountry: '',
  locationDepartment: '',
  locationProvince: '',
  locationDistrict: '',
  reference: '',
  notes: '',
}

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue, resetForm } = useForm({
  validationSchema,
  initialValues: emptyValues,
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
const addressLineBinds = defineComponentBinds('addressLine')
const referenceBinds = defineComponentBinds('reference')
const departmentIdBinds = defineComponentBinds('departmentId')
const provinceIdBinds = defineComponentBinds('provinceId')
const districtIdBinds = defineComponentBinds('districtId')
const locationCountryBinds = defineComponentBinds('locationCountry')
const locationDepartmentBinds = defineComponentBinds('locationDepartment')
const locationProvinceBinds = defineComponentBinds('locationProvince')
const locationDistrictBinds = defineComponentBinds('locationDistrict')
const notesBinds = defineComponentBinds('notes')

const isInitializing = ref(false)
const { isOtherLocation } = useClientAddressUbigeo({ values, setFieldValue, isInitializing })

const selectedDepartmentId = computed(() => values.departmentId || undefined)
const selectedProvinceId = computed(() => values.provinceId || undefined)
const { data: departments, isLoading: loadingDepartments } = useVentasClientDepartments()
const { data: provinces, isLoading: loadingProvinces } = useVentasClientProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } = useVentasClientDistricts(selectedProvinceId)

// 50 = tope de página del backend de agentes
const agentsListParams = ref({ page: 1, limit: 50, isActive: true })
const { data: agentsResult, isLoading: loadingAgents } = useVentasAgentsList(agentsListParams)

const loading = computed(() => loadingDocs.value || loadingDepartments.value)

const documentTypeOptions = computed(() =>
  (documentTypes.value ?? []).map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
)
const departmentOptions = computed(() => mergeDepartmentOptions(departments.value))
const provinceOptions = computed(() => (provinces.value ?? []).map((p) => ({ value: p.id, label: p.name })))
const districtOptions = computed(() => (districts.value ?? []).map((d) => ({ value: d.id, label: d.name })))
const agentOptions = computed(() => [
  { value: '', label: 'Sin asignar' },
  ...(agentsResult.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
])

const selectedDocumentType = computed(() => findDocumentType(values.documentTypeId))

/** Persona jurídica (RUC): razón social + representante legal */
const isCompany = computed(() => selectedDocumentType.value?.code === 'RUC')
const showLegalRepresentative = computed(
  () =>
    isCompany.value ||
    Boolean(values.legalRepresentativeName) ||
    Boolean(values.legalRepresentativePosition),
)
const documentNumberHint = computed(() => {
  const doc = selectedDocumentType.value
  return doc?.length
    ? `${doc.length} ${NUMERIC_DOCUMENT_CODES.includes(doc.code) ? 'dígitos' : 'caracteres'}`
    : undefined
})

watch(
  () => props.initial,
  (c) => {
    if (!c) return
    isInitializing.value = true
    clientType.value = c.clientType
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
        salesStatus: c.salesStatus ?? 'PROSPECT',
        leadOrigin: c.leadOrigin ?? '',
        assignedAgentId: c.assignedAgentId ?? '',
        addressLine: addr?.addressLine ?? '',
        departmentId: addr?.district?.province?.department?.id ?? '',
        provinceId: addr?.district?.province?.id ?? '',
        districtId: addr?.districtId ?? '',
        locationCountry: addr?.locationCustom?.country ?? '',
        locationDepartment: addr?.locationCustom?.department ?? '',
        locationProvince: addr?.locationCustom?.province ?? '',
        locationDistrict: addr?.locationCustom?.district ?? '',
        reference: addr?.reference ?? '',
        notes: c.notes ?? '',
      },
    })
    setTimeout(() => {
      isInitializing.value = false
    }, 0)
  },
  { immediate: true },
)

const onSubmit = handleSubmit((v) => {
  const isOther = v.departmentId === UBIGEO_OTHER_DEPARTMENT_ID
  const hasAddress = Boolean(v.addressLine?.trim())
  emit('submit', {
    clientType: clientType.value,
    documentTypeId: v.documentTypeId,
    documentNumber: v.documentNumber.trim(),
    fullName: v.fullName.trim(),
    legalRepresentativeName: v.legalRepresentativeName?.trim() || null,
    legalRepresentativePosition: v.legalRepresentativePosition?.trim() || null,
    primaryPhone: v.primaryPhone.trim(),
    secondaryPhone: v.secondaryPhone?.trim() || null,
    primaryEmail: v.primaryEmail?.trim() || null,
    secondaryEmail: v.secondaryEmail?.trim() || null,
    notes: v.notes?.trim() || null,
    ...(isBuyer.value
      ? {
          salesStatus: (v.salesStatus || 'PROSPECT') as SalesPipelineStatus,
          leadOrigin: v.leadOrigin || null,
          assignedAgentId: v.assignedAgentId || null,
        }
      : {}),
    ...(hasAddress
      ? {
          address: {
            addressLine: v.addressLine!.trim(),
            districtId: isOther ? UBIGEO_OTHER_DISTRICT_ID : (v.districtId as string),
            reference: v.reference?.trim() || null,
            locationCustom: isOther
              ? buildLocationCustomPayload({
                  locationCountry: v.locationCountry ?? '',
                  locationDepartment: v.locationDepartment ?? '',
                  locationProvince: v.locationProvince ?? '',
                  locationDistrict: v.locationDistrict ?? '',
                })
              : null,
          },
        }
      : {}),
  })
})
</script>

<template>
  <LoadingState v-if="loading" class="py-12" />

  <form
    v-else
    :id="formId"
    :class="isModal ? 'space-y-5' : 'grid grid-cols-1 items-start gap-6 xl:grid-cols-3'"
    novalidate
    @submit.prevent="onSubmit"
  >
    <!-- ── Columna principal ── -->
    <div :class="isModal ? 'space-y-5' : 'space-y-6 xl:col-span-2'">
      <FormSectionCard
        title="Identificación"
        :subtitle="lockClientType ? 'Documento de identidad' : 'Tipo de cliente y documento de identidad'"
      >
        <OptionCardGroup
          v-if="!lockClientType"
          :model-value="clientType"
          :options="[
            { value: 'BUYER', label: 'Comprador / lead', description: 'Interesado en comprar una propiedad', icon: 'lucide:user-plus' },
            { value: 'OWNER', label: 'Propietario', description: 'Dueño de una propiedad en venta', icon: 'lucide:building-2' },
          ]"
          @update:model-value="clientType = $event as VentasClientType"
        />

        <div class="grid grid-cols-1 gap-4 md:grid-cols-4" :class="{ 'mt-5': !lockClientType }">
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
            label="N.º de documento"
            :placeholder="selectedDocumentType?.length ? '0'.repeat(selectedDocumentType.length) : '12345678'"
            :maxlength="selectedDocumentType?.length ?? undefined"
            :inputmode="selectedDocumentType && NUMERIC_DOCUMENT_CODES.includes(selectedDocumentType.code) ? 'numeric' : 'text'"
            :hint="documentNumberHint"
            :error="errors.documentNumber"
            required
          />
          <FormInput
            v-bind="fullNameBinds"
            class="md:col-span-2"
            :label="isCompany ? 'Razón social' : 'Nombre completo'"
            :placeholder="isCompany ? 'Empresa S.A.C.' : 'Juan Pérez García'"
            :error="errors.fullName"
            required
          />
          <template v-if="showLegalRepresentative">
            <FormInput
              v-bind="legalRepresentativeNameBinds"
              class="md:col-span-2"
              label="Representante legal"
              placeholder="Nombre del representante"
              :error="errors.legalRepresentativeName"
            />
            <FormInput
              v-bind="legalRepresentativePositionBinds"
              class="md:col-span-2"
              label="Cargo"
              placeholder="Gerente General"
              :error="errors.legalRepresentativePosition"
            />
          </template>
        </div>
      </FormSectionCard>

      <FormSectionCard title="Contacto" subtitle="Medios para comunicarse con el cliente">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput
            v-bind="primaryPhoneBinds"
            type="tel"
            label="Teléfono principal"
            placeholder="999 888 777"
            :error="errors.primaryPhone"
            required
          />
          <FormInput
            v-bind="primaryEmailBinds"
            type="email"
            label="Email principal"
            placeholder="correo@ejemplo.com"
            :error="errors.primaryEmail"
          />
          <FormInput
            v-bind="secondaryPhoneBinds"
            type="tel"
            label="Teléfono secundario"
            placeholder="999 888 777"
            :error="errors.secondaryPhone"
          />
          <FormInput
            v-bind="secondaryEmailBinds"
            type="email"
            label="Email secundario"
            placeholder="correo@ejemplo.com"
            :error="errors.secondaryEmail"
          />
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Dirección"
        :subtitle="isBuyer ? 'Opcional para compradores; si la llenas, indica el distrito' : 'Domicilio de residencia o fiscal'"
      >
        <div class="grid grid-cols-1 gap-4 md:grid-cols-6">
          <FormInput
            v-bind="addressLineBinds"
            class="md:col-span-4"
            label="Dirección"
            placeholder="Av. Principal 123, Dpto. 501"
            :error="errors.addressLine"
            :required="!isBuyer"
          />
          <FormInput
            v-bind="referenceBinds"
            class="md:col-span-2"
            label="Referencia"
            placeholder="Frente al parque"
            :error="errors.reference"
          />
          <FormSelect
            v-bind="departmentIdBinds"
            class="md:col-span-2"
            label="Departamento"
            placeholder="Seleccionar"
            :options="departmentOptions"
            :loading="loadingDepartments"
            :error="errors.departmentId"
            :required="!isBuyer"
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
              :required="!isBuyer"
            />
          </template>
        </div>
      </FormSectionCard>
    </div>

    <!-- ── Lateral: seguimiento, notas y acciones (fijo en escritorio; en el modal va debajo) ── -->
    <aside :class="isModal ? 'space-y-5' : 'space-y-6 xl:sticky xl:top-24'">
      <FormSectionCard v-if="isBuyer" title="Seguimiento comercial" subtitle="Embudo, origen y asesor">
        <div class="space-y-4">
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
            label="Asesor asignado"
            placeholder="Sin asignar"
            :options="agentOptions"
            :loading="loadingAgents"
            :error="errors.assignedAgentId"
          />
        </div>
      </FormSectionCard>

      <FormSectionCard title="Notas" subtitle="Observaciones internas sobre el cliente">
        <FormTextarea
          v-bind="notesBinds"
          :placeholder="isBuyer ? 'Propiedad buscada, presupuesto, forma de pago...' : 'Datos del titular, segunda firma, acuerdos...'"
          :rows="5"
        />
      </FormSectionCard>

      <div
        v-if="!isModal"
        class="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3"
      >
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
