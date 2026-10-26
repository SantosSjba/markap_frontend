<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('ventas')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import ActionCard from '@shared/presentation/components/ui/ActionCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import { ref, watch, computed } from 'vue'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import {
  useVentasConfigBootstrap,
  useVentasSavePipelineStages,
  useVentasSaveNumbering,
} from '../composables/useVentasConfig'
import type { VentasPipelineStageDTO } from '../../domain/config.types'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
const activeTab = ref('accesos')

const tabs = [
  { id: 'accesos', label: 'Módulo Ventas', icon: 'lucide:layout-dashboard' },
  { id: 'parametros', label: 'Parametrización', icon: 'lucide:sliders-horizontal' },
  { id: 'flujo', label: 'Flujo del negocio', icon: 'lucide:workflow' },
]

/** Solo pantallas del módulo Ventas; usuarios/roles son ajustes globales fuera de esta vista. */
const quickLinks = [
  {
    to: '/ventas/agentes',
    label: 'Asesores',
    icon: 'lucide:user-check',
    desc: 'Agentes comerciales',
  },
  {
    to: '/ventas/comisiones',
    label: 'Porcentajes de comisión',
    icon: 'lucide:percent',
    desc: '% por asesor y comisiones por cierre',
  },
  {
    to: '/ventas/reportes',
    label: 'Reportes',
    icon: 'lucide:bar-chart-2',
    desc: 'Indicadores y exportación',
  },
]

const { data: boot, isLoading, isError, error, refetch } = useVentasConfigBootstrap()
const configLoadError = computed(() => (isError.value ? getApiErrorMessage(error.value) : ''))
const { mutate: savePipeline, isPending: savingPipeline } = useVentasSavePipelineStages()
const { mutate: saveNumbering, isPending: savingNum } = useVentasSaveNumbering()

const pipelineDraft = ref<VentasPipelineStageDTO[]>([])

watch(
  () => boot.value?.pipelineStages,
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

function submitPipeline() {
  const sorted = [...pipelineDraft.value].sort((a, b) => a.sortOrder - b.sortOrder)
  if (sorted.length !== 4) {
    void markapAlert.toast.warning('Faltan etapas en la configuración')
    return
  }
  const rows = sorted.map((s, i) => ({ ...s, sortOrder: i }))
  savePipeline(rows, { onSuccess: () => void refetch() })
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
  initialValues: { prefix: 'VNT-PRC', lastNumber: 0 },
})

const numBinds = {
  prefix: defineComponentBinds('prefix'),
  lastNumber: defineComponentBinds('lastNumber'),
}

watch(
  () => boot.value?.numbering.saleProcess,
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

const propColumns = [
  { key: 'c', label: 'Código', sortAccessor: (r: unknown) => (r as { code: string }).code },
  { key: 'n', label: 'Nombre', sortAccessor: (r: unknown) => (r as { name: string }).name },
]

const flowSteps = [
  { label: 'Cliente', path: '/ventas/clientes', icon: 'lucide:user' },
  { label: 'Proceso de venta', path: '/ventas/procesos', icon: 'lucide:git-branch' },
  { label: 'Separación', path: '/ventas/separaciones', icon: 'lucide:bookmark' },
  { label: 'Cierre', path: '/ventas/cierres', icon: 'lucide:check-circle' },
  { label: 'Comisiones', path: '/ventas/comisiones', icon: 'lucide:percent' },
  { label: 'Reportes', path: '/ventas/reportes', icon: 'lucide:line-chart' },
]
</script>

<template>
  <div class="space-y-6 max-w-5xl">
    <PageHeader
      title="Configuración — Ventas"
      subtitle="Ajustes propios de Ventas (independiente de Alquileres): pipeline, numeración de procesos, tipos de inmueble y enlaces operativos del módulo."
      icon="lucide:sliders-horizontal"
    />

    <BaseTabs v-model="activeTab" :tabs="tabs" />

    <div v-if="activeTab === 'accesos'" class="space-y-4">
      <p class="text-sm text-gray-400 dark:text-gray-500">
        Accesos a pantallas de operación del módulo (asesores, comisiones y reportes).
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
        <BaseButton type="button" icon="lucide:settings" @click="() => refetch()">Reintentar</BaseButton>
      </BaseCard>

      <template v-else>
        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">
            Estados del pipeline CRM
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Etiquetas en español y orden de columnas en el Kanban. Los códigos técnicos (SEPARATION, ARRAS, …) no cambian.
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
                      <BaseButton type="button" variant="ghost" size="sm" icon="lucide:chevron-up" @click="reorderPipeline(idx, -1)">
                        ↑
                      </BaseButton>
                      <BaseButton type="button" variant="ghost" size="sm" icon="lucide:chevron-down" @click="reorderPipeline(idx, 1)">
                        ↓
                      </BaseButton>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div class="p-3 border-t flex justify-end border-gray-200 dark:border-gray-800">
              <BaseButton v-if="canWrite" variant="primary" icon="lucide:save" :loading="savingPipeline" @click="submitPipeline">
                Guardar pipeline
              </BaseButton>
            </div>
          </BaseCard>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">
            Series / numeración — procesos de venta
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Prefijo y último correlativo usados al crear un proceso (ej. VNT-PRC-0007). Ajuste con cuidado para no
            duplicar códigos visibles.
          </p>
          <BaseCard padding="sm" class="block space-y-3 max-w-md">
            <p v-if="boot?.numbering.saleProcess" class="text-sm text-gray-400 dark:text-gray-500">
              Próximo código según servidor:
              <strong class="text-gray-800 dark:text-white/90">{{
                boot.numbering.saleProcess.nextPreview
              }}</strong>
            </p>
            <form class="space-y-3" @submit.prevent="onSubmitNumbering">
              <FormInput label="Prefijo" v-bind="numBinds.prefix" />
              <p v-if="numErrors.prefix" class="text-xs text-error-600 dark:text-error-500">{{ numErrors.prefix }}</p>
              <FormInput label="Último número (correlativo)" type="number" v-bind="numBinds.lastNumber" />
              <p v-if="numErrors.lastNumber" class="text-xs text-error-600 dark:text-error-500">{{ numErrors.lastNumber }}</p>
              <BaseButton v-if="canWrite" type="submit" variant="primary" icon="lucide:save" :loading="savingNum">Guardar numeración</BaseButton>
            </form>
          </BaseCard>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">
            Tipos de propiedad
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Catálogo global compartido. La edición masiva de tipos puede hacerse desde administración de propiedades /
            catálogos según sus políticas.
          </p>
          <BaseCard padding="none" class="block overflow-hidden">
            <DataTable
              :columns="propColumns"
              :data="boot?.propertyTypes ?? []"
              row-key="id"
              empty-text="Sin tipos activos."
            >
              <template #row="{ row }">
                <td class="py-2 px-3 font-mono text-xs">{{ (row as { code: string }).code }}</td>
                <td class="py-2 px-3">{{ (row as { name: string }).name }}</td>
              </template>
            </DataTable>
          </BaseCard>
        </section>
      </template>
    </div>

    <div v-else-if="activeTab === 'flujo'" class="space-y-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Referencia del flujo real en Ventas (cada paso enlaza al módulo correspondiente).
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
