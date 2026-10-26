<script setup lang="ts">
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import {
  useArquitecturaClient,
  useDocumentTypes,
  useDepartments,
  useProvinces,
  useDistricts,
  useUpdateArquitecturaClient,
} from '../composables/useClients'
import type { DocumentType, UpdateArquitecturaClientPayload } from '../../domain/client.types'
import { ARQUITECTURA_BASE_PATH } from '../../../../config/routes.constants'
import OptionCardGroup from '@shared/presentation/components/forms/OptionCardGroup.vue'
const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const clientType = ref<'RESIDENTIAL' | 'CORPORATE'>('RESIDENTIAL')
const isInitializing = ref(false)

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
    .required('El email principal es requerido')
    .email('Email inválido')
    .trim(),
  secondaryEmail: yup
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .email('Email inválido')
    .optional(),
  addressLine: yup.string().trim(),
  departmentId: yup.string().trim(),
  provinceId: yup.string().trim(),
  districtId: yup.string().trim(),
  reference: yup.string().trim(),
  notes: yup.string().trim(),
})

const { values, handleSubmit, errors, defineComponentBinds, setFieldValue, resetForm } = useForm({
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
const referenceBinds = defineComponentBinds('reference')
const notesBinds = defineComponentBinds('notes')

const selectedDepartmentId = computed(() => values.departmentId || undefined)
const selectedProvinceId = computed(() => values.provinceId || undefined)

const { data: client, isLoading: loadingClient, isError: clientError } = useArquitecturaClient(id)
const { data: documentTypes, isLoading: loadingDocs } = useDocumentTypes()
const { data: departments, isLoading: loadingDepartments } = useDepartments()
const { data: provinces, isLoading: loadingProvinces } = useProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } = useDistricts(selectedProvinceId)
const updateMutation = useUpdateArquitecturaClient()

const loading = computed(() => loadingClient.value || loadingDocs.value || loadingDepartments.value)

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

const documentTypeOptions = computed(() =>
  (documentTypes.value ?? []).map((d: DocumentType) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  })),
)
const departmentOptions = computed(() =>
  (departments.value ?? []).map((d) => ({ value: d.id, label: d.name })),
)
const provinceOptions = computed(() =>
  (provinces.value ?? []).map((p) => ({ value: p.id, label: p.name })),
)
const districtOptions = computed(() =>
  (districts.value ?? []).map((d) => ({ value: d.id, label: d.name })),
)

watch(
  client,
  (c) => {
    if (!c) return
    if (c.clientType !== 'RESIDENTIAL' && c.clientType !== 'CORPORATE') {
      void router.replace(`${ARQUITECTURA_BASE_PATH}/clientes`)
      return
    }
    isInitializing.value = true
    clientType.value = c.clientType
    resetForm({
      values: {
        documentTypeId: c.documentTypeId,
        documentNumber: c.documentNumber,
        fullName: c.fullName,
        legalRepresentativeName: c.legalRepresentativeName ?? '',
        legalRepresentativePosition: c.legalRepresentativePosition ?? '',
        primaryPhone: c.primaryPhone,
        secondaryPhone: c.secondaryPhone ?? '',
        primaryEmail: c.primaryEmail,
        secondaryEmail: c.secondaryEmail ?? '',
        addressLine: c.primaryAddress?.addressLine ?? '',
        departmentId: c.primaryAddress?.district?.province?.department?.id ?? '',
        provinceId: c.primaryAddress?.district?.province?.id ?? '',
        districtId: c.primaryAddress?.districtId ?? '',
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

watch(
  () => clientError.value,
  (isErr) => {
    if (isErr) void router.replace(`${ARQUITECTURA_BASE_PATH}/clientes`)
  },
)

const goBack = () => router.push(`${ARQUITECTURA_BASE_PATH}/clientes`)
const selectClientType = (type: 'RESIDENTIAL' | 'CORPORATE') => {
  clientType.value = type
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    const line = formValues.addressLine?.trim()
    const districtId = formValues.districtId?.trim()
    const data: UpdateArquitecturaClientPayload = {
      clientType: clientType.value,
      documentTypeId: formValues.documentTypeId,
      documentNumber: formValues.documentNumber.trim(),
      fullName: formValues.fullName.trim(),
      legalRepresentativeName: formValues.legalRepresentativeName?.trim() || null,
      legalRepresentativePosition: formValues.legalRepresentativePosition?.trim() || null,
      primaryPhone: formValues.primaryPhone.trim(),
      secondaryPhone: formValues.secondaryPhone?.trim() || null,
      primaryEmail: formValues.primaryEmail.trim(),
      secondaryEmail: formValues.secondaryEmail?.trim() || null,
      notes: formValues.notes?.trim() || null,
      ...(line && districtId
        ? {
            address: {
              addressLine: line,
              districtId,
              reference: formValues.reference?.trim() || null,
            },
          }
        : {}),
    }
    await updateMutation.mutateAsync({ id: id.value, data })
    await updateMutation.invalidateList()
    router.push(`${ARQUITECTURA_BASE_PATH}/clientes/${id.value}`)
  } catch {
    void 0
  }
})
</script>

<template>
  <div >
    <PageHeader
      title="Editar cliente"
      subtitle="Actualiza datos de identificación y contacto"
      back
      @back="goBack"
      class="mb-6"
    />

    <LoadingState v-if="loading" class="py-12" />

    <form v-else-if="client" @submit.prevent="onSubmit" class="space-y-8">
      <FormSectionCard
        title="Tipo de cliente"
        dense
      >
        <OptionCardGroup
          :model-value="clientType"
          :options="[
            { value: 'RESIDENTIAL', label: 'Residencial' },
            { value: 'CORPORATE', label: 'Corporativo' },
          ]"
          @update:model-value="selectClientType($event as 'RESIDENTIAL' | 'CORPORATE')"
        />
      </FormSectionCard>

      <FormSectionCard
        title="Identificación"
        dense
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            v-bind="documentTypeIdBinds"
            label="Tipo de documento"
            :options="documentTypeOptions"
            :error="errors.documentTypeId"
            required
          />
          <FormInput
            v-bind="documentNumberBinds"
            label="Número (DNI / RUC)"
            :error="errors.documentNumber"
            required
          />
          <FormInput
            v-bind="fullNameBinds"
            class="md:col-span-2"
            label="Nombre / Razón social"
            :error="errors.fullName"
            required
          />
          <FormInput
            v-bind="legalRepresentativeNameBinds"
            label="Representante legal"
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
        dense
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput v-bind="primaryPhoneBinds" type="tel" label="Teléfono principal" :error="errors.primaryPhone" required />
          <FormInput v-bind="secondaryPhoneBinds" type="tel" label="Teléfono secundario" :error="errors.secondaryPhone" />
          <FormInput v-bind="primaryEmailBinds" type="email" label="Email principal" :error="errors.primaryEmail" required />
          <FormInput v-bind="secondaryEmailBinds" type="email" label="Email secundario" :error="errors.secondaryEmail" />
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Dirección (opcional)"
        dense
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <FormInput v-bind="addressLineBinds" class="md:col-span-2" label="Dirección" :error="errors.addressLine" />
          <FormSelect
            v-bind="departmentIdBinds"
            label="Departamento"
            :options="departmentOptions"
            :loading="loadingDepartments"
          />
          <FormSelect
            v-bind="provinceIdBinds"
            label="Provincia"
            :options="provinceOptions"
            :loading="loadingProvinces"
            :disabled="!values.departmentId"
          />
          <FormSelect
            v-bind="districtIdBinds"
            label="Distrito"
            :options="districtOptions"
            :loading="loadingDistricts"
            :disabled="!values.provinceId"
            :error="errors.districtId"
          />
          <FormInput v-bind="referenceBinds" class="md:col-span-2" label="Referencia" />
        </div>
      </FormSectionCard>

      <FormSectionCard
        title="Notas internas"
        dense
      >
        <FormTextarea v-bind="notesBinds" label="Observaciones" :rows="4" />
      </FormSectionCard>

      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="goBack">Cancelar</BaseButton>
        <BaseButton type="submit" :loading="updateMutation.isPending.value" variant="primary">
          <AppIcon v-if="!updateMutation.isPending.value" icon="lucide:save" :size="20" color="currentColor" />
          Guardar
        </BaseButton>
      </div>
    </form>
  </div>
</template>
