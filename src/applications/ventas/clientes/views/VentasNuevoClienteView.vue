<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/forms'
import {
  useVentasClientDocumentTypes,
  useVentasCreateClient,
} from '../composables/useVentasClients'
import { useVentasAgentsList } from '@applications/ventas/agentes/composables/useAgents'
import type { VentasDocumentType } from '../services/clients.service'
import { VENTAS_LEAD_ORIGIN_OPTIONS, VENTAS_SALES_STATUS_OPTIONS } from '../constants/leadOrigins'
import type { VentasLeadOriginCode } from '../constants/leadOrigins'

const router = useRouter()
const appColor = 'var(--color-primary)'

const schema = yup.object({
  documentTypeId: yup.string().required('Seleccione el tipo de documento'),
  documentNumber: yup.string().required('El DNI / documento es requerido').trim(),
  fullName: yup.string().required('El nombre es requerido').trim(),
  legalRepresentativeName: yup.string().trim(),
  legalRepresentativePosition: yup.string().trim(),
  primaryPhone: yup.string().required('El teléfono es requerido').trim(),
  secondaryPhone: yup.string().trim(),
  primaryEmail: yup
    .string()
    .required('El email es requerido')
    .email('Email inválido')
    .trim(),
  secondaryEmail: yup
    .string()
    .trim()
    .transform((v) => (v === '' ? undefined : v))
    .email('Email inválido')
    .optional(),
  salesStatus: yup
    .string()
    .oneOf(['PROSPECT', 'INTERESTED', 'CLIENT'])
    .required('Seleccione el estado del cliente'),
  leadOrigin: yup.string().required('Seleccione el origen del lead'),
  assignedAgentId: yup.string().trim(),
  notes: yup.string().trim(),
})

const { handleSubmit, errors, defineComponentBinds } = useForm({
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
    salesStatus: 'PROSPECT' as const,
    leadOrigin: '' as VentasLeadOriginCode | '',
    assignedAgentId: '',
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
const salesStatusBinds = defineComponentBinds('salesStatus')
const leadOriginBinds = defineComponentBinds('leadOrigin')
const assignedAgentIdBinds = defineComponentBinds('assignedAgentId')
const notesBinds = defineComponentBinds('notes')

const { data: documentTypes, isLoading: loadingDocs } = useVentasClientDocumentTypes()
const createMutation = useVentasCreateClient()

const agentsListParams = ref({
  page: 1,
  limit: 500,
  isActive: true,
})
const { data: agentsResult, isLoading: loadingAgents } = useVentasAgentsList(agentsListParams)

const loading = computed(() => loadingDocs.value || loadingAgents.value)

const documentTypeOptions = computed(() =>
  (documentTypes.value ?? []).map((d: VentasDocumentType) => ({
    value: d.id,
    label: `${d.name} (${d.code})`,
  })),
)

const agentOptions = computed(() => [
  { value: '', label: 'Sin asignar' },
  ...(agentsResult.value?.data ?? []).map((a) => ({
    value: a.id,
    label: a.fullName,
  })),
])

const goBack = () => router.push('/ventas/clientes')

const onSubmit = handleSubmit(async (formValues) => {
  try {
    await createMutation.mutateAsync({
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
      salesStatus: formValues.salesStatus,
      leadOrigin: formValues.leadOrigin || null,
      assignedAgentId: formValues.assignedAgentId?.trim() || null,
    })
    router.push('/ventas/clientes')
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
          Registra un lead o comprador en ventas
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
            placeholder="Nombre del lead o comprador"
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
            placeholder="correo@ejemplo.com"
            :error="errors.primaryEmail"
            required
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
          placeholder="Detalle de interés, presupuesto, propiedad buscada..."
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
