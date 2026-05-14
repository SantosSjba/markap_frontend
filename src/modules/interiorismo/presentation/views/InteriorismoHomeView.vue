<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { StatsCard, BaseButton, AppIcon } from '@shared/components'
import { useAuthStore } from '@modules/auth'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'
import { useInteriorReportsDashboard } from '@modules/interiorismo/features/reportes/application/useInteriorReportes'
import type { InteriorReportesRangeParams } from '@modules/interiorismo/features/reportes/domain/reportes.types'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const router = useRouter()
const authStore = useAuthStore()

function currentMonthRange(): InteriorReportesRangeParams {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

/** Rango aplicado al dashboard (mes en curso por defecto). */
const rangeParams = ref<InteriorReportesRangeParams>(currentMonthRange())

const dashboardQuery = useInteriorReportsDashboard(rangeParams, { toastOnLoadError: false })
const d = computed(() => dashboardQuery.data.value)

const greetingHour = new Date().getHours()
const greeting =
  greetingHour < 12 ? 'Buenos días' : greetingHour < 19 ? 'Buenas tardes' : 'Buenas noches'
const firstName = computed(() => authStore.user?.firstName ?? 'Usuario')

function formatPen(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPenDec(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const periodLabel = computed(() => {
  const r = rangeParams.value
  const a = new Date(`${r.startDate}T12:00:00`)
  const b = new Date(`${r.endDate}T12:00:00`)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const start = a.toLocaleDateString('es-PE', opts)
  const end = b.toLocaleDateString('es-PE', { ...opts, month: 'long', year: 'numeric' })
  return `${start} – ${end}`
})

const acciones = [
  {
    label: 'Nuevo proyecto',
    sub: 'Crear proyecto',
    to: `${INTERIORISMO_BASE_PATH}/proyectos/nuevo`,
    icon: 'lucide:plus-circle' as const,
  },
  {
    label: 'Presupuesto',
    sub: 'Generar cotización',
    to: `${INTERIORISMO_BASE_PATH}/presupuestos/nuevo`,
    icon: 'lucide:file-spreadsheet' as const,
  },
  {
    label: 'Catálogo',
    sub: 'Ver materiales',
    to: `${INTERIORISMO_BASE_PATH}/materiales/catalogo`,
    icon: 'lucide:layers' as const,
  },
  {
    label: 'Calendario',
    sub: 'Ver agenda',
    to: `${INTERIORISMO_BASE_PATH}/calendario`,
    icon: 'lucide:calendar' as const,
  },
]

function goReportes() {
  router.push({ name: 'interiorismo-reportes' })
}

const dashboardErrorDetail = computed(() =>
  dashboardQuery.isError.value ? getApiErrorMessage(dashboardQuery.error.value) : '',
)
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
          Interiorismo
        </h1>
        <p class="text-sm mt-1" style="color: var(--color-text-secondary)">
          Resumen operativo y financiero
        </p>
        <p class="text-sm mt-3 font-medium" style="color: var(--color-text-primary)">
          {{ greeting }}, {{ firstName }}
        </p>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        <p class="text-sm" style="color: var(--color-text-muted)">
          {{
            new Date().toLocaleDateString('es-PE', {
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
      Datos del período: {{ periodLabel }} · mismo rango que puedes ajustar en Reportes.
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
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Proyectos activos" :value="String(d.kpis.proyectosActivos)">
          <template #icon>
            <AppIcon icon="lucide:folder-kanban" :size="20" color="var(--color-primary)" />
          </template>
        </StatsCard>
        <StatsCard title="En ejecución" :value="String(d.kpis.proyectosEnEjecucion)">
          <template #icon>
            <AppIcon icon="lucide:hard-hat" :size="20" color="#2563eb" />
          </template>
        </StatsCard>
        <StatsCard title="Clientes" :value="String(d.kpis.clientesTotales)">
          <template #icon>
            <AppIcon icon="lucide:users" :size="20" color="#16a34a" />
          </template>
        </StatsCard>
        <StatsCard title="Presupuestos borrador" :value="String(d.kpis.presupuestosBorrador)">
          <template #icon>
            <AppIcon icon="lucide:file-edit" :size="20" color="#d97706" />
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
            Ventas y cobranzas (período)
          </h2>
          <p class="text-xs mb-5" style="color: var(--color-text-muted)">
            Movimiento registrado en el rango seleccionado para reportes
          </p>
          <dl class="space-y-4">
            <div class="flex justify-between gap-4 text-sm">
              <dt style="color: var(--color-text-secondary)">Cobranzas</dt>
              <dd class="font-semibold tabular-nums" style="color: var(--color-text-primary)">
                {{ formatPen(d.ventas.cobranzasPeriodo) }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 text-sm">
              <dt style="color: var(--color-text-secondary)">Pagos registrados</dt>
              <dd class="font-semibold tabular-nums" style="color: var(--color-text-primary)">
                {{ formatPenDec(d.ventas.pagosRegistradosPeriodo) }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 text-sm">
              <dt style="color: var(--color-text-secondary)">Proyectos con cobro en período</dt>
              <dd class="font-semibold tabular-nums" style="color: var(--color-text-primary)">
                {{ d.ventas.proyectosConCobroEnPeriodo }}
              </dd>
            </div>
            <div
              class="flex justify-between gap-4 text-sm pt-3 border-t"
              style="border-color: var(--color-border)"
            >
              <dt style="color: var(--color-text-secondary)">Cartera pendiente (cuotas)</dt>
              <dd class="font-semibold tabular-nums" style="color: var(--color-text-primary)">
                {{ formatPenDec(d.ventas.carteraPendienteCuotas) }}
              </dd>
            </div>
          </dl>
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
            Conversión y rentabilidad
          </h2>
          <p class="text-xs mb-5" style="color: var(--color-text-muted)">
            Presupuestos y proyectos en el período
          </p>
          <dl class="space-y-4">
            <div class="flex justify-between gap-4 text-sm">
              <dt style="color: var(--color-text-secondary)">Proyectos nuevos</dt>
              <dd class="font-semibold tabular-nums" style="color: var(--color-text-primary)">
                {{ d.conversion.proyectosNuevosPeriodo }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 text-sm">
              <dt style="color: var(--color-text-secondary)">Presupuestos aprobados</dt>
              <dd class="font-semibold tabular-nums" style="color: var(--color-text-primary)">
                {{ d.conversion.presupuestosAprobadosPeriodo }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 text-sm">
              <dt style="color: var(--color-text-secondary)">Tasa cierre presupuesto</dt>
              <dd class="font-semibold tabular-nums" style="color: var(--color-text-primary)">
                {{
                  d.conversion.tasaCierrePresupuestoPct != null
                    ? `${d.conversion.tasaCierrePresupuestoPct.toFixed(1)} %`
                    : '—'
                }}
              </dd>
            </div>
            <div
              class="flex justify-between gap-4 text-sm pt-3 border-t"
              style="border-color: var(--color-border)"
            >
              <dt style="color: var(--color-text-secondary)">Margen bruto estimado</dt>
              <dd class="font-semibold tabular-nums" style="color: var(--color-text-primary)">
                {{ formatPenDec(d.rentabilidad.margenBrutoEstimado) }}
                <span
                  v-if="d.rentabilidad.margenBrutoPct != null"
                  class="text-xs font-normal ml-1"
                  style="color: var(--color-text-muted)"
                >
                  ({{ d.rentabilidad.margenBrutoPct.toFixed(1) }} %)
                </span>
              </dd>
            </div>
          </dl>
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
        <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h2 class="text-lg font-semibold" style="color: var(--color-text-primary)">
              Productividad y costos
            </h2>
            <p class="text-xs mt-0.5" style="color: var(--color-text-muted)">
              Obra y gastos del período
            </p>
          </div>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="rounded-lg border p-4" style="border-color: var(--color-border)">
            <p class="text-xs font-medium" style="color: var(--color-text-muted)">Tareas completadas</p>
            <p class="text-xl font-bold tabular-nums mt-1" style="color: var(--color-text-primary)">
              {{ d.productividad.tareasCompletadasPeriodo }}
            </p>
          </div>
          <div class="rounded-lg border p-4" style="border-color: var(--color-border)">
            <p class="text-xs font-medium" style="color: var(--color-text-muted)">Avance tareas</p>
            <p class="text-xl font-bold tabular-nums mt-1" style="color: var(--color-text-primary)">
              {{
                d.productividad.pctAvanceTareas != null
                  ? `${d.productividad.pctAvanceTareas.toFixed(0)} %`
                  : '—'
              }}
            </p>
          </div>
          <div class="rounded-lg border p-4" style="border-color: var(--color-border)">
            <p class="text-xs font-medium" style="color: var(--color-text-muted)">Costos totales período</p>
            <p class="text-xl font-bold tabular-nums mt-1" style="color: var(--color-text-primary)">
              {{ formatPenDec(d.costos.totalCostosPeriodo) }}
            </p>
          </div>
          <div class="rounded-lg border p-4" style="border-color: var(--color-border)">
            <p class="text-xs font-medium" style="color: var(--color-text-muted)">Incidencias abiertas</p>
            <p class="text-xl font-bold tabular-nums mt-1" style="color: var(--color-text-primary)">
              {{ d.productividad.incidenciasAbiertas }}
            </p>
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
          Acciones rápidas
        </h2>
        <p class="text-xs mb-5" style="color: var(--color-text-muted)">
          Tareas frecuentes
        </p>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
    </template>
  </div>
</template>
