<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, BaseTabs, Badge, StatsCard, AppIcon } from '@shared/components'
import { useArquitecturaProjectDetail } from '../../application/useArquitecturaProjects'
import {
  ProjectBudgetTab,
  ProjectPurchasesTab,
  ProjectSettlementTab,
  ProjectBudgetAlerts,
  useProjectBudget,
  useProjectSettlement,
} from '@modules/arquitectura/features/proyecto-presupuesto'
import { PROJECT_TYPE_LABELS, projectStatusLabel, formatSol } from '../labels'
import { useArquitecturaProjectStageOptions } from '../../application/useArquitecturaProjectStageOptions'
import { ARQUITECTURA_BASE_PATH } from '@modules/arquitectura/config/routes.constants'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const TAB_IDS = ['resumen', 'presupuesto', 'compras', 'liquidacion'] as const
type TabId = (typeof TAB_IDS)[number]

const activeTab = ref<TabId>('resumen')

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
]

const goBack = () => router.push(`${ARQUITECTURA_BASE_PATH}/proyectos`)

const goEditProject = () => {
  if (!p.value) return
  router.push(`${ARQUITECTURA_BASE_PATH}/proyectos/${p.value.id}/editar`)
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1200px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start gap-3">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)] shrink-0"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div class="flex-1 min-w-0 flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
              {{ p?.name ?? 'Proyecto' }}
            </h1>
            <Badge v-if="p" variant="neutral">{{ p.code }}</Badge>
            <Badge v-if="p" variant="info">{{ PROJECT_TYPE_LABELS[p.projectType] }}</Badge>
            <Badge v-if="p" variant="success">{{ projectStatusLabel(p.status, stageLabelMap) }}</Badge>
          </div>
          <p v-if="p" class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
            Cliente: {{ p.client.fullName }} · {{ p.client.documentNumber }}
          </p>
        </div>
        <BaseButton
          v-if="p"
          variant="outline"
          type="button"
          class="shrink-0"
          @click="goEditProject"
        >
          <AppIcon icon="lucide:pencil" :size="18" class="mr-1.5" />
          Editar
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
    </div>
    <div v-else-if="isError || !p" class="text-center py-16 text-sm" style="color: var(--color-text-secondary)">
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
      <div
        class="rounded-xl border overflow-hidden"
        :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
      >
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
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div
                class="p-4 rounded-lg border space-y-2"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <h3 class="font-semibold" :style="{ color: 'var(--color-text-primary)' }">Ubicación y fechas</h3>
                <p :style="{ color: 'var(--color-text-secondary)' }">
                  {{ p.addressLine ?? 'Sin dirección' }}
                </p>
                <p v-if="p.city" :style="{ color: 'var(--color-text-secondary)' }">Ciudad: {{ p.city }}</p>
                <p :style="{ color: 'var(--color-text-secondary)' }">
                  Inicio: {{ p.startDate ?? '—' }} · Fin est.: {{ p.estimatedEndDate ?? '—' }}
                </p>
                <p :style="{ color: 'var(--color-text-secondary)' }">
                  Área: {{ p.areaSqm != null ? `${p.areaSqm} m²` : '—' }} · Niveles:
                  {{ p.levelsCount ?? '—' }}
                </p>
                <p v-if="p.environmentsNote" :style="{ color: 'var(--color-text-secondary)' }">
                  Ambientes: {{ p.environmentsNote }}
                </p>
              </div>
              <div
                class="p-4 rounded-lg border space-y-2"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <h3 class="font-semibold" :style="{ color: 'var(--color-text-primary)' }">Responsables</h3>
                <ul class="space-y-1" :style="{ color: 'var(--color-text-secondary)' }">
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
            <div v-if="budgetLoading" class="flex justify-center py-16">
              <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
            </div>
            <div v-else-if="budgetError" class="text-center py-12 text-sm" :style="{ color: 'var(--color-text-muted)' }">
              No se pudo cargar el presupuesto.
            </div>
            <ProjectBudgetTab v-else-if="budget" :project-id="p.id" :budget="budget" />
          </div>

          <div v-show="activeTab === 'compras'" class="space-y-4">
            <div v-if="budgetLoading" class="flex justify-center py-16">
              <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
            </div>
            <div v-else-if="!budget?.sections.length" class="text-center py-12 text-sm" :style="{ color: 'var(--color-text-muted)' }">
              Crea partidas en la pestaña Presupuesto para gestionar compras.
            </div>
            <ProjectPurchasesTab v-else-if="budget" :project-id="p.id" :budget="budget" />
          </div>

          <div v-show="activeTab === 'liquidacion'">
            <ProjectSettlementTab :project-id="p.id" :payments="p.payments ?? []" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
