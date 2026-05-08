<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, BaseTabs, Badge, StatsCard, AppIcon, DataTable } from '@shared/components'
import { useInteriorProjectDetail } from '../../application/useInteriorProjects'
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS, formatSol } from '../labels'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const activeTab = ref('resumen')

const { data: p, isLoading, isError } = useInteriorProjectDetail(id)

const tabs = [
  { id: 'resumen', label: 'Resumen', icon: 'lucide:layout-dashboard' },
  { id: 'presupuestos', label: 'Presupuestos', icon: 'lucide:file-text' },
  { id: 'ejecucion', label: 'Ejecución', icon: 'lucide:flame' },
  { id: 'materiales', label: 'Materiales', icon: 'lucide:layers' },
  { id: 'finanzas', label: 'Finanzas', icon: 'lucide:wallet' },
  { id: 'documentos', label: 'Documentos', icon: 'lucide:files' },
  { id: 'actividad', label: 'Actividad', icon: 'lucide:history' },
]

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/proyectos`)

const activityLabel = (t: string) => {
  const m: Record<string, string> = {
    NOTE: 'Nota',
    STATUS_CHANGE: 'Cambio de estado',
    MEETING: 'Reunión',
    TASK: 'Tarea',
    OTHER: 'Otro',
  }
  return m[t] ?? t
}

const budgetCols = [
  { key: 'code', label: 'Código', align: 'left' as const },
  { key: 'version', label: 'Ver.', align: 'left' as const },
  { key: 'title', label: 'Título', align: 'left' as const },
  { key: 'amount', label: 'Monto', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
]

const goBudgetDetail = (budgetId: string) =>
  router.push(`${INTERIORISMO_BASE_PATH}/presupuestos/${budgetId}`)
const goNewBudgetForProject = () => {
  if (!p.value) return
  router.push({
    path: `${INTERIORISMO_BASE_PATH}/presupuestos/nuevo`,
    query: { clientId: p.value.client.id, projectId: p.value.id },
  })
}

const goExecutionBoard = () => {
  if (!p.value) return
  router.push(`${INTERIORISMO_BASE_PATH}/ejecucion/${p.value.id}`)
}

const goFinanceBoard = () => {
  if (!p.value) return
  router.push(`${INTERIORISMO_BASE_PATH}/finanzas/${p.value.id}`)
}

const materialCols = [
  { key: 'name', label: 'Material', align: 'left' as const },
  { key: 'qty', label: 'Cant.', align: 'left' as const },
  { key: 'cost', label: 'Costo est.', align: 'left' as const },
]

const paymentCols = [
  { key: 'paidAt', label: 'Fecha', align: 'left' as const },
  { key: 'concept', label: 'Concepto', align: 'left' as const },
  { key: 'amount', label: 'Monto', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
]

const docCols = [
  { key: 'type', label: 'Tipo', align: 'left' as const },
  { key: 'title', label: 'Título', align: 'left' as const },
]

function milestoneDone(m: { completedAt: string | null }) {
  return !!m.completedAt
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
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
            {{ p?.name ?? 'Proyecto' }}
          </h1>
          <Badge v-if="p" variant="neutral">{{ p.code }}</Badge>
          <Badge v-if="p" variant="info">{{ PROJECT_TYPE_LABELS[p.projectType] }}</Badge>
          <Badge v-if="p" variant="success">{{ PROJECT_STATUS_LABELS[p.status] }}</Badge>
        </div>
        <p v-if="p" class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Cliente: {{ p.client.fullName }} · {{ p.client.documentNumber }}
        </p>
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
                  <li>Arquitecto: {{ p.architectAgent?.fullName ?? '—' }}</li>
                  <li>Supervisor: {{ p.supervisorAgent?.fullName ?? '—' }}</li>
                  <li>Asesor comercial: {{ p.commercialAgent?.fullName ?? '—' }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div v-show="activeTab === 'presupuestos'" class="space-y-3">
            <div class="flex justify-end">
              <BaseButton size="sm" variant="primary" @click="goNewBudgetForProject">
                Nuevo presupuesto
              </BaseButton>
            </div>
            <DataTable
              empty-text="Sin presupuestos asociados."
              :columns="budgetCols"
              :data="
                p.budgets.map((b) => ({
                  ...b,
                  code: b.code ?? '—',
                  version: `v${b.version}`,
                  title: b.title ?? '—',
                  amount: formatSol(b.totalAmount),
                  status: b.status,
                }))
              "
              row-key="id"
            >
              <template #row="{ row }">
                <td
                  class="py-2 px-3 text-sm cursor-pointer hover:underline"
                  @click="goBudgetDetail((row as { id: string }).id)"
                >
                  {{ (row as any).code }}
                </td>
                <td
                  class="py-2 px-3 text-sm cursor-pointer"
                  @click="goBudgetDetail((row as { id: string }).id)"
                >
                  {{ (row as any).version }}
                </td>
                <td
                  class="py-2 px-3 text-sm cursor-pointer"
                  @click="goBudgetDetail((row as { id: string }).id)"
                >
                  {{ (row as any).title }}
                </td>
                <td
                  class="py-2 px-3 text-sm cursor-pointer"
                  @click="goBudgetDetail((row as { id: string }).id)"
                >
                  {{ (row as any).amount }}
                </td>
                <td class="py-2 px-3 cursor-pointer" @click="goBudgetDetail((row as { id: string }).id)">
                  <Badge variant="neutral">{{ (row as any).status }}</Badge>
                </td>
              </template>
            </DataTable>
          </div>

          <div v-show="activeTab === 'ejecucion'" class="space-y-4">
            <div class="flex justify-end">
              <BaseButton variant="primary" size="sm" @click="goExecutionBoard">
                Abrir tablero de ejecución
              </BaseButton>
            </div>
            <div
              class="p-4 rounded-lg border"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
                Avance global del proyecto
              </p>
              <div class="mt-2 h-3 rounded-full overflow-hidden" style="background: var(--color-border)">
                <div
                  class="h-full rounded-full transition-all"
                  :style="{
                    background: 'var(--color-primary)',
                    width: `${Math.min(100, Math.max(0, p.progressPct))}%`,
                  }"
                />
              </div>
              <p class="text-xs mt-2" :style="{ color: 'var(--color-text-muted)' }">
                Relacionado con obra e hitos del cronograma.
              </p>
            </div>
            <div>
              <h3 class="text-sm font-semibold mb-2" :style="{ color: 'var(--color-text-primary)' }">
                Cronograma
              </h3>
              <ul class="space-y-2">
                <li
                  v-for="m in p.milestones"
                  :key="m.id"
                  class="flex items-center justify-between gap-3 p-3 rounded-lg border text-sm"
                  :style="{ borderColor: 'var(--color-border)' }"
                >
                  <span :style="{ color: 'var(--color-text-primary)' }">{{ m.title }}</span>
                  <span class="shrink-0 flex items-center gap-2">
                    <span :style="{ color: 'var(--color-text-muted)' }">{{ m.plannedDate }}</span>
                    <Badge :variant="milestoneDone(m) ? 'success' : 'warning'">
                      {{ milestoneDone(m) ? 'Hecho' : 'Pendiente' }}
                    </Badge>
                  </span>
                </li>
              </ul>
              <p v-if="!p.milestones.length" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
                Sin hitos registrados.
              </p>
            </div>
          </div>

          <div v-show="activeTab === 'materiales'">
            <DataTable
              empty-text="Sin materiales registrados."
              :columns="materialCols"
              :data="
                p.materials.map((m) => ({
                  ...m,
                  qty:
                    m.quantity != null && m.unit
                      ? `${m.quantity} ${m.unit}`
                      : m.quantity != null
                        ? String(m.quantity)
                        : '—',
                  cost: formatSol(m.estimatedCost),
                }))
              "
              row-key="id"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm">{{ (row as any).name }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).qty }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).cost }}</td>
              </template>
            </DataTable>
          </div>

          <div v-show="activeTab === 'finanzas'" class="space-y-4">
            <div class="flex justify-end">
              <BaseButton variant="primary" size="sm" @click="goFinanceBoard">
                Abrir panel financiero completo
              </BaseButton>
            </div>
            <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              Vista rápida de pagos registrados. Adelantos, cuotas, flujo de caja y rentabilidad están en el panel financiero.
            </p>
            <DataTable
              empty-text="Sin pagos registrados."
              :columns="paymentCols"
              :data="
                p.payments.map((x) => ({
                  ...x,
                  paidAt: new Date(x.paidAt).toLocaleDateString('es-PE'),
                  amount: formatSol(x.amount),
                }))
              "
              row-key="id"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm">{{ (row as any).paidAt }}</td>
                <td class="py-2 px-3 text-sm max-w-[280px] truncate">{{ (row as any).concept }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).amount }}</td>
                <td class="py-2 px-3"><Badge variant="neutral">{{ (row as any).status }}</Badge></td>
              </template>
            </DataTable>
          </div>

          <div v-show="activeTab === 'documentos'">
            <DataTable
              empty-text="Sin documentos."
              :columns="docCols"
              :data="p.documents.map((d) => ({ ...d, type: d.docType }))"
              row-key="id"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm">{{ (row as any).type }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).title }}</td>
              </template>
            </DataTable>
          </div>

          <div v-show="activeTab === 'actividad'" class="space-y-3">
            <div
              v-for="a in p.activities"
              :key="a.id"
              class="p-4 rounded-lg border text-sm"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <div class="flex flex-wrap items-center gap-2 mb-1">
                <Badge variant="neutral">{{ activityLabel(a.activityType) }}</Badge>
                <span class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
                  {{ new Date(a.occurredAt).toLocaleString('es-PE') }}
                </span>
              </div>
              <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ a.title }}</p>
              <p v-if="a.description" class="mt-1 whitespace-pre-wrap" :style="{ color: 'var(--color-text-secondary)' }">
                {{ a.description }}
              </p>
            </div>
            <p v-if="!p.activities.length" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
              Sin actividad registrada.
            </p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
