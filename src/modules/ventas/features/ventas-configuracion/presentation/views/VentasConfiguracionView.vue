<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import { Switch } from '@shared/presentation/ui/switch'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { PIPELINE_STAGE_OPTIONS } from '../../../ventas-sales/domain/pipeline.constants'
import {
  FINANCING_CHANNEL_CATEGORIES,
  type FinancingChannelCategory,
  type VentasFinancingChannel,
} from '../../domain/config.types'
import {
  useVentasConfigBootstrap,
  useVentasCreateFinancingChannel,
  useVentasFinancingChannelsCatalog,
  useVentasSavePipelineStages,
  useVentasUpdateFinancingChannel,
} from '../composables/useVentasConfig'
/**
 * Configuración de Ventas:
 * - Flujo del negocio: cómo avanza una venta, paso a paso, con las etapas legales del pipeline (nombres editables).
 * - Parametrización: catálogo de bancos y medios de pago que se elige en cada proceso.
 * Los códigos de proceso siguen la nomenclatura de Alquileres (`VENTA-<año>-<inmueble>`), sin series que configurar.
 */
const { canWrite } = useApplicationAccess('ventas')
const route = useRoute()
const router = useRouter()

const tabs = [
  { id: 'flujo', label: 'Flujo del negocio', icon: 'lucide:workflow' },
  { id: 'parametros', label: 'Parametrización', icon: 'lucide:sliders-horizontal' },
] as const
type Tab = (typeof tabs)[number]['id']
const activeTab = computed<Tab>({
  get: () => (route.query.tab === 'parametros' ? 'parametros' : 'flujo'),
  set: (tab) => void router.replace({ query: { ...route.query, tab } }),
})

// ── Flujo del negocio ──
const flowSteps = [
  {
    title: 'Cliente e inmueble',
    icon: 'lucide:users',
    to: '/ventas/clientes',
    linkLabel: 'Clientes',
    detail:
      'Se registran comprador y propietario. El inmueble toma un código descriptivo (TIPO-DISTRITO-APELLIDO) y su precio en soles, dólares o euros.',
  },
  {
    title: 'Proceso de venta',
    icon: 'lucide:handshake',
    to: '/ventas/procesos/nuevo',
    linkLabel: 'Nuevo proceso',
    detail:
      'Une inmueble, compradores y asesores. Código VENTA-<año>-<código del inmueble> (como ALQUILER-… en Alquileres). Las comisiones en % usan la moneda del inmueble; las fijas, la moneda elegida.',
  },
  {
    title: 'Separación',
    icon: 'lucide:bookmark',
    to: '/ventas/procesos',
    linkLabel: 'Procesos',
    detail:
      'Reserva con dinero desde la ficha del proceso: el inmueble pasa a «Separada». Si vence, vuelve a estar disponible; se puede reactivar.',
  },
  {
    title: 'Etapas legales',
    icon: 'lucide:columns-3',
    to: '/ventas/procesos/pipeline',
    linkLabel: 'Pipeline',
    detail:
      'El proceso avanza por las etapas del pipeline (abajo) y nunca retrocede. Se mueve arrastrando en el pipeline o desde la ficha.',
  },
  {
    title: 'Cumplimiento y cierre',
    icon: 'lucide:circle-check',
    to: '/ventas/procesos',
    linkLabel: 'Procesos',
    detail:
      'Con el checklist legal completo se registra el cierre con su contrato: el proceso queda «Ganado», el inmueble «Vendida» y las comisiones en % se recalculan con el precio final.',
  },
  {
    title: 'Comisiones',
    icon: 'lucide:wallet',
    to: '/ventas/comisiones',
    linkLabel: 'Comisiones',
    detail: 'Se pagan por cuotas o completas, cada una en su moneda. Si la venta cae, se anulan.',
  },
  {
    title: 'Reportes',
    icon: 'lucide:bar-chart-3',
    to: '/ventas/reportes',
    linkLabel: 'Reportes',
    detail: 'Ventas, asesores, conversión y flujo financiero por mes, año o todo el historial, sin mezclar monedas.',
  },
]

const processStates = [
  { label: 'Activo', variant: 'info' as const, detail: 'En curso por las etapas legales' },
  { label: 'Ganado', variant: 'success' as const, detail: 'Cierre registrado: venta concretada' },
  { label: 'Caído', variant: 'error' as const, detail: 'No continuó; se registra el motivo y se anulan comisiones' },
]

// Etapas: orden legal fijo, nombre editable
const { data: boot, isLoading, isError, error, refetch } = useVentasConfigBootstrap()
const { mutate: savePipeline, isPending: savingPipeline } = useVentasSavePipelineStages()
const stageLabels = ref<Record<string, string>>({})
const LEGAL_ORDER = PIPELINE_STAGE_OPTIONS.map((o) => o.value)
const STAGE_HINTS: Record<string, string> = {
  SEPARATION: 'Reserva del inmueble con dinero',
  ARRAS: 'Compromiso con arras',
  MINUTA: 'Minuta firmada ante notaría',
  PUBLIC_DEED: 'Escritura pública e inscripción',
}
watch(
  () => boot.value?.pipelineStages,
  (rows) => {
    stageLabels.value = Object.fromEntries(
      LEGAL_ORDER.map((code) => [
        code,
        rows?.find((r) => r.code === code)?.label ?? PIPELINE_STAGE_OPTIONS.find((o) => o.value === code)!.label,
      ]),
    )
  },
  { immediate: true },
)
const stagesDirty = computed(() =>
  LEGAL_ORDER.some((code) => (boot.value?.pipelineStages.find((r) => r.code === code)?.label ?? '') !== stageLabels.value[code]?.trim()),
)
const stagesValid = computed(() => LEGAL_ORDER.every((code) => !!stageLabels.value[code]?.trim()))
function submitStages() {
  savePipeline(
    LEGAL_ORDER.map((code, i) => ({ code, label: stageLabels.value[code]!.trim(), sortOrder: i, isActive: true })),
  )
}

// ── Parametrización: bancos y medios de pago ──
const channelsQuery = useVentasFinancingChannelsCatalog()
const channels = computed(() => channelsQuery.data.value ?? [])
const groups = computed(() =>
  FINANCING_CHANNEL_CATEGORIES.map((c) => ({ ...c, items: channels.value.filter((x) => x.category === c.value) })),
)
const categoryOptions = FINANCING_CHANNEL_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))

const { mutate: createChannel, isPending: creating } = useVentasCreateFinancingChannel()
const { mutate: updateChannel, isPending: updating } = useVentasUpdateFinancingChannel()

// Modal agregar / editar
const editOpen = ref(false)
const editing = ref<VentasFinancingChannel | null>(null)
const formName = ref('')
const formCategory = ref<FinancingChannelCategory>('BANK')
const formError = ref('')
function openCreate(category: FinancingChannelCategory) {
  editing.value = null
  formName.value = ''
  formCategory.value = category
  formError.value = ''
  editOpen.value = true
}
function openEdit(row: VentasFinancingChannel) {
  editing.value = row
  formName.value = row.name
  formCategory.value = row.category
  formError.value = ''
  editOpen.value = true
}
function submitChannel() {
  const name = formName.value.trim()
  if (!name) {
    formError.value = 'Indique el nombre'
    return
  }
  const done = { onSuccess: () => (editOpen.value = false) }
  if (editing.value) updateChannel({ id: editing.value.id, name, category: formCategory.value }, done)
  else createChannel({ name, category: formCategory.value }, done)
}
function toggleActive(row: VentasFinancingChannel, isActive: boolean) {
  updateChannel({ id: row.id, isActive })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Configuración" subtitle="Cómo funciona una venta y los catálogos que usa" icon="lucide:settings" />

    <BaseTabs v-model="activeTab" :tabs="tabs" />

    <!-- ── Flujo del negocio ── -->
    <div v-if="activeTab === 'flujo'" class="grid gap-6 xl:grid-cols-3">
      <FormSectionCard class="xl:col-span-2" title="Paso a paso de una venta" subtitle="Cada paso enlaza a su pantalla" icon="lucide:route" show-icon>
        <ol class="relative space-y-5">
          <li v-for="(s, i) in flowSteps" :key="s.title" class="relative flex gap-4">
            <div class="flex flex-col items-center">
              <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/12 dark:text-brand-400">
                <AppIcon :icon="s.icon" :size="17" />
              </span>
              <span v-if="i < flowSteps.length - 1" class="mt-1 w-px flex-1 bg-gray-200 dark:bg-gray-800" />
            </div>
            <div class="min-w-0 flex-1 pb-1">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="font-medium text-gray-800 dark:text-white/90">
                  <span class="mr-1 text-theme-xs text-gray-400">{{ i + 1 }}.</span>{{ s.title }}
                </p>
                <BaseButton :to="s.to" variant="ghost" size="sm" icon="lucide:arrow-up-right">{{ s.linkLabel }}</BaseButton>
              </div>
              <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ s.detail }}</p>
            </div>
          </li>
        </ol>
      </FormSectionCard>

      <div class="space-y-6">
        <FormSectionCard title="Etapas del pipeline" subtitle="Orden legal fijo; puede renombrarlas" icon="lucide:columns-3" show-icon>
          <LoadingState v-if="isLoading" />
          <div v-else-if="isError" class="space-y-2 text-sm">
            <p class="text-error-500">{{ getApiErrorMessage(error) }}</p>
            <BaseButton variant="outline" size="sm" @click="() => refetch()">Reintentar</BaseButton>
          </div>
          <form v-else class="space-y-3" @submit.prevent="submitStages">
            <div v-for="(code, i) in LEGAL_ORDER" :key="code" class="flex items-start gap-3">
              <span class="mt-2.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-theme-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {{ i + 1 }}
              </span>
              <FormInput v-model="stageLabels[code]" :hint="STAGE_HINTS[code]" :disabled="!canWrite" class="flex-1" />
            </div>
            <p class="flex items-start gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
              <AppIcon icon="lucide:info" :size="14" class="mt-0.5 shrink-0" />
              Un proceso solo avanza a la etapa siguiente; el nombre cambia en pipeline, listados y fichas.
            </p>
            <BaseButton
              v-if="canWrite"
              type="submit"
              variant="primary"
              icon="lucide:save"
              block
              :disabled="!stagesDirty || !stagesValid"
              :loading="savingPipeline"
            >
              Guardar nombres
            </BaseButton>
          </form>
        </FormSectionCard>

        <FormSectionCard title="Estados del proceso" subtitle="Resultado de cada venta" icon="lucide:flag" show-icon>
          <ul class="space-y-3">
            <li v-for="s in processStates" :key="s.label" class="flex items-start gap-3 text-sm">
              <Badge :variant="s.variant" class="shrink-0">{{ s.label }}</Badge>
              <span class="text-gray-500 dark:text-gray-400">{{ s.detail }}</span>
            </li>
          </ul>
        </FormSectionCard>
      </div>
    </div>

    <!-- ── Parametrización ── -->
    <div v-else class="space-y-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Bancos y medios de pago que se eligen en cada proceso («Banco o medio de pago»). Los inactivos dejan de ofrecerse,
        pero los procesos que ya los usan los conservan.
      </p>
      <LoadingState v-if="channelsQuery.isPending.value" />
      <BaseCard v-else-if="channelsQuery.isError.value" class="block space-y-3 text-center">
        <p class="text-sm text-error-500">{{ getApiErrorMessage(channelsQuery.error.value) }}</p>
        <BaseButton variant="outline" size="sm" @click="() => channelsQuery.refetch()">Reintentar</BaseButton>
      </BaseCard>
      <div v-else class="grid gap-6 lg:grid-cols-2">
        <FormSectionCard
          v-for="g in groups"
          :key="g.value"
          :title="g.label"
          :subtitle="`${g.items.filter((x) => x.isActive).length} activos de ${g.items.length}`"
          :icon="g.icon"
          show-icon
        >
          <template v-if="canWrite" #actions>
            <BaseButton variant="outline" size="sm" icon="lucide:plus" @click="openCreate(g.value)">Agregar</BaseButton>
          </template>
          <ul v-if="g.items.length" class="divide-y divide-gray-100 dark:divide-gray-800">
            <li v-for="c in g.items" :key="c.id" class="flex items-center gap-3 py-2.5">
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium" :class="c.isActive ? 'text-gray-800 dark:text-white/90' : 'text-gray-400 line-through dark:text-gray-500'">
                  {{ c.name }}
                </p>
                <p class="text-theme-xs text-gray-400 dark:text-gray-500">
                  {{ c.usage ? `${c.usage} ${c.usage === 1 ? 'proceso' : 'procesos'}` : 'Sin uso' }}
                </p>
              </div>
              <BaseButton v-if="canWrite" variant="ghost" size="sm" icon="lucide:pencil" :aria-label="`Editar ${c.name}`" @click="openEdit(c)" />
              <Switch
                :model-value="c.isActive"
                :disabled="!canWrite || updating"
                :aria-label="c.isActive ? `Desactivar ${c.name}` : `Activar ${c.name}`"
                @update:model-value="(v: boolean) => toggleActive(c, v)"
              />
            </li>
          </ul>
          <p v-else class="text-sm text-gray-400 dark:text-gray-500">Sin registros.</p>
        </FormSectionCard>
      </div>
    </div>

    <BaseModal v-model="editOpen" :title="editing ? 'Editar banco o medio de pago' : 'Agregar banco o medio de pago'" size="sm">
      <form id="channel-form" class="space-y-4" @submit.prevent="submitChannel">
        <FormSelect v-model="formCategory" label="Categoría" :options="categoryOptions" required />
        <FormInput v-model="formName" label="Nombre" placeholder="Ej. Interbank, Yape, Crédito hipotecario" :error="formError" required />
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="outline" @click="editOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" form="channel-form" variant="primary" icon="lucide:save" :loading="creating || updating">
            Guardar
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
