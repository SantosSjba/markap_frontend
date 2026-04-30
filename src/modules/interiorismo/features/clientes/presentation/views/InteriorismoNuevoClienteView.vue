<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import {
  useDocumentTypes,
  useDepartments,
  useProvinces,
  useDistricts,
  useCreateInteriorClient,
} from '../../application/useClients'
import type { DocumentType } from '../../domain/client.types'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'

const router = useRouter()
const appColor = 'var(--color-primary)'

const clientType = ref<'RESIDENTIAL' | 'CORPORATE'>('RESIDENTIAL')

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

const { data: documentTypes, isLoading: loadingDocs } = useDocumentTypes()
const { data: departments, isLoading: loadingDepartments } = useDepartments()
const { data: provinces, isLoading: loadingProvinces } = useProvinces(selectedDepartmentId)
const { data: districts, isLoading: loadingDistricts } = useDistricts(selectedProvinceId)
const createMutation = useCreateInteriorClient()

const loading = computed(() => loadingDocs.value || loadingDepartments.value)

watch(
  () => values.departmentId,
  () => {
    setFieldValue('provinceId', '')
    setFieldValue('districtId', '')
  },
)

watch(
  () => values.provinceId,
  () => {
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

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/clientes`)
const selectClientType = (type: 'RESIDENTIAL' | 'CORPORATE') => {
  clientType.value = type
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    const line = formValues.addressLine?.trim()
    const districtId = formValues.districtId?.trim()
    const payload = {
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
    await createMutation.mutateAsync(payload)
    await createMutation.invalidateList()
    router.push(`${INTERIORISMO_BASE_PATH}/clientes`)
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
          Registra DNI o RUC, datos de contacto y tipo residencial / corporativo
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
          Define si el trabajo es para hogar u organización
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            class="p-4 rounded-lg border-2 text-left transition-all"
            :style="{
              borderColor: clientType === 'RESIDENTIAL' ? appColor : 'var(--color-border)',
              color: clientType === 'RESIDENTIAL' ? appColor : 'var(--color-text-primary)',
            }"
            @click="selectClientType('RESIDENTIAL')"
          >
            <div class="flex items-center gap-3">
              <AppIcon icon="lucide:home" :size="32" color="currentColor" class="shrink-0" />
              <div>
                <span class="font-medium block">Residencial</span>
                <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                  Persona natural / vivienda
                </span>
              </div>
            </div>
          </button>
          <button
            type="button"
            class="p-4 rounded-lg border-2 text-left transition-all"
            :style="{
              borderColor: clientType === 'CORPORATE' ? appColor : 'var(--color-border)',
              color: clientType === 'CORPORATE' ? appColor : 'var(--color-text-primary)',
            }"
            @click="selectClientType('CORPORATE')"
          >
            <div class="flex items-center gap-3">
              <AppIcon icon="lucide:building-2" :size="32" color="currentColor" class="shrink-0" />
              <div>
                <span class="font-medium block">Corporativo</span>
                <span class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
                  Empresa u organización (RUC)
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
          Identificación
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
            label="Número (DNI / RUC)"
            placeholder="12345678 o 20XXXXXXXXX"
            :error="errors.documentNumber"
            required
          />
          <FormInput
            v-bind="fullNameBinds"
            class="md:col-span-2"
            label="Nombre completo / Razón social"
            placeholder="Nombre o empresa"
            :error="errors.fullName"
            required
          />
          <FormInput
            v-bind="legalRepresentativeNameBinds"
            label="Representante legal (si aplica)"
            placeholder="Nombre"
            :error="errors.legalRepresentativeName"
          />
          <FormInput
            v-bind="legalRepresentativePositionBinds"
            label="Cargo"
            placeholder="Gerencia"
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
            label="Teléfono principal"
            :error="errors.primaryPhone"
            required
          />
          <FormInput
            v-bind="secondaryPhoneBinds"
            type="tel"
            label="Teléfono secundario"
            :error="errors.secondaryPhone"
          />
          <FormInput
            v-bind="primaryEmailBinds"
            type="email"
            label="Email principal"
            :error="errors.primaryEmail"
            required
          />
          <FormInput
            v-bind="secondaryEmailBinds"
            type="email"
            label="Email secundario"
            :error="errors.secondaryEmail"
          />
        </div>
      </section>

      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Dirección (opcional)
        </h2>
        <p class="text-sm mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Si completas calle y distrito, se guarda como dirección fiscal / de obra.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            v-bind="addressLineBinds"
            class="md:col-span-2"
            label="Dirección"
            placeholder="Av. …"
            :error="errors.addressLine"
          />
          <FormSelect
            v-bind="departmentIdBinds"
            label="Departamento"
            placeholder="Seleccionar"
            :options="departmentOptions"
            :loading="loadingDepartments"
          />
          <FormSelect
            v-bind="provinceIdBinds"
            label="Provincia"
            placeholder="Seleccionar"
            :options="provinceOptions"
            :loading="loadingProvinces"
            :disabled="!values.departmentId"
          />
          <FormSelect
            v-bind="districtIdBinds"
            label="Distrito"
            placeholder="Seleccionar"
            :options="districtOptions"
            :loading="loadingDistricts"
            :disabled="!values.provinceId"
            :error="errors.districtId"
          />
          <FormInput
            v-bind="referenceBinds"
            class="md:col-span-2"
            label="Referencia"
            placeholder="Frente a …"
          />
        </div>
      </section>

      <section
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Notas internas
        </h2>
        <FormTextarea
          v-bind="notesBinds"
          label="Observaciones del equipo"
          placeholder="Preferencias, restricciones, acuerdos…"
          :rows="4"
        />
      </section>

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
          Guardar
        </BaseButton>
      </div>
    </form>
  </div>
</template>
