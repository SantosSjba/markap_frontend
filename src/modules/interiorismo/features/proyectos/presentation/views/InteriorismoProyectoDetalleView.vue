<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatMoney } from '@shared/utils/money'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { useInteriorProjectDetail } from '../composables/useInteriorProjects'
import { useInteriorProjectStageOptions } from '../composables/useInteriorProjectStageOptions'
import { PROJECT_TYPE_LABELS, projectStatusLabel } from '../labels'
import ProjectBudgetTab from '../../../proyecto-presupuesto/presentation/components/ProjectBudgetTab.vue'
import ProjectPurchasesTab from '../../../proyecto-presupuesto/presentation/components/ProjectPurchasesTab.vue'
import ProjectSettlementTab from '../../../proyecto-presupuesto/presentation/components/ProjectSettlementTab.vue'
import ProjectBudgetAlerts from '../../../proyecto-presupuesto/presentation/components/ProjectBudgetAlerts.vue'
import type { PurchasesView } from '../../../proyecto-presupuesto/domain/purchases-views'
import {
  useProjectBudget,
  useProjectSettlement,
} from '../../../proyecto-presupuesto/presentation/composables/useProjectBudget'
import ProjectSummaryTab from '../components/detail/ProjectSummaryTab.vue'
import ProjectExecutionPanel from '../../../ejecucion/presentation/components/ProjectExecutionPanel.vue'
import InteriorDocumentsTable from '../../../documentos/presentation/components/InteriorDocumentsTable.vue'
import ProjectActivityTab from '../components/detail/ProjectActivityTab.vue'
/**
 * Ficha del proyecto: encabezado con etapa, cifras clave en la moneda del proyecto y pestañas
 * sueltas (sin tarjeta envolvente); cada pestaña es su propio componente y se recuerda en `?tab=`.
 */

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const TABS = [
  { id: 'resumen', label: 'Resumen', icon: 'lucide:layout-dashboard' },
  { id: 'presupuesto', label: 'Presupuesto', icon: 'lucide:file-spreadsheet' },
  { id: 'compras', label: 'Compras y contrataciones', icon: 'lucide:shopping-cart' },
  { id: 'liquidacion', label: 'Liquidación', icon: 'lucide:pie-chart' },
  { id: 'ejecucion', label: 'Ejecución', icon: 'lucide:hammer' },
  { id: 'documentos', label: 'Documentos', icon: 'lucide:files' },
  { id: 'actividad', label: 'Actividad', icon: 'lucide:history' },
] as const
type TabId = (typeof TABS)[number]['id']
const isTab = (t: unknown): t is TabId => TABS.some((x) => x.id === t)

/** Vista de Compras pedida desde una alerta (p. ej. «Sin proveedor») */
const purchasesView = ref<PurchasesView | null>(null)
async function onAlert(target: { tab: 'compras' | 'liquidacion'; view?: PurchasesView }) {
  // Se limpia primero para que la misma alerta vuelva a aplicar su vista aunque el usuario la cambió
  purchasesView.value = null
  activeTab.value = target.tab
  await nextTick()
  purchasesView.value = target.view ?? null
}

const activeTab = ref<TabId>(isTab(route.query.tab) ? route.query.tab : 'resumen')
watch(
  () => route.query.tab,
  (t) => {
    if (isTab(t)) activeTab.value = t
  },
)
watch(activeTab, (tab) => {
  if (route.query.tab !== tab) router.replace({ query: { ...route.query, tab } })
})

const { data: p, isLoading, isError, error, refetch } = useInteriorProjectDetail(id)
const { data: budget, isLoading: budgetLoading, isError: budgetError } = useProjectBudget(id)
const { data: settlement } = useProjectSettlement(id)
const { stageLabelMap } = useInteriorProjectStageOptions()

// ── Cifras clave (en la moneda del proyecto) ──
const currency = computed(() => budget.value?.budget.currency ?? p.value?.currency ?? 'PEN')
const budgetTotal = computed(() => {
  const fromBudget = budget.value?.totals.total
  return fromBudget ? fromBudget : (p.value?.estimatedBudget ?? null)
})
const budgetSubtitle = computed(() => {
  const items = budget.value?.rows.filter((r) => r.kind === 'ITEM').length ?? 0
  return budget.value?.totals.total ? `${items} partidas · v${budget.value.budget.version}` : 'estimado'
})
const paid = computed(() => settlement.value?.totalClientPaid ?? p.value?.paidTotal ?? 0)
const pending = computed(() =>
  settlement.value ? settlement.value.pendingToCollect : budgetTotal.value != null ? budgetTotal.value - paid.value : null,
)
const paidPct = computed(() =>
  budgetTotal.value ? `${Math.min(100, Math.round((paid.value / budgetTotal.value) * 100))}% del total` : 'del cliente',
)

const STATUS_BADGE = {
  DESIGN: 'neutral',
  QUOTE: 'warning',
  APPROVED: 'info',
  IN_PROGRESS: 'primary',
  FINISHED: 'success',
  CANCELLED: 'error',
} as const

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/proyectos`)
const goEdit = () => router.push(`${INTERIORISMO_BASE_PATH}/proyectos/${id.value}/editar`)
const goCalendar = () => router.push({ path: `${INTERIORISMO_BASE_PATH}/calendario`, query: { projectId: id.value } })
</script>

<template>
  <div>
    <PageHeader
      :title="p?.name ?? 'Proyecto'"
      :subtitle="p ? `${p.code} · ${p.client.fullName}` : 'Ficha del proyecto'"
      back
      class="mb-6"
      @back="goBack"
    >
      <template #actions>
        <div v-if="p" class="flex shrink-0 flex-wrap items-center gap-2">
          <Badge variant="neutral">{{ PROJECT_TYPE_LABELS[p.projectType] }}</Badge>
          <Badge :variant="STATUS_BADGE[p.status]">{{ projectStatusLabel(p.status, stageLabelMap) }}</Badge>
          <BaseButton v-if="canWrite" variant="primary" size="sm" icon="lucide:pencil" @click="goEdit">Editar</BaseButton>
        </div>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading" text="Cargando proyecto..." class="py-24" />

    <div v-else-if="isError || !p" class="flex flex-col items-center justify-center gap-3 py-16">
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="max-w-md text-center text-sm font-medium text-error-500 dark:text-error-400">
        {{ isError ? getApiErrorMessage(error) : 'No se encontró el proyecto.' }}
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <BaseButton v-if="isError" variant="outline" size="sm" @click="() => refetch()">Reintentar</BaseButton>
        <BaseButton variant="outline" size="sm" @click="goBack">Volver al listado</BaseButton>
      </div>
    </div>

    <div v-else class="space-y-6">
      <!-- ── Cifras clave ── -->
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatsCard compact title="Presupuesto" :value="formatMoney(budgetTotal, currency)" :subtitle="budgetSubtitle" :loading="budgetLoading">
          <template #icon><AppIcon icon="lucide:file-spreadsheet" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="Cobrado" :value="formatMoney(paid, currency)" :subtitle="paidPct">
          <template #icon><AppIcon icon="lucide:wallet" :size="20" /></template>
        </StatsCard>
        <StatsCard
          compact
          :title="pending != null && pending < 0 ? 'Saldo a favor' : 'Por cobrar'"
          :value="formatMoney(pending != null ? Math.abs(pending) : null, currency)"
          :subtitle="pending != null && pending < 0 ? 'cobrado de más al cliente' : 'saldo del cliente'"
        >
          <template #icon><AppIcon icon="lucide:hourglass" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="Avance" :value="`${Math.round(p.progressPct)}%`" :subtitle="`${p.milestones.filter((m) => m.completedAt).length}/${p.milestones.length} hitos`">
          <template #icon><AppIcon icon="lucide:gauge" :size="20" /></template>
        </StatsCard>
      </div>

      <!-- ── Pestañas + alertas financieras (botón con contador) ── -->
      <div class="flex items-end gap-3">
        <BaseTabs v-model="activeTab" :tabs="TABS" class="min-w-0 flex-1" />
        <ProjectBudgetAlerts v-if="budget" class="mb-1.5" :budget="budget" :settlement="settlement" @go="onAlert" />
      </div>

      <ProjectSummaryTab v-if="activeTab === 'resumen'" :project="p" />

      <template v-else-if="activeTab === 'presupuesto'">
        <LoadingState v-if="budgetLoading" />
        <p v-else-if="budgetError" class="py-12 text-center text-sm text-gray-400 dark:text-gray-500">No se pudo cargar el presupuesto.</p>
        <ProjectBudgetTab v-else-if="budget" :project-id="p.id" :budget="budget" :can-write="canWrite" />
      </template>

      <template v-else-if="activeTab === 'compras'">
        <LoadingState v-if="budgetLoading" />
        <ProjectPurchasesTab v-else-if="budget" :project-id="p.id" :budget="budget" :can-write="canWrite" :view="purchasesView" />
      </template>

      <ProjectSettlementTab v-else-if="activeTab === 'liquidacion'" :project-id="p.id" :payments="p.payments" />

      <ProjectExecutionPanel v-else-if="activeTab === 'ejecucion'" :project-id="p.id" @open-calendar="goCalendar" @go-tab="(t) => isTab(t) && (activeTab = t)" />

      <InteriorDocumentsTable v-else-if="activeTab === 'documentos'" :project-id="p.id" />

      <ProjectActivityTab v-else-if="activeTab === 'actividad'" :project-id="p.id" :activities="p.activities" />
    </div>
  </div>
</template>
