<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import ActionCard from '@shared/presentation/components/ui/ActionCard.vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
import { useProduccionReportsDashboard } from '../../features/reportes/presentation/composables/useProduccionReportes'
import { type ProduccionReportesRangeParams } from '../../features/reportes/domain/reportes.types'
import type { ProduccionReportsActivityItem } from '../../features/reportes/domain/reportes.types'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { parseCalendarDate, toCalendarDateString, formatDate } from '@shared/utils/formatters'
const router = useRouter()
const authStore = useAuthStore()

function currentMonthRange(): ProduccionReportesRangeParams {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  return {
    startDate: toCalendarDateString(start),
    endDate: toCalendarDateString(end),
  }
}

const rangeParams = ref<ProduccionReportesRangeParams>(currentMonthRange())
const dashboardQuery = useProduccionReportsDashboard(rangeParams, { toastOnLoadError: false })
const d = computed(() => dashboardQuery.data.value)

const greetingHour = new Date().getHours()
const greeting =
  greetingHour < 12 ? 'Buenos días' : greetingHour < 19 ? 'Buenas tardes' : 'Buenas noches'
const firstName = computed(() => authStore.user?.firstName ?? 'Usuario')

const periodLabel = computed(() => {
  const r = rangeParams.value
  const a = parseCalendarDate(r.startDate)
  const b = parseCalendarDate(r.endDate)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const start = formatDate(a, opts)
  const end = formatDate(b, { ...opts, month: 'long', year: 'numeric' })
  return `${start} – ${end}`
})

const acciones = [
  {
    label: 'Nueva OT',
    sub: 'Orden de trabajo',
    to: '/produccion/ordenes-trabajo/nueva',
    icon: 'lucide:clipboard-plus' as const,
  },
  {
    label: 'Nueva cotización',
    sub: 'Ventas',
    to: '/produccion/ventas/cotizaciones/nueva',
    icon: 'lucide:file-text' as const,
  },
  {
    label: 'Nuevo mueble',
    sub: 'Catálogo',
    to: '/produccion/catalogo/nuevo',
    icon: 'lucide:boxes' as const,
  },
  {
    label: 'Inventario',
    sub: 'Stock y movimientos',
    to: '/produccion/inventario/stock',
    icon: 'lucide:warehouse' as const,
  },
  {
    label: 'En planta',
    sub: 'Seguimiento',
    to: '/produccion/produccion/en-proceso',
    icon: 'lucide:kanban' as const,
  },
  {
    label: 'Reportes',
    sub: 'Indicadores',
    to: '/produccion/reportes',
    icon: 'lucide:bar-chart-3' as const,
  },
]

function formatRelativeTime(iso: string) {
  const then = new Date(iso).getTime()
  const diffMs = Date.now() - then
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Hace 1 día'
  if (days < 7) return `Hace ${days} días`
  return formatDate(iso, { day: 'numeric', month: 'short' })
}

function activityTone(item: ProduccionReportsActivityItem): 'primary' | 'success' | 'muted' {
  if (item.type === 'DELIVERY' && item.title.toLowerCase().includes('realizada')) return 'success'
  if (item.type === 'WORK_ORDER' && item.title.toLowerCase().includes('producción'))
    return 'primary'
  if (item.type === 'STOCK_MOVEMENT' && item.title.toLowerCase().includes('ingreso'))
    return 'success'
  return 'muted'
}

function toneBorder(tone: 'primary' | 'success' | 'muted') {
  if (tone === 'success') return 'border-l-success-500'
  if (tone === 'primary') return 'border-l-brand-500'
  return 'border-l-gray-200 dark:border-l-gray-800'
}

function openActivity(item: ProduccionReportsActivityItem) {
  if (item.type === 'WORK_ORDER') {
    void router.push({ name: 'produccion-ot-detalle', params: { id: item.entityId } })
    return
  }
  if (item.type === 'DELIVERY') {
    void router.push({ name: 'produccion-ventas-entrega-detalle', params: { id: item.entityId } })
    return
  }
  void router.push({
    name: 'produccion-inventario-movimientos',
    query: item.materialId ? { materialId: item.materialId } : undefined,
  })
}

function goReportes() {
  void router.push({ name: 'produccion-reportes' })
}

const dashboardErrorDetail = computed(() =>
  dashboardQuery.isError.value ? getApiErrorMessage(dashboardQuery.error.value) : '',
)
</script>

<template>
  <div class="space-y-6 w-full">
    <PageHeader
      title="Producción de muebles"
    >
      <template #subtitle>
        Control de órdenes, inventario y planta
<span class="mt-2 block">{{ greeting }}, {{ firstName }}</span>
      </template>
      <template #actions>
        <div class="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        <p class="text-sm text-gray-400 dark:text-gray-500">
          {{
            formatDate(new Date(), {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          }}
        </p>
        <BaseButton variant="outline" size="sm" type="button" class="whitespace-nowrap" @click="goReportes">
          <AppIcon icon="lucide:bar-chart-3" :size="16" class="mr-1.5" />
          Reportes detallados
        </BaseButton>
      </div>
      </template>
    </PageHeader>

    <p class="text-xs font-medium -mt-4 text-gray-400 dark:text-gray-500">
      Indicadores operativos en tiempo real · ventas del período: {{ periodLabel }}
    </p>

    <LoadingState v-if="dashboardQuery.isLoading.value" class="py-20" />

    <BaseCard v-else-if="dashboardQuery.isError.value" padding="lg" class="block text-center">
      <p class="text-sm font-medium text-gray-800 dark:text-white/90">
        No se pudo cargar el dashboard
      </p>
      <p class="text-xs mt-2 max-w-md mx-auto text-gray-500 dark:text-gray-400">
        {{ dashboardErrorDetail || 'Comprueba tu conexión e inténtalo de nuevo.' }}
      </p>
      <BaseButton class="mt-4" type="button" @click="() => dashboardQuery.refetch()">
        Reintentar
      </BaseButton>
    </BaseCard>

    <template v-else-if="d">
      <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatsCard title="Órdenes activas" :value="String(d.kpis.activeWorkOrders)">
          <template #icon>
            <AppIcon icon="lucide:clipboard-list" :size="20" color="var(--color-primary)" />
          </template>
        </StatsCard>
        <StatsCard title="En planta" :value="String(d.produccion.workOrdersInProgressSnapshot)">
          <template #icon>
            <AppIcon icon="lucide:hammer" :size="20" color="#2563eb" />
          </template>
        </StatsCard>
        <StatsCard title="Stock en alerta" :value="String(d.inventario.lowStockCount)">
          <template #icon>
            <AppIcon icon="lucide:warehouse" :size="20" color="#d97706" />
          </template>
        </StatsCard>
        <StatsCard title="OC pendientes" :value="String(d.kpis.pendingPurchaseOrders)">
          <template #icon>
            <AppIcon icon="lucide:truck" :size="20" color="#7c3aed" />
          </template>
        </StatsCard>
        <StatsCard title="Cotizaciones abiertas" :value="String(d.kpis.openQuotations)">
          <template #icon>
            <AppIcon icon="lucide:file-edit" :size="20" color="#16a34a" />
          </template>
        </StatsCard>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <FormSectionCard
          title="Actividad reciente"
          subtitle="Últimas OT, entregas y movimientos de inventario"
          dense
        >
          <ul v-if="d.recentActivity.length" class="space-y-3">
            <li v-for="a in d.recentActivity" :key="`${a.type}-${a.entityId}`">
              <button
                type="button"
                class="w-full flex gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/3 border-gray-200 dark:border-gray-800 border-l-3" :class="toneBorder(activityTone(a))"
                @click="openActivity(a)"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                    {{ a.title }}
                  </p>
                  <p class="text-xs mt-0.5 truncate text-gray-500 dark:text-gray-400">
                    {{ a.detail }}
                  </p>
                </div>
                <span class="text-[11px] shrink-0 self-start text-gray-400 dark:text-gray-500">
                  {{ formatRelativeTime(a.occurredAt) }}
                </span>
              </button>
            </li>
          </ul>
          <p v-else class="text-sm py-6 text-center text-gray-400 dark:text-gray-500">
            Sin actividad registrada aún.
          </p>
        </FormSectionCard>

        <FormSectionCard
          title="Acciones rápidas"
          subtitle="Flujo operativo del taller"
          dense
        >
          <div class="grid sm:grid-cols-2 gap-3">
            <ActionCard
              v-for="ac in acciones"
              :key="ac.to"
              :icon="ac.icon"
              :title="ac.label"
              :description="ac.sub"
              @click="router.push(ac.to)"
            />
          </div>
        </FormSectionCard>
      </div>

      <FormSectionCard
        title="Resumen del período"
        :subtitle="periodLabel"
        dense
      >
        <dl class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <dt class="text-gray-500 dark:text-gray-400">OT creadas</dt>
            <dd class="font-semibold tabular-nums mt-1 text-gray-800 dark:text-white/90">
              {{ d.produccion.workOrdersCreated }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">OT completadas</dt>
            <dd class="font-semibold tabular-nums mt-1 text-gray-800 dark:text-white/90">
              {{ d.produccion.workOrdersCompleted }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Pedidos entregados</dt>
            <dd class="font-semibold tabular-nums mt-1 text-gray-800 dark:text-white/90">
              {{ d.ventas.ordersDelivered }}
            </dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Movimientos de stock</dt>
            <dd class="font-semibold tabular-nums mt-1 text-gray-800 dark:text-white/90">
              {{ d.inventario.movementsInPeriod }}
            </dd>
          </div>
        </dl>
      </FormSectionCard>
    </template>
  </div>
</template>
