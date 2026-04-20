<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import {
  useClient,
  useDocumentTypes,
  useDepartments,
  useProvinces,
  useDistricts,
  useUpdateClient,
} from '../../application/useClients'
import type { DocumentType } from '../../domain/client.types'

const route = useRoute()
const router = useRouter()
const appColor = 'var(--color-primary)'

const id = computed(() => String(route.params.id ?? ''))

const clientType = ref<'OWNER' | 'TENANT'>('OWNER')
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
  addressLine: yup.string().required('La dirección es requerida').trim(),
  departmentId: yup.string().trim(),
  provinceId: yup.string().trim(),
  districtId: yup.string().required('Seleccione el distrito'),
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
const notesBinds = defineComponentBinds('notes')

const selectedDepartmentId = computed(() => values.departmentId || undefined)
const selectedProvinceId = computed(() => values.provinceId || undefined)

const { data: client, isLoading: loadingClient, isError: clientError } = useClient(id)
const { data: documentTypes, isLoading: loadingDocs } = useDocumentTypes()
const { data: departments, isLoading: loadingDepartments } = useDepartments()
const { data: provinces, isLoading: loadingProvinces } = useProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } = useDistricts(selectedProvinceId)
const updateMutation = useUpdateClient()

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
  }))
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

watch(
  client,
  (c) => {
    if (!c) return
    if (c.clientType === 'BUYER') {
      void router.replace('/alquileres/clientes')
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
    if (isErr) router.replace('/alquileres/clientes')
  }
)

const goBack = () => router.push('/alquileres/clientes')
const selectClientType = (type: 'OWNER' | 'TENANT') => {
  clientType.value = type
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    await updateMutation.mutateAsync({
      id: id.value,
      data: {
        clientType: clientType.value,
        documentTypeId: formValues.documentTypeId,
        documentNumber: formValues.documentNumber.trim(),
        fullName: formValues.fullName.trim(),
        legalRepresentativeName: formValues.legalRepresentativeName?.trim() || null,
        legalRepresentativePosition:
          formValues.legalRepresentativePosition?.trim() || null,
        primaryPhone: formValues.primaryPhone.trim(),
        secondaryPhone: formValues.secondaryPhone?.trim() || null,
        primaryEmail: formValues.primaryEmail.trim(),
        secondaryEmail: formValues.secondaryEmail?.trim() || null,
        notes: formValues.notes?.trim() || null,
        address: {
          addressLine: formValues.addressLine.trim(),
          districtId: formValues.districtId,
          reference: formValues.reference?.trim() || null,
        },
      },
    })
    await updateMutation.invalidateList()
    router.push('/alquileres/clientes')
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
          Editar Cliente
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Modificar datos del cliente
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <AppIcon icon="line-md:loading-loop" :size="32" :color="appColor" />
    </div>

    <form v-else-if="client" @submit.prevent="onSubmit" class="space-y-8">
      <!-- Tipo de Cliente -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Tipo de Cliente
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Selecciona el tipo de cliente
        </p>
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
      </section>

      <!-- Información Personal -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Información Personal
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Datos básicos del cliente
        </p>
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
      </section>

      <!-- Información de Contacto -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Información de Contacto
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Datos para comunicación
        </p>
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
            label="Email Principal"
            placeholder="correo@ejemplo.com"
            :error="errors.primaryEmail"
            required
          />
          <FormInput
            v-bind="secondaryEmailBinds"
            type="email"
            label="Email Secundario"
            placeholder="correo@ejemplo.com"
            :error="errors.secondaryEmail"
          />
        </div>
      </section>

      <!-- Dirección -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Dirección
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Dirección de residencia o fiscal
        </p>
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
      </section>

      <!-- Notas Adicionales -->
      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Notas Adicionales
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Información relevante sobre el cliente
        </p>
        <FormTextarea
          v-bind="notesBinds"
          label="Notas"
          placeholder="Notas, observaciones, preferencias del cliente..."
          :rows="4"
        />
      </section>

      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="goBack">
          Cancelar
        </BaseButton>
        <BaseButton type="submit" :loading="updateMutation.isPending.value" variant="primary">
          <AppIcon
            v-if="!updateMutation.isPending.value"
            icon="lucide:save"
            :size="20"
            color="currentColor"
          />
          Guardar Cambios
        </BaseButton>
      </div>
    </form>
  </div>
</template>
