<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import { BaseButton, FormSectionCard } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import { useDocumentTypes, useDepartments, useProvinces, useDistricts, useCreateClient } from '../../application/useClients'
import {
  UBIGEO_OTHER_DEPARTMENT_ID,
  UBIGEO_OTHER_DISTRICT_ID,
  buildLocationCustomPayload,
  mergeDepartmentOptions,
} from '../../constants/ubigeo-other'
import { useClientAddressUbigeo } from '../../composables/useClientAddressUbigeo'
import { navigateAfterAlquileresSave } from '@modules/alquileres/application'
import type { DocumentType } from '../../domain/client.types'

const route = useRoute()
const router = useRouter()
const appColor = 'var(--color-primary)'

const clientType = ref<'OWNER' | 'TENANT'>('OWNER')

/** returnTo: path para volver tras registrar (ej. /alquileres/propiedades/nueva) */
const returnTo = computed(() => {
  const t = route.query.returnTo
  return typeof t === 'string' ? t : ''
})

onMounted(() => {
  const q = route.query.clientType
  if (q === 'OWNER' || q === 'TENANT') clientType.value = q
})

const schema = yup.object({
  documentTypeId: yup.string().required('Seleccione el tipo de documento'),
  documentNumber: yup.string().required('El número de documento es requerido').trim(),
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

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue } = useForm({
  validationSchema: toTypedSchema(schema),
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
const addressLineBinds = defineComponentBinds('addressLine')
const departmentIdBinds = defineComponentBinds('departmentId')
const provinceIdBinds = defineComponentBinds('provinceId')
const districtIdBinds = defineComponentBinds('districtId')
const locationCountryBinds = defineComponentBinds('locationCountry')
const locationDepartmentBinds = defineComponentBinds('locationDepartment')
const locationProvinceBinds = defineComponentBinds('locationProvince')
const locationDistrictBinds = defineComponentBinds('locationDistrict')
const notesBinds = defineComponentBinds('notes')

const selectedDepartmentId = computed(() => values.departmentId || undefined)
const selectedProvinceId = computed(() => values.provinceId || undefined)

const { isOtherLocation } = useClientAddressUbigeo({
  values,
  setFieldValue,
})

const { data: documentTypes, isLoading: loadingDocs } = useDocumentTypes()
const { data: departments, isLoading: loadingDepartments } = useDepartments()
const { data: provinces, isLoading: loadingProvinces } = useProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } = useDistricts(selectedProvinceId)
const createMutation = useCreateClient()

const loading = computed(() => loadingDocs.value || loadingDepartments.value)

const documentTypeOptions = computed(() =>
  (documentTypes.value ?? []).map((d: DocumentType) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  }))
)
const departmentOptions = computed(() => mergeDepartmentOptions(departments.value))
const provinceOptions = computed(() =>
  (provinces.value ?? []).map((p) => ({ value: p.id, label: p.name }))
)
const districtOptions = computed(() =>
  (districts.value ?? []).map((d) => ({ value: d.id, label: d.name }))
)

const goBack = () => {
  if (returnTo.value) router.push(returnTo.value)
  else router.push('/alquileres/clientes')
}
const selectClientType = (type: 'OWNER' | 'TENANT') => {
  clientType.value = type
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    const data = await createMutation.mutateAsync({
      applicationSlug: 'alquileres',
      clientType: clientType.value,
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
            : (formValues.districtId as string),
        reference: formValues.reference?.trim() || null,
        ...(formValues.departmentId === UBIGEO_OTHER_DEPARTMENT_ID
          ? {
              locationCustom: buildLocationCustomPayload({
                locationCountry: formValues.locationCountry ?? '',
                locationDepartment: formValues.locationDepartment ?? '',
                locationProvince: formValues.locationProvince ?? '',
                locationDistrict: formValues.locationDistrict ?? '',
              }),
            }
          : {}),
      },
    })
    const tenantIndex = route.query.tenantIndex
    const returnQuery =
      returnTo.value && data?.id
        ? {
            selectedClientId: data.id,
            ...(typeof tenantIndex === 'string' && tenantIndex !== ''
              ? { tenantIndex }
              : {}),
          }
        : undefined

    await navigateAfterAlquileresSave(router, {
      listPath: '/alquileres/clientes',
      returnTo: returnTo.value && data?.id ? returnTo.value : undefined,
      returnQuery,
      invalidate: () => createMutation.invalidateList(),
    })
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
          Nuevo Cliente
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Registrar un nuevo propietario o inquilino
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <AppIcon icon="line-md:loading-loop" :size="32" :color="appColor" />
    </div>

    <form v-else @submit.prevent="onSubmit" class="space-y-8">
      <FormSectionCard
        title="Tipo de Cliente"
        subtitle="Selecciona el tipo de cliente a registrar"
        icon="lucide:users"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            class="p-4 rounded-lg border-2 text-left transition-all"
            :style="{
              borderColor: clientType === 'OWNER' ? appColor : 'var(--color-border)',
              color: clientType === 'OWNER' ? appColor : 'var(--color-text-primary)',
            }"
            @click="selectClientType('OWNER')"
          >
            <div class="flex items-center gap-3">
              <AppIcon icon="lucide:building-2" :size="32" color="currentColor" class="shrink-0" />
              <div>
                <span class="font-medium block">Propietario</span>
                <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                  Dueño de propiedad en administración
                </span>
              </div>
            </div>
          </button>
          <button
            type="button"
            class="p-4 rounded-lg border-2 text-left transition-all"
            :style="{
              borderColor: clientType === 'TENANT' ? appColor : 'var(--color-border)',
              color: clientType === 'TENANT' ? appColor : 'var(--color-text-primary)',
            }"
            @click="selectClientType('TENANT')"
          >
            <div class="flex items-center gap-3">
              <AppIcon icon="lucide:user" :size="32" color="currentColor" class="shrink-0" />
              <div>
                <span class="font-medium block">Inquilino</span>
                <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                  Persona que alquila una propiedad
                </span>
              </div>
            </div>
          </button>
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Información Personal"
        subtitle="Datos básicos del cliente"
        icon="lucide:id-card"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            v-bind="documentTypeIdBinds"
            label="Tipo de Documento"
            placeholder="Seleccionar"
            :options="documentTypeOptions"
            :error="errors.documentTypeId"
            required
          />
          <FormInput
            v-bind="documentNumberBinds"
            label="Número de Documento"
            placeholder="12345678"
            :error="errors.documentNumber"
            required
          />
          <FormInput
            v-bind="fullNameBinds"
            class="md:col-span-2"
            label="Nombre Completo / Razón Social"
            placeholder="Juan Pérez / Empresa SAC"
            :error="errors.fullName"
            required
          />
          <FormInput
            v-bind="legalRepresentativeNameBinds"
            label="Representante Legal (si aplica)"
            placeholder="Nombre del representante"
            :error="errors.legalRepresentativeName"
          />
          <FormInput
            v-bind="legalRepresentativePositionBinds"
            label="Cargo"
            placeholder="Gerente General"
            :error="errors.legalRepresentativePosition"
          />
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Información de Contacto"
        subtitle="Datos para comunicación"
        icon="lucide:phone"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-bind="primaryPhoneBinds"
            type="tel"
            label="Teléfono Principal"
            placeholder="999-888-777"
            :error="errors.primaryPhone"
            required
          />
          <FormInput
            v-bind="secondaryPhoneBinds"
            type="tel"
            label="Teléfono Secundario"
            placeholder="999-888-777"
            :error="errors.secondaryPhone"
          />
          <FormInput
            v-bind="primaryEmailBinds"
            type="email"
            label="Email principal (opcional)"
            placeholder="correo@ejemplo.com"
            :error="errors.primaryEmail"
          />
          <FormInput
            v-bind="secondaryEmailBinds"
            type="email"
            label="Email Secundario"
            placeholder="correo@ejemplo.com"
            :error="errors.secondaryEmail"
          />
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Dirección"
        subtitle="Dirección de residencia o fiscal"
        icon="lucide:map-pin"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-bind="addressLineBinds"
            class="md:col-span-2"
            label="Dirección"
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
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Notas Adicionales"
        subtitle="Información relevante sobre el cliente"
        icon="lucide:notebook-pen"
      >
        <FormTextarea
          v-bind="notesBinds"
          label="Notas"
          placeholder="Notas, observaciones, preferencias del cliente..."
          :rows="4"
        />
      </FormSectionCard>

      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="goBack">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" :loading="createMutation.isPending.value" variant="primary">
          <AppIcon
            v-if="!createMutation.isPending.value"
            icon="lucide:save"
            :size="20"
            color="currentColor"
          />
          Guardar Cliente
        </BaseButton>
      </div>
    </form>
  </div>
</template>
