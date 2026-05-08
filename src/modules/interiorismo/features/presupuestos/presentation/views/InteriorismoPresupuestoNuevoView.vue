<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import { BaseButton } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { FormInput, FormSelect } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'
import { useInteriorClientsList } from '@modules/interiorismo/features/clientes'
import { useInteriorProjectsList } from '@modules/interiorismo/features/proyectos/application/useInteriorProjects'
import type { ClientListItem, ListClientsParams } from '@modules/interiorismo/features/clientes/domain/client.types'
import type { ListInteriorProjectsParams } from '@modules/interiorismo/features/proyectos/domain/project.types'
import { useCreateInteriorBudget } from '../../application/useInteriorBudgets'
import { BUDGET_STATUS_LABELS } from '../labels'

const router = useRouter()
const route = useRoute()

const listClientsParams = ref<ListClientsParams>({
  applicationSlug: INTERIORISMO_APP_SLUG,
  page: 1,
  limit: 500,
})
const { data: clientsRes, isLoading: loadingClients } = useInteriorClientsList(listClientsParams)

const clientIdModel = ref('')
const listProjectsParams = ref<ListInteriorProjectsParams>({
  page: 1,
  limit: 500,
  clientId: undefined,
})
const { data: projectsRes, isLoading: loadingProjects } = useInteriorProjectsList(listProjectsParams)

watch(clientIdModel, (cid) => {
  listProjectsParams.value = {
    ...listProjectsParams.value,
    page: 1,
    clientId: cid.trim() || undefined,
  }
})

const clientOptions = computed(() =>
  (clientsRes.value?.data ?? []).map((c: ClientListItem) => ({
    value: c.id,
    label: `${c.fullName} (${c.documentNumber})`,
  })),
)

const projectOptions = computed(() =>
  (projectsRes.value?.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.code} · ${p.name}`,
  })),
)

const statusOptions = computed(() =>
  Object.entries(BUDGET_STATUS_LABELS).map(([value, label]) => ({ value, label })),
)

const schema = yup.object({
  projectId: yup.string().required('Seleccione el proyecto'),
  code: yup.string().required('Ingrese el código').trim(),
  title: yup.string().trim(),
  status: yup.string().required(),
  defaultIgvPct: yup.number().min(0).max(100),
})

const { handleSubmit, errors, defineComponentBinds, setFieldValue } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    projectId: '',
    code: '',
    title: '',
    status: 'DRAFT',
    defaultIgvPct: 18,
  },
})

const projectIdB = defineComponentBinds('projectId')
const codeB = defineComponentBinds('code')
const titleB = defineComponentBinds('title')
const statusB = defineComponentBinds('status')
const defaultIgvB = defineComponentBinds('defaultIgvPct')

const createMut = useCreateInteriorBudget()

const loading = computed(() => loadingClients.value || loadingProjects.value)

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/presupuestos`)

onMounted(() => {
  const qc = String(route.query.clientId ?? '').trim()
  const qp = String(route.query.projectId ?? '').trim()
  if (qc) clientIdModel.value = qc
  if (qp) setFieldValue('projectId', qp)
})

watch(projectOptions, () => {
  const qp = String(route.query.projectId ?? '').trim()
  if (qp && projectOptions.value.some((o) => o.value === qp)) {
    setFieldValue('projectId', qp)
  }
})

const onSubmit = handleSubmit(async (v) => {
  try {
    const created = await createMut.mutateAsync({
      projectId: v.projectId,
      code: v.code,
      title: v.title?.trim() ? v.title.trim() : null,
      status: v.status,
      defaultIgvPct: v.defaultIgvPct,
    })
    router.push(`${INTERIORISMO_BASE_PATH}/presupuestos/${created.id}`)
  } catch {
    void 0
  }
})
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[900px] mx-auto space-y-8">
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
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Nuevo presupuesto
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Cliente → proyecto → presupuesto. El cliente es el del proyecto seleccionado.
        </p>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <form v-else class="space-y-6" @submit.prevent="onSubmit">
      <section
        class="p-5 rounded-xl space-y-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
          Cliente y proyecto
        </h2>
        <FormSelect
          v-model="clientIdModel"
          :options="[{ value: '', label: 'Seleccione cliente' }, ...clientOptions]"
          label="Cliente"
        />
        <FormSelect
          v-bind="projectIdB"
          :options="[{ value: '', label: 'Seleccione proyecto' }, ...projectOptions]"
          label="Proyecto"
          :disabled="!clientIdModel"
        />
        <p v-if="errors.projectId" class="text-xs text-red-600">{{ errors.projectId }}</p>
      </section>

      <section
        class="p-5 rounded-xl space-y-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold" :style="{ color: 'var(--color-text-primary)' }">
          Cabecera del presupuesto
        </h2>
        <div class="grid sm:grid-cols-2 gap-4">
          <FormInput v-bind="codeB" label="Código" placeholder="PRE-001" />
          <FormInput v-bind="defaultIgvB" label="IGV por defecto (%)" type="number" />
        </div>
        <FormInput v-bind="titleB" label="Título (opcional)" />
        <FormSelect v-bind="statusB" :options="statusOptions" label="Estado" />
        <p v-if="errors.code" class="text-xs text-red-600">{{ errors.code }}</p>
      </section>

      <div class="flex justify-end gap-3">
        <BaseButton type="button" variant="outline" @click="goBack">Cancelar</BaseButton>
        <BaseButton type="submit" variant="primary" :loading="createMut.isPending.value">
          Crear borrador
        </BaseButton>
      </div>
    </form>
  </div>
</template>
