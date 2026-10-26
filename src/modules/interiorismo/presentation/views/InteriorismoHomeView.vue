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
import { INTERIORISMO_BASE_PATH } from '../../config/routes.constants'
import { useInteriorReportsDashboard } from '../../features/reportes/presentation/composables/useInteriorReportes'
import type { InteriorReportesRangeParams } from '../../features/reportes/domain/reportes.types'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { parseCalendarDate, toCalendarDateString, formatDate } from '@shared/utils/formatters'
const router = useRouter()
const authStore = useAuthStore()

function currentMonthRange(): InteriorReportesRangeParams {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  return {
    startDate: toCalendarDateString(start),
    endDate: toCalendarDateString(end),
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
  const a = parseCalendarDate(r.startDate)
  const b = parseCalendarDate(r.endDate)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  const start = formatDate(a, opts)
  const end = formatDate(b, { ...opts, month: 'long', year: 'numeric' })
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
    sub: 'Desde un proyecto',
    to: `${INTERIORISMO_BASE_PATH}/proyectos`,
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
  <div class="space-y-6">
    <PageHeader
      title="Interiorismo"
    >
      <template #subtitle>
        Resumen operativo y financiero
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
      Datos del período: {{ periodLabel }} · mismo rango que puedes ajustar en Reportes.
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
        <StatsCard title="Proyectos en cotización" :value="String(d.kpis.presupuestosBorrador)">
          <template #icon>
            <AppIcon icon="lucide:file-edit" :size="20" color="#d97706" />
          </template>
        </StatsCard>
      </div>

      <div class="grid lg:grid-cols-2 gap-6">
        <FormSectionCard
          title="Ventas y cobranzas (período)"
          subtitle="Movimiento registrado en el rango seleccionado para reportes"
          dense
        >
          <dl class="space-y-4">
            <div class="flex justify-between gap-4 text-sm">
              <dt class="text-gray-500 dark:text-gray-400">Cobranzas</dt>
              <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {{ formatPen(d.ventas.cobranzasPeriodo) }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 text-sm">
              <dt class="text-gray-500 dark:text-gray-400">Pagos registrados</dt>
              <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {{ formatPenDec(d.ventas.pagosRegistradosPeriodo) }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 text-sm">
              <dt class="text-gray-500 dark:text-gray-400">Proyectos con cobro en período</dt>
              <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {{ d.ventas.proyectosConCobroEnPeriodo }}
              </dd>
            </div>
            <div
              class="flex justify-between gap-4 text-sm pt-3 border-t border-gray-200 dark:border-gray-800"
            >
              <dt class="text-gray-500 dark:text-gray-400">Cartera pendiente (cuotas)</dt>
              <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {{ formatPenDec(d.ventas.carteraPendienteCuotas) }}
              </dd>
            </div>
          </dl>
        </FormSectionCard>

        <FormSectionCard
          title="Conversión y rentabilidad"
          subtitle="Presupuestos y proyectos en el período"
          dense
        >
          <dl class="space-y-4">
            <div class="flex justify-between gap-4 text-sm">
              <dt class="text-gray-500 dark:text-gray-400">Proyectos nuevos</dt>
              <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {{ d.conversion.proyectosNuevosPeriodo }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 text-sm">
              <dt class="text-gray-500 dark:text-gray-400">Presupuestos aprobados</dt>
              <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {{ d.conversion.presupuestosAprobadosPeriodo }}
              </dd>
            </div>
            <div class="flex justify-between gap-4 text-sm">
              <dt class="text-gray-500 dark:text-gray-400">Tasa cierre presupuesto</dt>
              <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {{
                  d.conversion.tasaCierrePresupuestoPct != null
                    ? `${d.conversion.tasaCierrePresupuestoPct.toFixed(1)} %`
                    : '—'
                }}
              </dd>
            </div>
            <div
              class="flex justify-between gap-4 text-sm pt-3 border-t border-gray-200 dark:border-gray-800"
            >
              <dt class="text-gray-500 dark:text-gray-400">Margen bruto estimado</dt>
              <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {{ formatPenDec(d.rentabilidad.margenBrutoEstimado) }}
                <span
                  v-if="d.rentabilidad.margenBrutoPct != null"
                  class="text-xs font-normal ml-1 text-gray-400 dark:text-gray-500"
                >
                  ({{ d.rentabilidad.margenBrutoPct.toFixed(1) }} %)
                </span>
              </dd>
            </div>
          </dl>
        </FormSectionCard>
      </div>

      <BaseCard class="block">
        <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">
              Productividad y costos
            </h2>
            <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
              Obra y gastos del período
            </p>
          </div>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="rounded-lg border p-4 border-gray-200 dark:border-gray-800">
            <p class="text-xs font-medium text-gray-400 dark:text-gray-500">Tareas completadas</p>
            <p class="text-xl font-bold tabular-nums mt-1 text-gray-800 dark:text-white/90">
              {{ d.productividad.tareasCompletadasPeriodo }}
            </p>
          </div>
          <div class="rounded-lg border p-4 border-gray-200 dark:border-gray-800">
            <p class="text-xs font-medium text-gray-400 dark:text-gray-500">Avance tareas</p>
            <p class="text-xl font-bold tabular-nums mt-1 text-gray-800 dark:text-white/90">
              {{
                d.productividad.pctAvanceTareas != null
                  ? `${d.productividad.pctAvanceTareas.toFixed(0)} %`
                  : '—'
              }}
            </p>
          </div>
          <div class="rounded-lg border p-4 border-gray-200 dark:border-gray-800">
            <p class="text-xs font-medium text-gray-400 dark:text-gray-500">Costos totales período</p>
            <p class="text-xl font-bold tabular-nums mt-1 text-gray-800 dark:text-white/90">
              {{ formatPenDec(d.costos.totalCostosPeriodo) }}
            </p>
          </div>
          <div class="rounded-lg border p-4 border-gray-200 dark:border-gray-800">
            <p class="text-xs font-medium text-gray-400 dark:text-gray-500">Incidencias abiertas</p>
            <p class="text-xl font-bold tabular-nums mt-1 text-gray-800 dark:text-white/90">
              {{ d.productividad.incidenciasAbiertas }}
            </p>
          </div>
        </div>
      </BaseCard>

      <FormSectionCard
        title="Acciones rápidas"
        subtitle="Tareas frecuentes"
        dense
      >
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
    </template>
  </div>
</template>
