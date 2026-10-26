<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('arquitectura')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { useArquitecturaProjectDetail } from '../composables/useArquitecturaProjects'
import ProjectBudgetTab from '../../../proyecto-presupuesto/presentation/components/ProjectBudgetTab.vue'
import ProjectPurchasesTab from '../../../proyecto-presupuesto/presentation/components/ProjectPurchasesTab.vue'
import ProjectSettlementTab from '../../../proyecto-presupuesto/presentation/components/ProjectSettlementTab.vue'
import ProjectBudgetAlerts from '../../../proyecto-presupuesto/presentation/components/ProjectBudgetAlerts.vue'
import {
  useProjectBudget,
  useProjectSettlement,
} from '../../../proyecto-presupuesto/presentation/composables/useProjectBudget'
import ArquitecturaFinanzasTableroView from '../../../finanzas/presentation/views/ArquitecturaFinanzasTableroView.vue'
import { PROJECT_TYPE_LABELS, projectStatusLabel, formatSol } from '../labels'
import { useArquitecturaProjectStageOptions } from '../composables/useArquitecturaProjectStageOptions'
import { ARQUITECTURA_BASE_PATH } from '../../../../config/routes.constants'
const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const TAB_IDS = ['resumen', 'presupuesto', 'compras', 'liquidacion', 'documentos'] as const
type TabId = (typeof TAB_IDS)[number]

const activeTab = ref<TabId>('resumen')

const financeSubTab = ref<'liquidacion' | 'panel'>('liquidacion')
const financeSubTabs = [
  { id: 'liquidacion', label: 'Liquidación', icon: 'lucide:pie-chart' },
  { id: 'panel', label: 'Ingresos y flujo', icon: 'lucide:banknote' },
]

const { data: p, isLoading, isError } = useArquitecturaProjectDetail(id)
const { data: budget, isLoading: budgetLoading, isError: budgetError } = useProjectBudget(id)
const { data: settlement } = useProjectSettlement(id)

watch(
  () => route.query.tab,
  (tab) => {
    if (typeof tab === 'string' && TAB_IDS.includes(tab as TabId)) {
      activeTab.value = tab as TabId
    }
  },
  { immediate: true },
)

watch(activeTab, (tab) => {
  if (route.query.tab === tab) return
  router.replace({ query: { ...route.query, tab } })
})

const { stageLabelMap } = useArquitecturaProjectStageOptions()

const tabs = [
  { id: 'resumen', label: 'Resumen', icon: 'lucide:layout-dashboard' },
  { id: 'presupuesto', label: 'Presupuesto', icon: 'lucide:file-spreadsheet' },
  { id: 'compras', label: 'Compras', icon: 'lucide:shopping-cart' },
  { id: 'liquidacion', label: 'Liquidación', icon: 'lucide:pie-chart' },
  { id: 'documentos', label: 'Documentos', icon: 'lucide:files' },
]

const docCols = [
  { key: 'type', label: 'Tipo', align: 'left' as const },
  { key: 'title', label: 'Título', align: 'left' as const },
]

const goBack = () => router.push(`${ARQUITECTURA_BASE_PATH}/proyectos`)

const goEditProject = () => {
  if (!p.value) return
  router.push(`${ARQUITECTURA_BASE_PATH}/proyectos/${p.value.id}/editar`)
}

const goExecutionBoard = () => {
  if (!p.value) return
  router.push(`${ARQUITECTURA_BASE_PATH}/ejecucion/${p.value.id}`)
}

const goProjectCronograma = () => {
  if (!p.value) return
  router.push({ path: `${ARQUITECTURA_BASE_PATH}/cronograma`, query: { projectId: p.value.id } })
}
</script>

<template>
  <div class="max-w-[1200px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start gap-3">
      <IconButton @click="goBack" icon="lucide:arrow-left" label="Volver" />
      <PageHeader
        :title="p?.name ?? 'Proyecto'"
        :subtitle="p ? `Cliente: ${p.client.fullName} · ${p.client.documentNumber}` : undefined"
      >
        <template #badges>
          <Badge v-if="p" variant="neutral">{{ p.code }}</Badge>
          <Badge v-if="p" variant="info">{{ PROJECT_TYPE_LABELS[p.projectType] }}</Badge>
          <Badge v-if="p" variant="success">{{ projectStatusLabel(p.status, stageLabelMap) }}</Badge>
        </template>
        <template #actions>
          <BaseButton
          v-if="(p) && canWrite"
          variant="outline"
          type="button"
          class="shrink-0"
          @click="goEditProject"
        >
          <AppIcon icon="lucide:pencil" :size="18" class="mr-1.5" />
          Editar
        </BaseButton>
        </template>
      </PageHeader>
    </div>

    <LoadingState v-if="isLoading" class="py-20" />
    <div v-else-if="isError || !p" class="text-center py-16 text-sm text-gray-500 dark:text-gray-400">
      No se encontró el proyecto.
      <div class="mt-4">
        <BaseButton variant="outline" @click="goBack">Volver al listado</BaseButton>
      </div>
    </div>

    <template v-else>
      <ProjectBudgetAlerts
        v-if="budget && settlement"
        class="mb-2"
        :budget="budget"
        :settlement="settlement"
      />
      <BaseCard padding="none" class="block overflow-hidden">
        <BaseTabs v-model="activeTab" :tabs="tabs" />
        <div class="p-5 space-y-6">
          <div v-show="activeTab === 'resumen'" class="space-y-6">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatsCard title="Avance" :value="`${Math.round(p.progressPct)}%`">
                <template #icon><AppIcon icon="lucide:gauge" :size="20" color="var(--color-primary)" /></template>
              </StatsCard>
              <StatsCard title="Presupuesto est." :value="formatSol(p.estimatedBudget)">
                <template #icon><AppIcon icon="lucide:wallet" :size="20" color="#2563eb" /></template>
              </StatsCard>
              <StatsCard title="Costo proyectado" :value="formatSol(p.projectedCost)">
                <template #icon><AppIcon icon="lucide:calculator" :size="20" color="#16a34a" /></template>
              </StatsCard>
              <StatsCard title="Margen esp." :value="p.expectedMargin != null ? `${p.expectedMargin}%` : '—'">
                <template #icon><AppIcon icon="lucide:trending-up" :size="20" color="#d97706" /></template>
              </StatsCard>
            </div>
            <div class="flex flex-wrap justify-end gap-2">
              <BaseButton variant="outline" size="sm" type="button" @click="goProjectCronograma">
                Ver cronograma del proyecto
              </BaseButton>
              <BaseButton variant="primary" size="sm" type="button" @click="goExecutionBoard">
                Abrir tablero de ejecución
              </BaseButton>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div
                class="p-4 rounded-lg border space-y-2 border-gray-200 dark:border-gray-800"
              >
                <h3 class="font-semibold text-gray-800 dark:text-white/90">Ubicación y fechas</h3>
                <p class="text-gray-500 dark:text-gray-400">
                  {{ p.addressLine ?? 'Sin dirección' }}
                </p>
                <p class="text-gray-500 dark:text-gray-400" v-if="p.city">Ciudad: {{ p.city }}</p>
                <p class="text-gray-500 dark:text-gray-400">
                  Inicio: {{ p.startDate ?? '—' }} · Fin est.: {{ p.estimatedEndDate ?? '—' }}
                </p>
                <p class="text-gray-500 dark:text-gray-400">
                  Área: {{ p.areaSqm != null ? `${p.areaSqm} m²` : '—' }} · Niveles:
                  {{ p.levelsCount ?? '—' }}
                </p>
                <p class="text-gray-500 dark:text-gray-400" v-if="p.environmentsNote">
                  Ambientes: {{ p.environmentsNote }}
                </p>
              </div>
              <div
                class="p-4 rounded-lg border space-y-2 border-gray-200 dark:border-gray-800"
              >
                <h3 class="font-semibold text-gray-800 dark:text-white/90">Responsables</h3>
                <ul class="space-y-1 text-gray-500 dark:text-gray-400">
                  <li>Diseñador: {{ p.designerAgent?.fullName ?? '—' }}</li>
                  <li>Arquitecto Jr: {{ p.architectJrAgent?.fullName ?? '—' }}</li>
                  <li>Arquitecto Sr: {{ p.architectSrAgent?.fullName ?? '—' }}</li>
                  <li>Supervisor: {{ p.supervisorAgent?.fullName ?? '—' }}</li>
                  <li>Asesor comercial: {{ p.commercialAgent?.fullName ?? '—' }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div v-show="activeTab === 'presupuesto'" class="space-y-4">
            <LoadingState v-if="budgetLoading" />
            <div v-else-if="budgetError" class="text-center py-12 text-sm text-gray-400 dark:text-gray-500">
              No se pudo cargar el presupuesto.
            </div>
            <ProjectBudgetTab v-else-if="budget" :project-id="p.id" :budget="budget" />
          </div>

          <div v-show="activeTab === 'compras'" class="space-y-4">
            <LoadingState v-if="budgetLoading" />
            <div v-else-if="!budget?.sections.length" class="text-center py-12 text-sm text-gray-400 dark:text-gray-500">
              Crea partidas en la pestaña Presupuesto para gestionar compras.
            </div>
            <ProjectPurchasesTab v-else-if="budget" :project-id="p.id" :budget="budget" />
          </div>

          <div v-show="activeTab === 'liquidacion'" class="space-y-4">
            <BaseTabs v-model="financeSubTab" :tabs="financeSubTabs" />
            <ProjectSettlementTab
              v-show="financeSubTab === 'liquidacion'"
              :project-id="p.id"
              :payments="p.payments ?? []"
            />
            <ArquitecturaFinanzasTableroView
              v-show="financeSubTab === 'panel'"
              :project-id="p.id"
              embedded
            />
          </div>

          <div v-show="activeTab === 'documentos'">
            <DataTable
              empty-text="Sin documentos."
              :columns="docCols"
              :data="(p.documents ?? []).map((d) => ({ ...d, type: d.docType }))"
              row-key="id"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm">{{ (row as any).type }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).title }}</td>
              </template>
            </DataTable>
          </div>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
