<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { StatsCard, BaseButton, AppIcon } from '@shared/components'
import { useAuthStore } from '@modules/auth'
import { VENTAS_BASE_PATH } from '@modules/ventas/config/routes.constants'
import {
  useVentasConversionReport,
  useVentasFinancialFlowReport,
  useVentasSalesByPeriodReport,
} from '@modules/ventas/features/ventas-reportes/application/useVentasReportes'
import type { VentasReportesRangeParams } from '@modules/ventas/features/ventas-reportes/domain/reportes.types'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const silentReportOpts = { toastOnLoadError: false as const }

const router = useRouter()
const authStore = useAuthStore()

function currentMonthRange(): VentasReportesRangeParams {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

const rangeParams = ref<VentasReportesRangeParams>(currentMonthRange())

const rangeOnly = computed(() => ({
  startDate: rangeParams.value.startDate,
  endDate: rangeParams.value.endDate,
}))

const salesParams = computed(() => ({
  startDate: rangeParams.value.startDate,
  endDate: rangeParams.value.endDate,
  granularity: 'month' as const,
}))

const conversionQuery = useVentasConversionReport(rangeOnly, silentReportOpts)
const financialQuery = useVentasFinancialFlowReport(rangeOnly, silentReportOpts)
const salesQuery = useVentasSalesByPeriodReport(salesParams, silentReportOpts)

const conv = computed(() => conversionQuery.data.value)
const fin = computed(() => financialQuery.data.value)

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

function pipelineTotal(c: typeof conv.value) {
  if (!c?.activePipelineByStage) return 0
  return Object.values(c.activePipelineByStage).reduce((a, b) => a + b, 0)
}

const salesTotals = computed(() => {
  const rows = salesQuery.data.value ?? []
  return rows.reduce(
    (acc, r) => {
      acc.closings += r.closingsCount
      acc.amount += r.totalAmount
      return acc
    },
    { closings: 0, amount: 0 },
  )
})

const periodLabel = computed(() => {
  const r = rangeParams.value
  const a = new Date(`${r.startDate}T12:00:00`)
  const b = new Date(`${r.endDate}T12:00:00`)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${a.toLocaleDateString('es-PE', opts)} – ${b.toLocaleDateString('es-PE', {
    ...opts,
    month: 'long',
    year: 'numeric',
  })}`
})

const convErr = computed(() =>
  conversionQuery.isError.value ? getApiErrorMessage(conversionQuery.error.value) : '',
)
const finErr = computed(() =>
  financialQuery.isError.value ? getApiErrorMessage(financialQuery.error.value) : '',
)
const salesErr = computed(() =>
  salesQuery.isError.value ? getApiErrorMessage(salesQuery.error.value) : '',
)

function goReportes() {
  router.push({ name: 'ventas-reportes' })
}

const PIPELINE_STAGE_LABEL: Record<string, string> = {
  SEPARATION: 'Separación',
  ARRAS: 'Contrato de arras',
  MINUTA: 'Minuta',
  PUBLIC_DEED: 'Escritura pública',
}

const acciones: {
  label: string
  sub: string
  icon: string
  to: RouteLocationRaw
}[] = [
  {
    label: 'Pipeline',
    sub: 'Embudo de ventas',
    icon: 'lucide:columns-3',
    to: { name: 'ventas-procesos-pipeline' },
  },
  {
    label: 'Procesos',
    sub: 'Listado',
    icon: 'lucide:handshake',
    to: { name: 'ventas-procesos' },
  },
  {
    label: 'Nuevo cliente',
    sub: 'Alta rápida',
    icon: 'lucide:user-plus',
    to: { name: 'ventas-clientes-nuevo' },
  },
  {
    label: 'Propiedades',
    sub: 'Cartera',
    icon: 'lucide:building-2',
    to: `${VENTAS_BASE_PATH}/propiedades`,
  },
]
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          {{ greeting }}, {{ firstName }}
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Resumen de ventas, embudo y flujo · período del mes en curso
        </p>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
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

    <p class="text-xs font-medium -mt-4" :style="{ color: 'var(--color-text-muted)' }">
      Datos del período: {{ periodLabel }} · puedes cambiar fechas y granularidad en Reportes.
    </p>

    <!-- KPIs: carga y error independientes del resto de bloques -->
    <div v-if="conversionQuery.isLoading.value" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="i in 4"
        :key="i"
        class="rounded-xl border p-4 h-[104px] animate-pulse"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-muted)' }"
      />
    </div>
    <div
      v-else-if="conversionQuery.isError.value"
      class="rounded-xl border p-6 text-center space-y-3"
      :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
    >
      <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
        No se pudieron cargar los indicadores principales
      </p>
      <p class="text-xs max-w-lg mx-auto" :style="{ color: 'var(--color-text-secondary)' }">{{ convErr }}</p>
      <BaseButton type="button" icon="lucide:refresh-cw" @click="() => conversionQuery.refetch()">Reintentar</BaseButton>
    </div>
    <div v-else-if="conv" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard title="Procesos en embudo" :value="String(pipelineTotal(conv))">
        <template #icon>
          <AppIcon icon="lucide:git-branch" :size="20" color="var(--color-primary)" />
        </template>
      </StatsCard>
      <StatsCard title="Oportunidades nuevas" :value="String(conv.opportunitiesCreated)">
        <template #icon>
          <AppIcon icon="lucide:sparkles" :size="20" color="#2563eb" />
        </template>
      </StatsCard>
      <StatsCard title="Cierres (período)" :value="String(conv.closingsCount)">
        <template #icon>
          <AppIcon icon="lucide:circle-check" :size="20" color="#16a34a" />
        </template>
      </StatsCard>
      <StatsCard
        title="Tasa conversión"
        :value="
          Number.isFinite(conv.conversionRatePercent) ? `${conv.conversionRatePercent.toFixed(1)} %` : '—'
        "
      >
        <template #icon>
          <AppIcon icon="lucide:percent" :size="20" color="#d97706" />
        </template>
      </StatsCard>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Flujo financiero -->
      <div
        class="rounded-xl border p-5 lg:p-6 min-h-[200px]"
        :style="{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }"
      >
        <h2 class="text-lg font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Flujo financiero (período)
        </h2>
        <p class="text-xs mb-5" :style="{ color: 'var(--color-text-muted)' }">Cobranzas, costos y comisiones</p>

        <div v-if="financialQuery.isLoading.value && !fin" class="flex justify-center py-12">
          <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
        </div>
        <div v-else-if="financialQuery.isError.value && !fin" class="text-center space-y-3 py-6">
          <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ finErr }}</p>
          <BaseButton size="sm" type="button" variant="outline" icon="lucide:refresh-cw" @click="() => financialQuery.refetch()">
            Reintentar
          </BaseButton>
        </div>
        <dl v-else-if="fin" class="space-y-4">
          <div class="flex justify-between gap-4 text-sm">
            <dt :style="{ color: 'var(--color-text-secondary)' }">Cobranzas comprador</dt>
            <dd class="font-semibold tabular-nums" :style="{ color: 'var(--color-text-primary)' }">
              {{ formatPenDec(fin.buyerPaymentsCollected) }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 text-sm">
            <dt :style="{ color: 'var(--color-text-secondary)' }">Pendiente comprador</dt>
            <dd class="font-semibold tabular-nums" :style="{ color: 'var(--color-text-primary)' }">
              {{ formatPenDec(fin.buyerPaymentsPending) }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 text-sm">
            <dt :style="{ color: 'var(--color-text-secondary)' }">Comisiones pagadas</dt>
            <dd class="font-semibold tabular-nums" :style="{ color: 'var(--color-text-primary)' }">
              {{ formatPenDec(fin.commissionsPaidAmount) }}
            </dd>
          </div>
          <div
            class="flex justify-between gap-4 text-sm pt-3 border-t"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <dt :style="{ color: 'var(--color-text-secondary)' }">Neto estimado</dt>
            <dd class="font-semibold tabular-nums" :style="{ color: 'var(--color-text-primary)' }">
              {{ formatPenDec(fin.estimatedNetAfterCosts) }}
            </dd>
          </div>
        </dl>
        <p v-else class="text-sm text-center py-8" :style="{ color: 'var(--color-text-secondary)' }">
          Sin datos de flujo financiero.
        </p>
      </div>

      <!-- Conversión y pipeline (misma fuente que KPIs; UI de carga alineada) -->
      <div
        class="rounded-xl border p-5 lg:p-6 min-h-[200px]"
        :style="{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }"
      >
        <h2 class="text-lg font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
          Conversión y pipeline
        </h2>
        <p class="text-xs mb-5" :style="{ color: 'var(--color-text-muted)' }">Resultados y movimiento del período</p>

        <div v-if="conversionQuery.isLoading.value" class="flex justify-center py-12">
          <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
        </div>
        <div v-else-if="conversionQuery.isError.value" class="text-center space-y-3 py-6">
          <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ convErr }}</p>
          <BaseButton size="sm" type="button" variant="outline" icon="lucide:refresh-cw" @click="() => conversionQuery.refetch()">
            Reintentar
          </BaseButton>
        </div>
        <dl v-else-if="conv" class="space-y-4">
          <div class="flex justify-between gap-4 text-sm">
            <dt :style="{ color: 'var(--color-text-secondary)' }">Ganadas</dt>
            <dd class="font-semibold tabular-nums" :style="{ color: 'var(--color-text-primary)' }">
              {{ conv.opportunitiesWon }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 text-sm">
            <dt :style="{ color: 'var(--color-text-secondary)' }">Perdidas</dt>
            <dd class="font-semibold tabular-nums" :style="{ color: 'var(--color-text-primary)' }">
              {{ conv.opportunitiesLost }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 text-sm">
            <dt :style="{ color: 'var(--color-text-secondary)' }">Separaciones</dt>
            <dd class="font-semibold tabular-nums" :style="{ color: 'var(--color-text-primary)' }">
              {{ conv.separationsCreated }}
            </dd>
          </div>
          <div
            class="rounded-lg border p-3 text-xs space-y-2"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <p class="font-medium" :style="{ color: 'var(--color-text-muted)' }">Embudo por etapa</p>
            <div
              v-for="(count, stage) in conv.activePipelineByStage"
              :key="stage"
              class="flex justify-between gap-2"
            >
              <span :style="{ color: 'var(--color-text-secondary)' }">{{
                PIPELINE_STAGE_LABEL[stage] ?? stage
              }}</span>
              <span class="font-semibold tabular-nums" :style="{ color: 'var(--color-text-primary)' }">{{
                count
              }}</span>
            </div>
          </div>
        </dl>
      </div>
    </div>

    <!-- Ventas cerradas -->
    <div
      class="rounded-xl border p-5 lg:p-6"
      :style="{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }"
    >
      <h2 class="text-lg font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">
        Ventas cerradas (agregado por mes en el período)
      </h2>
      <p class="text-xs mb-5" :style="{ color: 'var(--color-text-muted)' }">
        Suma de series devueltas por el reporte “ventas por período”
      </p>

      <div v-if="salesQuery.isLoading.value" class="flex justify-center py-12">
        <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
      </div>
      <div v-else-if="salesQuery.isError.value" class="text-center space-y-3 py-6">
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ salesErr }}</p>
        <BaseButton size="sm" type="button" variant="outline" icon="lucide:refresh-cw" @click="() => salesQuery.refetch()">
          Reintentar
        </BaseButton>
      </div>
      <div v-else class="grid sm:grid-cols-2 gap-4">
        <div class="rounded-lg border p-4" :style="{ borderColor: 'var(--color-border)' }">
          <p class="text-xs font-medium" :style="{ color: 'var(--color-text-muted)' }">Cierres registrados</p>
          <p class="text-2xl font-bold tabular-nums mt-1" :style="{ color: 'var(--color-text-primary)' }">
            {{ salesTotals.closings }}
          </p>
        </div>
        <div class="rounded-lg border p-4" :style="{ borderColor: 'var(--color-border)' }">
          <p class="text-xs font-medium" :style="{ color: 'var(--color-text-muted)' }">Volumen total (S/)</p>
          <p class="text-2xl font-bold tabular-nums mt-1" :style="{ color: 'var(--color-text-primary)' }">
            {{ formatPen(salesTotals.amount) }}
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
      <h2 class="text-lg font-semibold mb-1" :style="{ color: 'var(--color-text-primary)' }">Acciones rápidas</h2>
      <p class="text-xs mb-5" :style="{ color: 'var(--color-text-muted)' }">Accesos frecuentes</p>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          v-for="ac in acciones"
          :key="ac.label"
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
            <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">{{ ac.label }}</p>
            <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">{{ ac.sub }}</p>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
