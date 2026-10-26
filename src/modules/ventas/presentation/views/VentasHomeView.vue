<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import ActionCard from '@shared/presentation/components/ui/ActionCard.vue'
import { computed, ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
import { VENTAS_BASE_PATH } from '../../config/routes.constants'
import {
  useVentasConversionReport,
  useVentasFinancialFlowReport,
  useVentasSalesByPeriodReport,
} from '../../features/ventas-reportes/presentation/composables/useVentasReportes'
import type { VentasReportesRangeParams } from '../../features/ventas-reportes/domain/reportes.types'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { parseCalendarDate, toCalendarDateString, formatDate } from '@shared/utils/formatters'
const silentReportOpts = { toastOnLoadError: false as const }

const router = useRouter()
const authStore = useAuthStore()

function currentMonthRange(): VentasReportesRangeParams {
  const end = new Date()
  const start = new Date(end.getFullYear(), end.getMonth(), 1)
  return {
    startDate: toCalendarDateString(start),
    endDate: toCalendarDateString(end),
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
  const a = parseCalendarDate(r.startDate)
  const b = parseCalendarDate(r.endDate)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${formatDate(a, opts)} – ${formatDate(b, {
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
  <div class="space-y-6">
    <PageHeader
      :title="`${greeting}, ${firstName}`"
      subtitle="Resumen de ventas, embudo y flujo · período del mes en curso"
    >
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
      Datos del período: {{ periodLabel }} · puedes cambiar fechas y granularidad en Reportes.
    </p>

    <!-- KPIs: carga y error independientes del resto de bloques -->
    <div v-if="conversionQuery.isLoading.value" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="i in 4"
        :key="i"
        class="rounded-xl border p-4 h-[104px] animate-pulse border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-950"
      />
    </div>
    <BaseCard v-else-if="conversionQuery.isError.value" class="block text-center space-y-3">
      <p class="text-sm font-medium text-gray-800 dark:text-white/90">
        No se pudieron cargar los indicadores principales
      </p>
      <p class="text-xs max-w-lg mx-auto text-gray-500 dark:text-gray-400">{{ convErr }}</p>
      <BaseButton type="button" icon="lucide:refresh-cw" @click="() => conversionQuery.refetch()">Reintentar</BaseButton>
    </BaseCard>
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
      <FormSectionCard
        title="Flujo financiero (período)"
        subtitle="Cobranzas, costos y comisiones"
        dense
      >
        <LoadingState v-if="financialQuery.isLoading.value && !fin" class="py-12" />
        <div v-else-if="financialQuery.isError.value && !fin" class="text-center space-y-3 py-6">
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ finErr }}</p>
          <BaseButton size="sm" type="button" variant="outline" icon="lucide:refresh-cw" @click="() => financialQuery.refetch()">
            Reintentar
          </BaseButton>
        </div>
        <dl v-else-if="fin" class="space-y-4">
          <div class="flex justify-between gap-4 text-sm">
            <dt class="text-gray-500 dark:text-gray-400">Cobranzas comprador</dt>
            <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
              {{ formatPenDec(fin.buyerPaymentsCollected) }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 text-sm">
            <dt class="text-gray-500 dark:text-gray-400">Pendiente comprador</dt>
            <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
              {{ formatPenDec(fin.buyerPaymentsPending) }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 text-sm">
            <dt class="text-gray-500 dark:text-gray-400">Comisiones pagadas</dt>
            <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
              {{ formatPenDec(fin.commissionsPaidAmount) }}
            </dd>
          </div>
          <div
            class="flex justify-between gap-4 text-sm pt-3 border-t border-gray-200 dark:border-gray-800"
          >
            <dt class="text-gray-500 dark:text-gray-400">Neto estimado</dt>
            <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
              {{ formatPenDec(fin.estimatedNetAfterCosts) }}
            </dd>
          </div>
        </dl>
        <p v-else class="text-sm text-center py-8 text-gray-500 dark:text-gray-400">
          Sin datos de flujo financiero.
        </p>
      </FormSectionCard>

      <!-- Conversión y pipeline (misma fuente que KPIs; UI de carga alineada) -->
      <FormSectionCard
        title="Conversión y pipeline"
        subtitle="Resultados y movimiento del período"
        dense
      >
        <LoadingState v-if="conversionQuery.isLoading.value" class="py-12" />
        <div v-else-if="conversionQuery.isError.value" class="text-center space-y-3 py-6">
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ convErr }}</p>
          <BaseButton size="sm" type="button" variant="outline" icon="lucide:refresh-cw" @click="() => conversionQuery.refetch()">
            Reintentar
          </BaseButton>
        </div>
        <dl v-else-if="conv" class="space-y-4">
          <div class="flex justify-between gap-4 text-sm">
            <dt class="text-gray-500 dark:text-gray-400">Ganadas</dt>
            <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
              {{ conv.opportunitiesWon }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 text-sm">
            <dt class="text-gray-500 dark:text-gray-400">Perdidas</dt>
            <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
              {{ conv.opportunitiesLost }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 text-sm">
            <dt class="text-gray-500 dark:text-gray-400">Separaciones</dt>
            <dd class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
              {{ conv.separationsCreated }}
            </dd>
          </div>
          <div
            class="rounded-lg border p-3 text-xs space-y-2 border-gray-200 dark:border-gray-800"
          >
            <p class="font-medium text-gray-400 dark:text-gray-500">Embudo por etapa</p>
            <div
              v-for="(count, stage) in conv.activePipelineByStage"
              :key="stage"
              class="flex justify-between gap-2"
            >
              <span class="text-gray-500 dark:text-gray-400">{{
                PIPELINE_STAGE_LABEL[stage] ?? stage
              }}</span>
              <span class="font-semibold tabular-nums text-gray-800 dark:text-white/90">{{
                count
              }}</span>
            </div>
          </div>
        </dl>
      </FormSectionCard>
    </div>

    <!-- Ventas cerradas -->
    <FormSectionCard
      title="Ventas cerradas (agregado por mes en el período)"
      subtitle="Suma de series devueltas por el reporte “ventas por período”"
      dense
    >
      <LoadingState v-if="salesQuery.isLoading.value" class="py-12" />
      <div v-else-if="salesQuery.isError.value" class="text-center space-y-3 py-6">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ salesErr }}</p>
        <BaseButton size="sm" type="button" variant="outline" icon="lucide:refresh-cw" @click="() => salesQuery.refetch()">
          Reintentar
        </BaseButton>
      </div>
      <div v-else class="grid sm:grid-cols-2 gap-4">
        <div class="rounded-lg border p-4 border-gray-200 dark:border-gray-800">
          <p class="text-xs font-medium text-gray-400 dark:text-gray-500">Cierres registrados</p>
          <p class="text-2xl font-bold tabular-nums mt-1 text-gray-800 dark:text-white/90">
            {{ salesTotals.closings }}
          </p>
        </div>
        <div class="rounded-lg border p-4 border-gray-200 dark:border-gray-800">
          <p class="text-xs font-medium text-gray-400 dark:text-gray-500">Volumen total (S/)</p>
          <p class="text-2xl font-bold tabular-nums mt-1 text-gray-800 dark:text-white/90">
            {{ formatPen(salesTotals.amount) }}
          </p>
        </div>
      </div>
    </FormSectionCard>

    <FormSectionCard
      title="Acciones rápidas"
      subtitle="Accesos frecuentes"
      dense
    >
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <ActionCard
          v-for="ac in acciones"
          :key="ac.label"
          :icon="ac.icon"
          :title="ac.label"
          :description="ac.sub"
          @click="router.push(ac.to)"
        />
      </div>
    </FormSectionCard>
  </div>
</template>
