<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import { apiClient } from '@core/api/apiClient'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'
import { useInteriorClientsList } from '@modules/interiorismo/features/clientes'
import { useCreateInteriorProject } from '../../application/useInteriorProjects'
import type { InteriorProjectStatus, InteriorProjectType } from '../../domain/project.types'
import type {
  ClientListItem,
  ListClientsParams,
} from '@modules/interiorismo/features/clientes/domain/client.types'
import { PROJECT_TYPE_LABELS } from '../labels'
import { useInteriorProjectStageOptions } from '../../application/useInteriorProjectStageOptions'

const router = useRouter()

const listClientsParams = ref<ListClientsParams>({
  applicationSlug: INTERIORISMO_APP_SLUG,
  page: 1,
  limit: 500,
})
const { data: clientsRes, isLoading: loadingClients } = useInteriorClientsList(listClientsParams)

const { data: agentsRes, isLoading: loadingAgents } = useQuery({
  queryKey: ['agents', INTERIORISMO_APP_SLUG, 'interior-pick'],
  queryFn: async () => {
    const { data } = await apiClient.get<{ data: { id: string; fullName: string }[] }>('/agents', {
      params: { applicationSlug: INTERIORISMO_APP_SLUG, limit: 500, page: 1 },
    })
    return data
  },
})

const clientOptions = computed(() =>
  (clientsRes.value?.data ?? []).map((c: ClientListItem) => ({
    value: c.id,
    label: `${c.fullName} (${c.documentNumber})`,
  })),
)

const agentOptions = computed(() =>
  (agentsRes.value?.data ?? []).map((a) => ({
    value: a.id,
    label: a.fullName,
  })),
)

const typeOptions = computed(() =>
  (Object.keys(PROJECT_TYPE_LABELS) as InteriorProjectType[]).map((k) => ({
    value: k,
    label: PROJECT_TYPE_LABELS[k],
  })),
)

const { formOptions: statusOptions } = useInteriorProjectStageOptions()

const schema = yup.object({
  code: yup.string().required('Ingrese el código').trim(),
  name: yup.string().required('Ingrese el nombre').trim(),
  clientId: yup.string().required('Seleccione el cliente'),
  projectType: yup.string().required(),
  status: yup.string().required(),
  addressLine: yup.string().trim(),
  areaSqm: yup.number().nullable(),
  levelsCount: yup.number().integer().nullable(),
  environmentsNote: yup.string().trim(),
  startDate: yup.string().trim(),
  estimatedEndDate: yup.string().trim(),
  designerAgentId: yup.string().trim(),
  architectAgentId: yup.string().trim(),
  supervisorAgentId: yup.string().trim(),
  commercialAgentId: yup.string().trim(),
  estimatedBudget: yup.number().nullable(),
  projectedCost: yup.number().nullable(),
  expectedMargin: yup.number().nullable(),
})

const { handleSubmit, errors, defineComponentBinds } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    code: '',
    name: '',
    clientId: '',
    projectType: 'INTERIOR_DESIGN' as InteriorProjectType,
    status: 'DESIGN' as InteriorProjectStatus,
    addressLine: '',
    areaSqm: undefined as number | undefined,
    levelsCount: undefined as number | undefined,
    environmentsNote: '',
    startDate: '',
    estimatedEndDate: '',
    designerAgentId: '',
    architectAgentId: '',
    supervisorAgentId: '',
    commercialAgentId: '',
    estimatedBudget: undefined as number | undefined,
    projectedCost: undefined as number | undefined,
    expectedMargin: undefined as number | undefined,
  },
})

const codeB = defineComponentBinds('code')
const nameB = defineComponentBinds('name')
const clientIdB = defineComponentBinds('clientId')
const projectTypeB = defineComponentBinds('projectType')
const statusB = defineComponentBinds('status')
const addressLineB = defineComponentBinds('addressLine')
const areaSqmB = defineComponentBinds('areaSqm')
const levelsCountB = defineComponentBinds('levelsCount')
const environmentsNoteB = defineComponentBinds('environmentsNote')
const startDateB = defineComponentBinds('startDate')
const estimatedEndDateB = defineComponentBinds('estimatedEndDate')
const designerB = defineComponentBinds('designerAgentId')
const architectB = defineComponentBinds('architectAgentId')
const supervisorB = defineComponentBinds('supervisorAgentId')
const commercialB = defineComponentBinds('commercialAgentId')
const estimatedBudgetB = defineComponentBinds('estimatedBudget')
const projectedCostB = defineComponentBinds('projectedCost')
const expectedMarginB = defineComponentBinds('expectedMargin')

const createMut = useCreateInteriorProject()

const loading = computed(() => loadingClients.value || loadingAgents.value)

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/proyectos`)

const emptyToUndef = (s: string | undefined | null) =>
  s?.trim() ? s.trim() : undefined

const onSubmit = handleSubmit(async (v) => {
  try {
    const created = await createMut.mutateAsync({
      code: v.code,
      name: v.name,
      clientId: v.clientId,
      projectType: v.projectType as InteriorProjectType,
      status: v.status as InteriorProjectStatus,
      addressLine: emptyToUndef(v.addressLine) ?? null,
      areaSqm: v.areaSqm ?? null,
      levelsCount: v.levelsCount ?? null,
      environmentsNote: emptyToUndef(v.environmentsNote) ?? null,
      startDate: emptyToUndef(v.startDate) ?? null,
      estimatedEndDate: emptyToUndef(v.estimatedEndDate) ?? null,
      designerAgentId: emptyToUndef(v.designerAgentId) ?? null,
      architectAgentId: emptyToUndef(v.architectAgentId) ?? null,
      supervisorAgentId: emptyToUndef(v.supervisorAgentId) ?? null,
      commercialAgentId: emptyToUndef(v.commercialAgentId) ?? null,
      estimatedBudget: v.estimatedBudget ?? null,
      projectedCost: v.projectedCost ?? null,
      expectedMargin: v.expectedMargin ?? null,
    })
    router.push(`${INTERIORISMO_BASE_PATH}/proyectos/${created.id}`)
  } catch {
    void 0
  }
})
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1100px] mx-auto space-y-8">
    <div class="flex items-center gap-4">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Nuevo proyecto</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Información general, técnica, responsables y finanzas
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <form v-else class="space-y-8" @submit.prevent="onSubmit">
      <section
        class="p-5 rounded-xl space-y-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
          Información general
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput v-bind="codeB" label="Código de proyecto" placeholder="INT-PRY-001" required :error="errors.code" />
          <FormInput v-bind="nameB" label="Nombre" required :error="errors.name" />
          <FormSelect
            v-bind="clientIdB"
            label="Cliente"
            :options="clientOptions"
            placeholder="Seleccionar"
            required
            :error="errors.clientId"
          />
          <FormSelect
            v-bind="projectTypeB"
            label="Tipo"
            :options="typeOptions"
            required
            :error="errors.projectType"
          />
          <FormSelect
            v-bind="statusB"
            label="Estado"
            :options="statusOptions"
            required
            :error="errors.status"
            class="md:col-span-2"
          />
        </div>
      </section>

      <section
        class="p-5 rounded-xl space-y-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
          Información técnica
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput v-bind="addressLineB" class="md:col-span-2" label="Dirección" :error="errors.addressLine" />
          <FormInput
            v-bind="areaSqmB"
            type="number"
            label="Área m²"
            :error="errors.areaSqm"
          />
          <FormInput
            v-bind="levelsCountB"
            type="number"
            label="Niveles / pisos"
            :error="errors.levelsCount"
          />
          <FormTextarea
            v-bind="environmentsNoteB"
            class="md:col-span-2"
            label="Ambientes"
            placeholder="Ej. cocina, sala, dormitorios…"
            :rows="3"
          />
          <FormInput v-bind="startDateB" type="date" label="Fecha inicio" :error="errors.startDate" />
          <FormInput
            v-bind="estimatedEndDateB"
            type="date"
            label="Fecha estimada fin"
            :error="errors.estimatedEndDate"
          />
        </div>
      </section>

      <section
        class="p-5 rounded-xl space-y-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
          Responsables
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSelect
            v-bind="designerB"
            label="Diseñador"
            :options="agentOptions"
            placeholder="Opcional"
            :error="errors.designerAgentId"
          />
          <FormSelect
            v-bind="architectB"
            label="Arquitecto"
            :options="agentOptions"
            placeholder="Opcional"
          />
          <FormSelect
            v-bind="supervisorB"
            label="Supervisor"
            :options="agentOptions"
            placeholder="Opcional"
          />
          <FormSelect
            v-bind="commercialB"
            label="Asesor comercial"
            :options="agentOptions"
            placeholder="Opcional"
          />
        </div>
      </section>

      <section
        class="p-5 rounded-xl space-y-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
          Información financiera
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            v-bind="estimatedBudgetB"
            type="number"
            step="0.01"
            label="Presupuesto estimado (S/)"
            :error="errors.estimatedBudget"
          />
          <FormInput
            v-bind="projectedCostB"
            type="number"
            step="0.01"
            label="Costo proyectado (S/)"
            :error="errors.projectedCost"
          />
          <FormInput
            v-bind="expectedMarginB"
            type="number"
            step="0.01"
            label="Margen esperado %"
            :error="errors.expectedMargin"
          />
        </div>
      </section>

      <div class="flex justify-end gap-3">
        <BaseButton type="button" variant="outline" @click="goBack">Cancelar</BaseButton>
        <BaseButton type="submit" variant="primary" :loading="createMut.isPending.value">
          Guardar proyecto
        </BaseButton>
      </div>
    </form>
  </div>
</template>
