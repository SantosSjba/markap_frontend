<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { FormInput, FormSelect, FormTextarea } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import { apiClient } from '@core/api/apiClient'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import { ARQUITECTURA_BASE_PATH } from '@modules/arquitectura/config/routes.constants'
import { useArquitecturaClientsList } from '@modules/arquitectura/features/clientes'
import { useArquitecturaConfigBootstrap } from '@modules/arquitectura/features/configuracion'
import { useCreateArquitecturaProject } from '../../application/useArquitecturaProjects'
import type { ArquitecturaProjectStatus, ArquitecturaProjectType } from '../../domain/project.types'
import type {
  ClientListItem,
  ListClientsParams,
} from '@modules/arquitectura/features/clientes/domain/client.types'
import { PROJECT_TYPE_LABELS, CURRENCY_OPTIONS, INTERVENTION_LEVEL_OPTIONS } from '../labels'
import { useArquitecturaProjectStageOptions } from '../../application/useArquitecturaProjectStageOptions'

const router = useRouter()
const route = useRoute()

const listClientsParams = ref<ListClientsParams>({
  applicationSlug: ARQUITECTURA_APP_SLUG,
  page: 1,
  limit: 500,
})
const { data: clientsRes, isLoading: loadingClients } = useArquitecturaClientsList(listClientsParams)

const { data: agentsRes, isLoading: loadingAgents } = useQuery({
  queryKey: ['agents', ARQUITECTURA_APP_SLUG, 'arquitectura-pick'],
  queryFn: async () => {
    const { data } = await apiClient.get<{ data: { id: string; fullName: string }[] }>('/agents', {
      params: { applicationSlug: ARQUITECTURA_APP_SLUG, limit: 500, page: 1 },
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
  (Object.keys(PROJECT_TYPE_LABELS) as ArquitecturaProjectType[]).map((k) => ({
    value: k,
    label: PROJECT_TYPE_LABELS[k],
  })),
)

const { formOptions: statusOptions } = useArquitecturaProjectStageOptions()
const { data: configBoot } = useArquitecturaConfigBootstrap()

const schema = yup.object({
  code: yup.string().trim(),
  name: yup.string().required('Ingrese el nombre').trim(),
  clientId: yup.string().required('Seleccione el cliente'),
  projectType: yup.string().required(),
  status: yup.string().required(),
  addressLine: yup.string().trim(),
  city: yup.string().trim(),
  interventionLevel: yup.string().trim(),
  executionTimeNote: yup.string().trim(),
  currency: yup.string().required(),
  defaultUtilityPct: yup.number().nullable().min(0),
  defaultIgvPct: yup.number().nullable().min(0),
  areaSqm: yup.number().nullable(),
  levelsCount: yup.number().integer().nullable(),
  environmentsNote: yup.string().trim(),
  startDate: yup.string().trim(),
  estimatedEndDate: yup.string().trim(),
  designerAgentId: yup.string().trim(),
  architectJrAgentId: yup.string().trim(),
  architectSrAgentId: yup.string().trim(),
  supervisorAgentId: yup.string().trim(),
  commercialAgentId: yup.string().trim(),
  estimatedBudget: yup.number().nullable(),
  projectedCost: yup.number().nullable(),
  expectedMargin: yup.number().nullable(),
})

const { handleSubmit, errors, defineComponentBinds, setFieldValue } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    code: '',
    name: '',
    clientId: '',
    projectType: 'RESIDENTIAL' as ArquitecturaProjectType,
    status: 'DESIGN' as ArquitecturaProjectStatus,
    addressLine: '',
    city: '',
    interventionLevel: '',
    executionTimeNote: '',
    currency: 'PEN',
    defaultUtilityPct: 20,
    defaultIgvPct: 18,
    areaSqm: undefined as number | undefined,
    levelsCount: undefined as number | undefined,
    environmentsNote: '',
    startDate: '',
    estimatedEndDate: '',
    designerAgentId: '',
    architectJrAgentId: '',
    architectSrAgentId: '',
    supervisorAgentId: '',
    commercialAgentId: '',
    estimatedBudget: undefined as number | undefined,
    projectedCost: undefined as number | undefined,
    expectedMargin: undefined as number | undefined,
  },
})

watch(
  () => configBoot.value?.numbering.arquitecturaProject?.nextPreview,
  (preview) => {
    if (preview) setFieldValue('code', preview)
  },
  { immediate: true },
)

const codeB = defineComponentBinds('code')
const nameB = defineComponentBinds('name')
const clientIdB = defineComponentBinds('clientId')
const projectTypeB = defineComponentBinds('projectType')
const statusB = defineComponentBinds('status')
const addressLineB = defineComponentBinds('addressLine')
const cityB = defineComponentBinds('city')
const interventionLevelB = defineComponentBinds('interventionLevel')
const executionTimeNoteB = defineComponentBinds('executionTimeNote')
const currencyB = defineComponentBinds('currency')
const defaultUtilityPctB = defineComponentBinds('defaultUtilityPct')
const defaultIgvPctB = defineComponentBinds('defaultIgvPct')
const areaSqmB = defineComponentBinds('areaSqm')
const levelsCountB = defineComponentBinds('levelsCount')
const environmentsNoteB = defineComponentBinds('environmentsNote')
const startDateB = defineComponentBinds('startDate')
const estimatedEndDateB = defineComponentBinds('estimatedEndDate')
const designerB = defineComponentBinds('designerAgentId')
const architectJrB = defineComponentBinds('architectJrAgentId')
const architectSrB = defineComponentBinds('architectSrAgentId')
const supervisorB = defineComponentBinds('supervisorAgentId')
const commercialB = defineComponentBinds('commercialAgentId')
const estimatedBudgetB = defineComponentBinds('estimatedBudget')
const projectedCostB = defineComponentBinds('projectedCost')
const expectedMarginB = defineComponentBinds('expectedMargin')

const createMut = useCreateArquitecturaProject()

const loading = computed(() => loadingClients.value || loadingAgents.value)

const goBack = () => {
  if (route.query.from === 'presupuestos') {
    router.push(`${ARQUITECTURA_BASE_PATH}/presupuestos/nuevo`)
    return
  }
  router.push(`${ARQUITECTURA_BASE_PATH}/proyectos`)
}

const emptyToUndef = (s: string | undefined | null) =>
  s?.trim() ? s.trim() : undefined

const onSubmit = handleSubmit(async (v) => {
  try {
    const created = await createMut.mutateAsync({
      code: emptyToUndef(v.code),
      name: v.name,
      clientId: v.clientId,
      projectType: v.projectType as ArquitecturaProjectType,
      status: v.status as ArquitecturaProjectStatus,
      addressLine: emptyToUndef(v.addressLine) ?? null,
      city: emptyToUndef(v.city) ?? null,
      interventionLevel: emptyToUndef(v.interventionLevel) ?? null,
      executionTimeNote: emptyToUndef(v.executionTimeNote) ?? null,
      currency: v.currency || 'PEN',
      defaultUtilityPct: v.defaultUtilityPct ?? 20,
      defaultIgvPct: v.defaultIgvPct ?? 18,
      areaSqm: v.areaSqm ?? null,
      levelsCount: v.levelsCount ?? null,
      environmentsNote: emptyToUndef(v.environmentsNote) ?? null,
      startDate: emptyToUndef(v.startDate) ?? null,
      estimatedEndDate: emptyToUndef(v.estimatedEndDate) ?? null,
      designerAgentId: emptyToUndef(v.designerAgentId) ?? null,
      architectJrAgentId: emptyToUndef(v.architectJrAgentId) ?? null,
      architectSrAgentId: emptyToUndef(v.architectSrAgentId) ?? null,
      supervisorAgentId: emptyToUndef(v.supervisorAgentId) ?? null,
      commercialAgentId: emptyToUndef(v.commercialAgentId) ?? null,
      estimatedBudget: v.estimatedBudget ?? null,
      projectedCost: v.projectedCost ?? null,
      expectedMargin: v.expectedMargin ?? null,
    })
    const tab = route.query.openTab === 'presupuesto' ? 'presupuesto' : undefined
    router.push({
      path: `${ARQUITECTURA_BASE_PATH}/proyectos/${created.id}`,
      ...(tab ? { query: { tab } } : {}),
    })
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
          <FormInput v-bind="codeB" label="Código de proyecto" placeholder="ARQ-PRY-0001" required :error="errors.code" />
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
          Presupuesto / cotización
        </h2>
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Cabecera del modelo Excel (ciudad, nivel, plazo y parámetros de cálculo).
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput v-bind="cityB" label="Ciudad" placeholder="TRUJILLO" :error="errors.city" />
          <FormSelect
            v-bind="interventionLevelB"
            label="Nivel de intervención"
            :options="INTERVENTION_LEVEL_OPTIONS"
            placeholder="Seleccionar"
            :error="errors.interventionLevel"
          />
          <FormInput
            v-bind="executionTimeNoteB"
            class="md:col-span-2"
            label="Tiempo de ejecución"
            placeholder="30 DÍAS HÁBILES"
            :error="errors.executionTimeNote"
          />
          <FormSelect
            v-bind="currencyB"
            label="Moneda"
            :options="CURRENCY_OPTIONS"
            required
            :error="errors.currency"
          />
          <FormInput
            v-bind="defaultUtilityPctB"
            type="number"
            label="Utilidad por defecto (%)"
            :error="errors.defaultUtilityPct"
          />
          <FormInput
            v-bind="defaultIgvPctB"
            type="number"
            label="IGV por defecto (%)"
            :error="errors.defaultIgvPct"
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
            v-bind="architectJrB"
            label="Arquitecto Jr"
            :options="agentOptions"
            placeholder="Opcional"
            :error="errors.architectJrAgentId"
          />
          <FormSelect
            v-bind="architectSrB"
            label="Arquitecto Sr"
            :options="agentOptions"
            placeholder="Opcional"
            :error="errors.architectSrAgentId"
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
