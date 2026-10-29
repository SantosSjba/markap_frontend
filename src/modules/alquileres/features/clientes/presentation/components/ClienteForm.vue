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
  useDocumentTypes,
  useDepartments,
  useProvinces,
  useDistricts,
} from '../composables/useClients'
import {
  UBIGEO_OTHER_DEPARTMENT_ID,
  UBIGEO_OTHER_DISTRICT_ID,
  buildLocationCustomPayload,
  mergeDepartmentOptions,
} from '@shared/domain/ubigeo-other'
import { useClientAddressUbigeo } from '@shared/presentation/composables/useClientAddressUbigeo'
import type { ClientDetail, ClientFormPayload, DocumentType } from '../../domain/client.types'
/**
 * ClienteForm — formulario único de alta/edición de clientes de alquileres
 * (propietario / inquilino). La vista decide qué hacer con el payload emitido.
 * `variant="modal"`: una sola columna sin botones propios; el modal los pone en su pie fijo
 * y envía el formulario con `form="<formId>"`.
 */

type ClientType = 'OWNER' | 'TENANT'

interface Props {
  /** Cliente a editar; sin él, el formulario arranca vacío (alta) */
  initial?: ClientDetail | null
  defaultClientType?: ClientType
  submitLabel: string
  submitting?: boolean
  canWrite?: boolean
  variant?: 'page' | 'modal'
  /** Oculta el selector de tipo y usa `defaultClientType` (ej. alta de propietario) */
  lockClientType?: boolean
  /** id del `<form>`, para enviarlo desde un botón externo (pie del modal) */
  formId?: string
}

const props = withDefaults(defineProps<Props>(), {
  initial: null,
  defaultClientType: 'OWNER',
  submitting: false,
  canWrite: true,
  variant: 'page',
  lockClientType: false,
  formId: undefined,
})

const isModal = computed(() => props.variant === 'modal')

const emit = defineEmits<{
  submit: [payload: ClientFormPayload]
  cancel: []
}>()

/** Documentos numéricos: se fuerza teclado numérico y solo dígitos */
const NUMERIC_DOCUMENT_CODES = ['DNI', 'RUC']

const clientType = ref<ClientType>(props.defaultClientType)
watch(
  () => props.defaultClientType,
  (t) => {
    if (!props.initial) clientType.value = t
  },
)

const { data: documentTypes, isLoading: loadingDocs } = useDocumentTypes()
function findDocumentType(id: string | undefined): DocumentType | undefined {
  return (documentTypes.value ?? []).find((d) => d.id === id)
}

const schema = yup.object({
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
  primaryPhone: yup.string().required('El teléfono principal es requerido').trim(),
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
    then: (s) => s.required('Indique el distrito').trim(),
    otherwise: (s) => s.trim(),
  }),
  reference: yup.string().trim(),
  notes: yup.string().trim(),
})

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
  validationSchema: toTypedSchema(schema),
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
const { data: departments, isLoading: loadingDepartments } = useDepartments()
const { data: provinces, isLoading: loadingProvinces } = useProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } = useDistricts(selectedProvinceId)

const loading = computed(() => loadingDocs.value || loadingDepartments.value)

const documentTypeOptions = computed(() =>
  (documentTypes.value ?? []).map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
)
const departmentOptions = computed(() => mergeDepartmentOptions(departments.value))
const provinceOptions = computed(() =>
  (provinces.value ?? []).map((p) => ({ value: p.id, label: p.name })),
)
const districtOptions = computed(() =>
  (districts.value ?? []).map((d) => ({ value: d.id, label: d.name })),
)

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
  return doc?.length ? `${doc.length} ${NUMERIC_DOCUMENT_CODES.includes(doc.code) ? 'dígitos' : 'caracteres'}` : undefined
})

watch(
  () => props.initial,
  (c) => {
    if (!c) return
    isInitializing.value = true
    if (c.clientType !== 'BUYER') clientType.value = c.clientType
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
        addressLine: c.primaryAddress?.addressLine ?? '',
        departmentId: c.primaryAddress?.district?.province?.department?.id ?? '',
        provinceId: c.primaryAddress?.district?.province?.id ?? '',
        districtId: c.primaryAddress?.districtId ?? '',
        locationCountry: c.primaryAddress?.locationCustom?.country ?? '',
        locationDepartment: c.primaryAddress?.locationCustom?.department ?? '',
        locationProvince: c.primaryAddress?.locationCustom?.province ?? '',
        locationDistrict: c.primaryAddress?.locationCustom?.district ?? '',
        reference: c.primaryAddress?.reference ?? '',
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
    address: {
      addressLine: v.addressLine.trim(),
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
            { value: 'OWNER', label: 'Propietario', description: 'Dueño de propiedad en administración', icon: 'lucide:building-2' },
            { value: 'TENANT', label: 'Inquilino', description: 'Persona que alquila una propiedad', icon: 'lucide:user' },
          ]"
          @update:model-value="clientType = $event as ClientType"
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

      <FormSectionCard title="Dirección" subtitle="Domicilio de residencia o fiscal">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-6">
          <FormInput
            v-bind="addressLineBinds"
            class="md:col-span-4"
            label="Dirección"
            placeholder="Av. Principal 123, Dpto. 501"
            :error="errors.addressLine"
            required
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
    </div>

    <!-- ── Modal: solo notas; las acciones van en el pie fijo del modal ── -->
    <FormTextarea
      v-if="isModal"
      v-bind="notesBinds"
      label="Notas"
      placeholder="Preferencias, acuerdos, historial relevante..."
      :rows="3"
    />

    <!-- ── Lateral: notas + acciones (fijo en escritorio) ── -->
    <aside v-else class="space-y-6 xl:sticky xl:top-24">
      <FormSectionCard title="Notas" subtitle="Observaciones internas sobre el cliente">
        <FormTextarea
          v-bind="notesBinds"
          placeholder="Preferencias, acuerdos, historial relevante..."
          :rows="5"
        />
      </FormSectionCard>

      <div
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
        <BaseButton variant="outline" type="button" block @click="emit('cancel')">
          Cancelar
        </BaseButton>
        <p class="text-center text-theme-xs text-gray-400 dark:text-gray-500">
          Los campos con <span class="text-error-500">*</span> son obligatorios
        </p>
      </div>
    </aside>
  </form>
</template>
