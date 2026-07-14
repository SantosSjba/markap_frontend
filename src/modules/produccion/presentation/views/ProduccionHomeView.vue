<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { StatsCard, BaseButton, AppIcon } from '@shared/components'
import { useAuthStore } from '@modules/auth'
import {
  useProduccionReportsDashboard,
  type ProduccionReportesRangeParams,
} from '@modules/produccion/features/reportes'
import type { ProduccionReportsActivityItem } from '@modules/produccion/features/reportes/domain/reportes.types'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { parseCalendarDate, toCalendarDateString, formatDate } from '@/shared/utils/formatters'

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
  if (item.type === 'WORK_ORDER' && item.title.toLowerCase().includes('producción')) return 'primary'
  if (item.type === 'STOCK_MOVEMENT' && item.title.toLowerCase().includes('ingreso')) return 'success'
  return 'muted'
}

function toneBorder(tone: 'primary' | 'success' | 'muted') {
  if (tone === 'success') return 'var(--color-success, #16a34a)'
  if (tone === 'primary') return 'var(--color-primary)'
  return 'var(--color-border)'
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
  <div class="space-y-8 max-w-[1600px] mx-auto w-full animate-fade-in">
    <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
          Producción de muebles
        </h1>
        <p class="text-sm mt-1" style="color: var(--color-text-secondary)">
          Control de órdenes, inventario y planta
        </p>
        <p class="text-sm mt-3 font-medium" style="color: var(--color-text-primary)">
          {{ greeting }}, {{ firstName }}
        </p>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        <p class="text-sm" style="color: var(--color-text-muted)">
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
    </div>

    <p class="text-xs font-medium -mt-4" style="color: var(--color-text-muted)">
      Indicadores operativos en tiempo real · ventas del período: {{ periodLabel }}
    </p>

    <div v-if="dashboardQuery.isLoading.value" class="flex justify-center py-20">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
    </div>

    <div
      v-else-if="dashboardQuery.isError.value"
      class="rounded-xl border p-8 text-center"
      style="border-color: var(--color-border); background: var(--color-surface)"
    >
      <p class="text-sm font-medium" style="color: var(--color-text-primary)">
        No se pudo cargar el dashboard
      </p>
      <p class="text-xs mt-2 max-w-md mx-auto" style="color: var(--color-text-secondary)">
        {{ dashboardErrorDetail || 'Comprueba tu conexión e inténtalo de nuevo.' }}
      </p>
      <BaseButton class="mt-4" type="button" @click="() => dashboardQuery.refetch()">
        Reintentar
      </BaseButton>
    </div>

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
        <div
          class="rounded-xl border p-5 lg:p-6"
          :style="{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }"
        >
          <h2 class="text-lg font-semibold mb-1" style="color: var(--color-text-primary)">
            Actividad reciente
          </h2>
          <p class="text-xs mb-5" style="color: var(--color-text-muted)">
            Últimas OT, entregas y movimientos de inventario
          </p>
          <ul v-if="d.recentActivity.length" class="space-y-3">
            <li v-for="a in d.recentActivity" :key="`${a.type}-${a.entityId}`">
              <button
                type="button"
                class="w-full flex gap-3 rounded-lg border p-3 text-left transition hover:opacity-90"
                :style="{
                  borderColor: 'var(--color-border)',
                  borderLeftWidth: '3px',
                  borderLeftColor: toneBorder(activityTone(a)),
                }"
                @click="openActivity(a)"
              >
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium" style="color: var(--color-text-primary)">
                    {{ a.title }}
                  </p>
                  <p class="text-xs mt-0.5 truncate" style="color: var(--color-text-secondary)">
                    {{ a.detail }}
                  </p>
                </div>
                <span class="text-[11px] shrink-0 self-start" style="color: var(--color-text-muted)">
                  {{ formatRelativeTime(a.occurredAt) }}
                </span>
              </button>
            </li>
          </ul>
          <p v-else class="text-sm py-6 text-center" style="color: var(--color-text-muted)">
            Sin actividad registrada aún.
          </p>
        </div>

        <div
          class="rounded-xl border p-5 lg:p-6"
          :style="{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }"
        >
          <h2 class="text-lg font-semibold mb-1" style="color: var(--color-text-primary)">
            Acciones rápidas
          </h2>
          <p class="text-xs mb-5" style="color: var(--color-text-muted)">
            Flujo operativo del taller
          </p>
          <div class="grid sm:grid-cols-2 gap-3">
            <button
              v-for="ac in acciones"
              :key="ac.to"
              type="button"
              class="flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover-surface"
              :style="{ borderColor: 'var(--color-border)' }"
              @click="router.push(ac.to)"
            >
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style="background-color: var(--color-primary-light); color: var(--color-primary)"
              >
                <AppIcon :icon="ac.icon" :size="20" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold" style="color: var(--color-text-primary)">
                  {{ ac.label }}
                </p>
                <p class="text-xs mt-0.5" style="color: var(--color-text-muted)">
                  {{ ac.sub }}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div
        class="rounded-xl border p-5 lg:p-6"
        :style="{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }"
      >
        <h2 class="text-lg font-semibold mb-1" style="color: var(--color-text-primary)">
          Resumen del período
        </h2>
        <p class="text-xs mb-5" style="color: var(--color-text-muted)">
          {{ periodLabel }}
        </p>
        <dl class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <dt style="color: var(--color-text-secondary)">OT creadas</dt>
            <dd class="font-semibold tabular-nums mt-1" style="color: var(--color-text-primary)">
              {{ d.produccion.workOrdersCreated }}
            </dd>
          </div>
          <div>
            <dt style="color: var(--color-text-secondary)">OT completadas</dt>
            <dd class="font-semibold tabular-nums mt-1" style="color: var(--color-text-primary)">
              {{ d.produccion.workOrdersCompleted }}
            </dd>
          </div>
          <div>
            <dt style="color: var(--color-text-secondary)">Pedidos entregados</dt>
            <dd class="font-semibold tabular-nums mt-1" style="color: var(--color-text-primary)">
              {{ d.ventas.ordersDelivered }}
            </dd>
          </div>
          <div>
            <dt style="color: var(--color-text-secondary)">Movimientos de stock</dt>
            <dd class="font-semibold tabular-nums mt-1" style="color: var(--color-text-primary)">
              {{ d.inventario.movementsInPeriod }}
            </dd>
          </div>
        </dl>
      </div>
    </template>
  </div>
</template>
