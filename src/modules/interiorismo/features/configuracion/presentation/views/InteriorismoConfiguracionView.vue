<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { RouterLink } from 'vue-router'
import * as yup from 'yup'
import { BaseButton, AppIcon, BaseTabs } from '@shared/components'
import { useForm, toTypedSchema } from '@shared/components/forms'
import FormInput from '@shared/components/forms/FormInput.vue'
import { markapAlert } from '@/shared/composables'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'
import {
  useInteriorismoConfigBootstrap,
  useInteriorismoSaveProjectStages,
  useInteriorismoSaveInteriorProjectNumbering,
} from '../../application/useInteriorismoConfig'
import type { InteriorismoProjectStageDTO } from '../../domain/config.types'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

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
const { mutate: saveNumbering, isPending: savingNum } = useInteriorismoSaveInteriorProjectNumbering()

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

const REQUIRED_STAGE_COUNT = 7

function submitPipeline() {
  const sorted = [...pipelineDraft.value].sort((a, b) => a.sortOrder - b.sortOrder)
  if (sorted.length !== REQUIRED_STAGE_COUNT) {
    void markapAlert.toast.warning('La configuración debe incluir las siete etapas del ciclo de proyecto')
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
  { label: 'Presupuesto', path: `${INTERIORISMO_BASE_PATH}/presupuestos`, icon: 'lucide:file-text' },
  { label: 'Ejecución', path: `${INTERIORISMO_BASE_PATH}/ejecucion`, icon: 'lucide:hard-hat' },
  { label: 'Finanzas', path: `${INTERIORISMO_BASE_PATH}/finanzas`, icon: 'lucide:wallet' },
  { label: 'Documentos', path: `${INTERIORISMO_BASE_PATH}/documentos`, icon: 'lucide:files' },
  { label: 'Reportes', path: `${INTERIORISMO_BASE_PATH}/reportes`, icon: 'lucide:line-chart' },
]
</script>

<template>
  <div class="space-y-6 max-w-5xl">
    <div>
      <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
        Configuración — Interiorismo
      </h1>
      <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
        Ajustes propios de <strong>Interiorismo</strong> (independiente de Ventas u otros módulos): etiquetas del
        ciclo de proyecto, numeración sugerida para códigos y enlaces operativos.
      </p>
    </div>

    <BaseTabs v-model="activeTab" :tabs="tabs" />

    <div v-if="activeTab === 'accesos'" class="space-y-4">
      <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
        Accesos a pantallas frecuentes del módulo (datos filtrados por aplicación interiorismo en backend).
      </p>
      <div class="grid sm:grid-cols-2 gap-3">
        <RouterLink
          v-for="l in quickLinks"
          :key="l.to"
          :to="l.to"
          class="rounded-xl border p-4 flex gap-3 transition hover:opacity-90"
          :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
        >
          <div
            class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
          >
            <AppIcon :icon="l.icon" :size="20" color="var(--color-primary)" />
          </div>
          <div>
            <p class="font-semibold text-sm" :style="{ color: 'var(--color-text-primary)' }">{{ l.label }}</p>
            <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">{{ l.desc }}</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <div v-else-if="activeTab === 'parametros'" class="space-y-8">
      <div v-if="isLoading" class="flex justify-center py-16">
        <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
      </div>

      <div
        v-else-if="isError"
        class="rounded-xl border p-8 text-center space-y-3"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
          No se pudo cargar la configuración
        </p>
        <p class="text-xs max-w-lg mx-auto" :style="{ color: 'var(--color-text-secondary)' }">
          {{ configLoadError }}
        </p>
        <BaseButton type="button" @click="() => refetch()">Reintentar</BaseButton>
      </div>

      <template v-else>
        <section class="space-y-3">
          <h2 class="text-lg font-semibold" :style="{ color: 'var(--color-text-primary)' }">
            Estados del ciclo de proyecto
          </h2>
          <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
            Etiquetas en español y orden visual (listados, filtros). Los códigos técnicos (PROSPECT, DESIGN, …) no
            cambian.
          </p>
          <div
            class="rounded-xl border overflow-hidden"
            :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
          >
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b text-left" :style="{ borderColor: 'var(--color-border)' }">
                  <th class="py-2 px-3">Código</th>
                  <th class="py-2 px-3">Etiqueta</th>
                  <th class="py-2 px-3 w-24">Orden</th>
                  <th class="py-2 px-3 w-32"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in pipelineDraft"
                  :key="row.code"
                  class="border-b"
                  :style="{ borderColor: 'var(--color-border)' }"
                >
                  <td class="py-2 px-3 font-mono text-xs">{{ row.code }}</td>
                  <td class="py-2 px-3">
                    <input
                      v-model="row.label"
                      type="text"
                      class="w-full px-2 py-1.5 rounded border text-sm"
                      :style="{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-surface-elevated)',
                        color: 'var(--color-text-primary)',
                      }"
                    />
                  </td>
                  <td class="py-2 px-3">
                    <input
                      v-model.number="row.sortOrder"
                      type="number"
                      class="w-full px-2 py-1.5 rounded border text-sm"
                      :style="{
                        borderColor: 'var(--color-border)',
                        backgroundColor: 'var(--color-surface-elevated)',
                        color: 'var(--color-text-primary)',
                      }"
                    />
                  </td>
                  <td class="py-2 px-3">
                    <div class="flex gap-1">
                      <BaseButton type="button" variant="ghost" size="sm" @click="reorderPipeline(idx, -1)">
                        ↑
                      </BaseButton>
                      <BaseButton type="button" variant="ghost" size="sm" @click="reorderPipeline(idx, 1)">
                        ↓
                      </BaseButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="p-3 border-t flex justify-end" :style="{ borderColor: 'var(--color-border)' }">
              <BaseButton variant="primary" :loading="savingStages" @click="submitPipeline">
                Guardar etapas
              </BaseButton>
            </div>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold" :style="{ color: 'var(--color-text-primary)' }">
            Series / numeración — proyectos
          </h2>
          <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
            Referencia para el correlativo de códigos de proyecto (ej. INT-PRY-0007). La numeración se usa como guía;
            al crear un proyecto puedes indicar el código manualmente.
          </p>
          <div
            class="rounded-xl border p-4 space-y-3 max-w-md"
            :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
          >
            <p v-if="boot?.numbering.interiorProject" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
              Próximo código según servidor:
              <strong :style="{ color: 'var(--color-text-primary)' }">{{
                boot.numbering.interiorProject.nextPreview
              }}</strong>
            </p>
            <form class="space-y-3" @submit.prevent="onSubmitNumbering">
              <FormInput label="Prefijo" v-bind="numBinds.prefix" />
              <p v-if="numErrors.prefix" class="text-xs text-red-600">{{ numErrors.prefix }}</p>
              <FormInput label="Último número (correlativo)" type="number" v-bind="numBinds.lastNumber" />
              <p v-if="numErrors.lastNumber" class="text-xs text-red-600">{{ numErrors.lastNumber }}</p>
              <BaseButton type="submit" variant="primary" :loading="savingNum">Guardar numeración</BaseButton>
            </form>
          </div>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-semibold" :style="{ color: 'var(--color-text-primary)' }">
            Agentes y equipo
          </h2>
          <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
            Los responsables de proyecto (diseño, obra, etc.) se gestionan en la aplicación correspondiente según los
            roles de tu organización; los proyectos interiorismo solo admiten agentes dados de alta en esta aplicación.
          </p>
        </section>
      </template>
    </div>

    <div v-else-if="activeTab === 'flujo'" class="space-y-4">
      <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
        Referencia del flujo en Interiorismo (cada paso enlaza al área correspondiente).
      </p>
      <div
        class="flex flex-wrap items-center gap-2 p-4 rounded-xl border"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <template v-for="(s, i) in flowSteps" :key="s.path">
          <RouterLink
            :to="s.path"
            class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition hover:opacity-90"
            :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }"
          >
            <AppIcon :icon="s.icon" :size="16" color="var(--color-primary)" />
            {{ s.label }}
          </RouterLink>
          <AppIcon
            v-if="i < flowSteps.length - 1"
            icon="lucide:chevron-right"
            :size="18"
            class="opacity-40 hidden sm:block"
          />
        </template>
      </div>
    </div>
  </div>
</template>
