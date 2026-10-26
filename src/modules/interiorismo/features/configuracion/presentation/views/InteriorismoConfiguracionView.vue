<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import ActionCard from '@shared/presentation/components/ui/ActionCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import { ref, watch, computed } from 'vue'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import {
  useInteriorismoConfigBootstrap,
  useInteriorismoSaveProjectStages,
  useInteriorismoSaveInteriorProjectNumbering,
} from '../composables/useInteriorismoConfig'
import type { InteriorismoProjectStageDTO } from '../../domain/config.types'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
const activeTab = ref('accesos')

const tabs = [
  { id: 'accesos', label: 'Módulo Interiorismo', icon: 'lucide:layout-dashboard' },
  { id: 'parametros', label: 'Parametrización', icon: 'lucide:sliders-horizontal' },
  { id: 'flujo', label: 'Flujo del negocio', icon: 'lucide:workflow' },
]

const quickLinks = [
  {
    to: `${INTERIORISMO_BASE_PATH}/clientes`,
    label: 'Clientes',
    icon: 'lucide:users',
    desc: 'Cartera de clientes del módulo',
  },
  {
    to: `${INTERIORISMO_BASE_PATH}/materiales/catalogo`,
    label: 'Catálogo de materiales',
    icon: 'lucide:layers',
    desc: 'Insumos y acabados',
  },
  {
    to: `${INTERIORISMO_BASE_PATH}/reportes`,
    label: 'Reportes',
    icon: 'lucide:bar-chart-2',
    desc: 'Indicadores y exportación',
  },
]

const { data: boot, isLoading, isError, error, refetch } = useInteriorismoConfigBootstrap()
const configLoadError = computed(() => (isError.value ? getApiErrorMessage(error.value) : ''))
const { mutate: saveStages, isPending: savingStages } = useInteriorismoSaveProjectStages()
const { mutate: saveNumbering, isPending: savingNum } =
  useInteriorismoSaveInteriorProjectNumbering()

const pipelineDraft = ref<InteriorismoProjectStageDTO[]>([])

watch(
  () => boot.value?.projectStages,
  (rows) => {
    if (rows?.length) {
      pipelineDraft.value = rows.map((r) => ({ ...r }))
    }
  },
  { immediate: true },
)

function reorderPipeline(idx: number, dir: -1 | 1) {
  const arr = pipelineDraft.value
  const j = idx + dir
  if (j < 0 || j >= arr.length) return
  const t = arr[idx]!
  arr[idx] = arr[j]!
  arr[j] = t
  arr.forEach((s, i) => {
    s.sortOrder = i
  })
}

const REQUIRED_STAGE_COUNT = 5

function submitPipeline() {
  const sorted = [...pipelineDraft.value].sort((a, b) => a.sortOrder - b.sortOrder)
  if (sorted.length !== REQUIRED_STAGE_COUNT) {
    void markapAlert.toast.warning(
      'La configuración debe incluir las cinco etapas del ciclo de proyecto',
    )
    return
  }
  const rows = sorted.map((s, i) => ({ ...s, sortOrder: i }))
  saveStages(rows, { onSuccess: () => void refetch() })
}

const numSchema = toTypedSchema(
  yup.object({
    prefix: yup.string().required('Prefijo requerido').trim(),
    lastNumber: yup.number().integer().min(0, 'No negativo').required(),
  }),
)

const {
  handleSubmit: submitNum,
  errors: numErrors,
  defineComponentBinds,
  resetForm: resetNum,
} = useForm({
  validationSchema: numSchema,
  initialValues: { prefix: 'INT-PRY', lastNumber: 0 },
})

const numBinds = {
  prefix: defineComponentBinds('prefix'),
  lastNumber: defineComponentBinds('lastNumber'),
}

watch(
  () => boot.value?.numbering.interiorProject,
  (n) => {
    if (n) {
      resetNum({ values: { prefix: n.prefix, lastNumber: n.lastNumber } })
    }
  },
  { immediate: true },
)

const onSubmitNumbering = submitNum((vals) => {
  saveNumbering(
    { prefix: vals.prefix, lastNumber: vals.lastNumber },
    { onSuccess: () => void refetch() },
  )
})

const flowSteps = [
  { label: 'Cliente', path: `${INTERIORISMO_BASE_PATH}/clientes`, icon: 'lucide:user' },
  { label: 'Proyecto', path: `${INTERIORISMO_BASE_PATH}/proyectos`, icon: 'lucide:folder-kanban' },
  { label: 'Presupuesto', path: `${INTERIORISMO_BASE_PATH}/proyectos`, icon: 'lucide:file-text' },
  { label: 'Ejecución', path: `${INTERIORISMO_BASE_PATH}/ejecucion`, icon: 'lucide:hard-hat' },
  { label: 'Documentos', path: `${INTERIORISMO_BASE_PATH}/documentos`, icon: 'lucide:files' },
  { label: 'Reportes', path: `${INTERIORISMO_BASE_PATH}/reportes`, icon: 'lucide:line-chart' },
]
</script>

<template>
  <div class="space-y-6 max-w-5xl">
    <PageHeader
      title="Configuración — Interiorismo"
    >
      <template #actions>
        <p class="text-sm mt-1 text-gray-500 dark:text-gray-400">
        Ajustes propios de <strong>Interiorismo</strong> (independiente de Ventas u otros módulos): etiquetas del
        ciclo de proyecto, numeración sugerida para códigos y enlaces operativos.
      </p>
      </template>
    </PageHeader>

    <BaseTabs v-model="activeTab" :tabs="tabs" />

    <div v-if="activeTab === 'accesos'" class="space-y-4">
      <p class="text-sm text-gray-400 dark:text-gray-500">
        Accesos a pantallas frecuentes del módulo (datos filtrados por aplicación interiorismo en backend).
      </p>
      <div class="grid sm:grid-cols-2 gap-3">
        <ActionCard v-for="l in quickLinks" :key="l.to" :to="l.to" :icon="l.icon" :title="l.label" :description="l.desc" />
      </div>
    </div>

    <div v-else-if="activeTab === 'parametros'" class="space-y-8">
      <LoadingState v-if="isLoading" />

      <BaseCard v-else-if="isError" padding="lg" class="block text-center space-y-3">
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">
          No se pudo cargar la configuración
        </p>
        <p class="text-xs max-w-lg mx-auto text-gray-500 dark:text-gray-400">
          {{ configLoadError }}
        </p>
        <BaseButton type="button" @click="() => refetch()">Reintentar</BaseButton>
      </BaseCard>

      <template v-else>
        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">
            Estados del ciclo de proyecto
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Ciclo comercial: Diseño → Cotización → Aprobación → Ejecución → Finalizado. Las etiquetas se
            personalizan aquí; los códigos técnicos (DESIGN, QUOTE, …) no cambian.
          </p>
          <BaseCard padding="none" class="block overflow-hidden">
            <Table class="w-full text-sm">
              <TableHeader>
                <TableRow class="border-b text-left border-gray-200 dark:border-gray-800">
                  <TableCell is-header class="py-2 px-3">Código</TableCell>
                  <TableCell is-header class="py-2 px-3">Etiqueta</TableCell>
                  <TableCell is-header class="py-2 px-3 w-24">Orden</TableCell>
                  <TableCell is-header class="py-2 px-3 w-32"></TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="(row, idx) in pipelineDraft"
                  :key="row.code"
                  class="border-b border-gray-200 dark:border-gray-800"
                >
                  <TableCell class="py-2 px-3 font-mono text-xs">{{ row.code }}</TableCell>
                  <TableCell class="py-2 px-3">
                    <FormInput v-model="row.label" type="text" size="sm" />
                  </TableCell>
                  <TableCell class="py-2 px-3">
                    <FormInput v-model="row.sortOrder" type="number" size="sm" />
                  </TableCell>
                  <TableCell class="py-2 px-3">
                    <div class="flex gap-1">
                      <BaseButton type="button" variant="ghost" size="sm" @click="reorderPipeline(idx, -1)">
                        ↑
                      </BaseButton>
                      <BaseButton type="button" variant="ghost" size="sm" @click="reorderPipeline(idx, 1)">
                        ↓
                      </BaseButton>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div class="p-3 border-t flex justify-end border-gray-200 dark:border-gray-800">
              <BaseButton v-if="canWrite" variant="primary" :loading="savingStages" @click="submitPipeline">
                Guardar etapas
              </BaseButton>
            </div>
          </BaseCard>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">
            Series / numeración — proyectos
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Referencia para el correlativo de códigos de proyecto (ej. INT-PRY-0007). La numeración se usa como guía;
            al crear un proyecto puedes indicar el código manualmente.
          </p>
          <BaseCard padding="sm" class="block space-y-3 max-w-md">
            <p v-if="boot?.numbering.interiorProject" class="text-sm text-gray-400 dark:text-gray-500">
              Próximo código según servidor:
              <strong class="text-gray-800 dark:text-white/90">{{
                boot.numbering.interiorProject.nextPreview
              }}</strong>
            </p>
            <form class="space-y-3" @submit.prevent="onSubmitNumbering">
              <FormInput label="Prefijo" v-bind="numBinds.prefix" />
              <p v-if="numErrors.prefix" class="text-xs text-error-600 dark:text-error-500">{{ numErrors.prefix }}</p>
              <FormInput label="Último número (correlativo)" type="number" v-bind="numBinds.lastNumber" />
              <p v-if="numErrors.lastNumber" class="text-xs text-error-600 dark:text-error-500">{{ numErrors.lastNumber }}</p>
              <BaseButton v-if="canWrite" type="submit" variant="primary" :loading="savingNum">Guardar numeración</BaseButton>
            </form>
          </BaseCard>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">
            Agentes y equipo
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Los responsables de proyecto (diseño, obra, etc.) se gestionan en la aplicación correspondiente según los
            roles de tu organización; los proyectos interiorismo solo admiten agentes dados de alta en esta aplicación.
          </p>
        </section>
      </template>
    </div>

    <div v-else-if="activeTab === 'flujo'" class="space-y-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Referencia del flujo en Interiorismo (cada paso enlaza al área correspondiente).
      </p>
      <BaseCard padding="sm" class="flex flex-wrap items-center gap-2 flex-row">
        <template v-for="(s, i) in flowSteps" :key="s.path">
          <BaseButton :to="s.path" variant="secondary" size="sm" :icon="s.icon">{{ s.label }}</BaseButton>
          <AppIcon
            v-if="i < flowSteps.length - 1"
            icon="lucide:chevron-right"
            :size="18"
            class="opacity-40 hidden sm:block"
          />
        </template>
      </BaseCard>
    </div>
  </div>
</template>
