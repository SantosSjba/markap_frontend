<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('alquileres')

import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import { useRental, useRentalFinancialBreakdown } from '../composables/useRentals'
import { useCurrencyCatalog } from '@shared/presentation/composables/useCurrencyCatalog'
import { getAttachmentUrl } from '../downloads/rental-attachment-url'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatShortDate, parseCalendarDate } from '@shared/utils/formatters'
import { RENTAL_UTILITY_NET_SHORT_LABEL } from '../../domain/rental-financial.labels'
import FinancialBreakdownSummary from '../components/FinancialBreakdownSummary.vue'
const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const {
  data: rental,
  isLoading: loadingRental,
  isError: rentalError,
  error: rentalFetchError,
  refetch: refetchRental,
} = useRental(id)
const {
  data: breakdown,
  isLoading: loadingBreakdown,
  isError: breakdownQueryError,
  error: breakdownFetchError,
  refetch: refetchBreakdown,
} = useRentalFinancialBreakdown(id)
const { format: formatMoney } = useCurrencyCatalog()

const STATUS = {
  ACTIVE: { label: 'Vigente', variant: 'success' },
  EXPIRED: { label: 'Vencido', variant: 'error' },
  CANCELLED: { label: 'Cancelado', variant: 'warning' },
} as const
const status = computed(
  () =>
    STATUS[(rental.value?.status ?? '') as keyof typeof STATUS] ?? {
      label: rental.value?.status ?? '—',
      variant: 'neutral' as const,
    },
)

const tenantNames = computed(() => {
  const r = rental.value
  if (!r) return []
  return r.tenants?.length ? r.tenants.map((t) => t.fullName) : r.tenant ? [r.tenant.fullName] : []
})

/** Días hasta el fin del contrato (negativo si ya venció) */
const daysLeft = computed(() => {
  if (!rental.value?.endDate) return null
  const end = parseCalendarDate(rental.value.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((end.getTime() - today.getTime()) / 86_400_000)
})
const daysLeftLabel = computed(() => {
  const d = daysLeft.value
  if (d == null) return undefined
  if (d < 0) return `venció hace ${-d} días`
  if (d === 0) return 'vence hoy'
  return `quedan ${d} días`
})

const attachments = computed(() =>
  (['CONTRACT', 'DELIVERY_ACT'] as const).map((type) => ({
    type,
    label: type === 'CONTRACT' ? 'Contrato firmado' : 'Acta de entrega',
    file: rental.value?.attachments?.find((a) => a.type === type),
  })),
)

const goBack = () => router.push('/alquileres/contratos')
const goToEdit = () => router.push(`/alquileres/contratos/${id.value}/editar`)
const goToFinancialConfig = () =>
  router.push(`/alquileres/contratos/${id.value}/distribucion-financiera`)
</script>

<template>
  <div>
    <PageHeader
      :title="rental?.code ?? 'Detalle del alquiler'"
      :subtitle="rental ? `${rental.property?.code} · ${rental.property?.addressLine}` : 'Contrato de alquiler'"
      back
      @back="goBack"
      class="mb-6"
    >
      <template #actions>
        <div v-if="rental" class="flex shrink-0 items-center gap-2">
          <Badge :variant="status.variant">{{ status.label }}</Badge>
          <BaseButton variant="outline" size="sm" icon="lucide:sliders-horizontal" @click="goToFinancialConfig">
            <span class="hidden sm:inline">Distribución financiera</span>
          </BaseButton>
          <BaseButton v-if="canWrite" variant="primary" size="sm" icon="lucide:pencil" @click="goToEdit">
            Editar
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <LoadingState v-if="loadingRental" text="Cargando contrato..." class="py-24" />

    <div v-else-if="rentalError || !rental" class="flex flex-col items-center justify-center gap-3 py-16">
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="max-w-md text-center text-sm font-medium text-error-500 dark:text-error-400">
        {{ rentalError ? getApiErrorMessage(rentalFetchError) : 'No se encontró el alquiler.' }}
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <BaseButton v-if="rentalError" variant="outline" size="sm" @click="() => refetchRental()">Reintentar</BaseButton>
        <BaseButton variant="outline" size="sm" @click="goBack">Volver al listado</BaseButton>
      </div>
    </div>

    <div v-else class="space-y-6">
      <!-- ── Cifras clave ── -->
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatsCard compact title="Monto mensual" :value="formatMoney(rental.monthlyAmount, rental.currency)">
          <template #icon><AppIcon icon="lucide:banknote" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="Fin del contrato" :value="formatShortDate(rental.endDate)" :subtitle="daysLeftLabel">
          <template #icon><AppIcon icon="lucide:calendar-check" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="Día de pago" :value="`Día ${rental.paymentDueDay}`" subtitle="de cada mes">
          <template #icon><AppIcon icon="lucide:clock" :size="20" /></template>
        </StatsCard>
        <StatsCard
          compact
          :title="RENTAL_UTILITY_NET_SHORT_LABEL"
          :value="breakdown ? formatMoney(breakdown.utility, breakdown.currency) : '—'"
          :subtitle="breakdown && breakdown.totalsByCurrency.length > 1 ? '+ otras monedas' : 'mensual'"
          :loading="loadingBreakdown"
        >
          <template #icon><AppIcon icon="lucide:wallet" :size="20" /></template>
        </StatsCard>
      </div>

      <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <!-- ── Columna principal ── -->
        <div class="space-y-6 xl:col-span-2">
          <FormSectionCard title="Contrato" subtitle="Partes, vigencia y condiciones">
            <dl class="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <div>
                <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Propiedad</dt>
                <dd class="font-medium text-gray-800 dark:text-white/90">{{ rental.property?.code }}</dd>
                <dd class="text-gray-500 dark:text-gray-400">{{ rental.property?.addressLine }}</dd>
              </div>
              <div>
                <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Propietario</dt>
                <dd class="font-medium text-gray-800 dark:text-white/90">{{ rental.property?.owner?.fullName ?? '—' }}</dd>
              </div>
              <div>
                <dt class="text-theme-xs text-gray-400 dark:text-gray-500">
                  {{ tenantNames.length > 1 ? 'Inquilinos' : 'Inquilino' }}
                </dt>
                <dd v-for="(name, i) in tenantNames" :key="name" class="text-gray-800 dark:text-white/90">
                  {{ name }}<span v-if="i === 0 && tenantNames.length > 1" class="text-theme-xs text-gray-400"> · principal</span>
                </dd>
                <dd v-if="!tenantNames.length" class="text-gray-500">—</dd>
              </div>
              <div>
                <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Vigencia</dt>
                <dd class="text-gray-800 dark:text-white/90">
                  {{ formatShortDate(rental.startDate) }} – {{ formatShortDate(rental.endDate) }}
                </dd>
              </div>
              <div>
                <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Moneda</dt>
                <dd class="text-gray-800 dark:text-white/90">{{ rental.currency }}</dd>
              </div>
              <div>
                <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Garantía</dt>
                <dd class="text-gray-800 dark:text-white/90">
                  {{ rental.securityDeposit != null ? formatMoney(rental.securityDeposit, rental.currency) : '—' }}
                </dd>
              </div>
            </dl>
          </FormSectionCard>

          <FormSectionCard title="Distribución financiera" subtitle="Ingreso, descuentos y comisiones del contrato">
            <template #actions>
              <BaseButton
                v-if="canWrite"
                variant="outline"
                size="sm"
                :icon="breakdown?.config ? 'lucide:pencil' : 'lucide:settings'"
                @click="goToFinancialConfig"
              >
                {{ breakdown?.config ? 'Editar' : 'Configurar' }}
              </BaseButton>
            </template>
            <LoadingState v-if="loadingBreakdown" variant="inline" text="Cargando desglose..." />
            <div v-else-if="breakdownQueryError" class="flex flex-col items-center gap-2 py-4 text-center">
              <p class="text-xs text-error-500 dark:text-error-400">{{ getApiErrorMessage(breakdownFetchError) }}</p>
              <BaseButton variant="outline" size="sm" @click="() => refetchBreakdown()">Reintentar</BaseButton>
            </div>
            <template v-else-if="breakdown">
              <p v-if="!breakdown.config" class="mb-3 text-theme-xs text-gray-500 dark:text-gray-400">
                Sin configuración: se muestra el monto del contrato sin descuentos.
              </p>
              <FinancialBreakdownSummary :breakdown="breakdown" />
            </template>
          </FormSectionCard>

          <FormSectionCard v-if="rental.notes" title="Observaciones">
            <p class="text-sm leading-relaxed whitespace-pre-wrap text-gray-600 dark:text-gray-400">{{ rental.notes }}</p>
          </FormSectionCard>
        </div>

        <!-- ── Lateral ── -->
        <aside class="space-y-6">
          <FormSectionCard title="Adjuntos">
            <ul class="space-y-2">
              <li
                v-for="a in attachments"
                :key="a.type"
                class="flex items-center gap-3 rounded-lg border p-3"
                :class="a.file ? 'border-success-500/20 bg-success-500/6' : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900'"
              >
                <AppIcon
                  :icon="a.file ? 'lucide:file-check' : 'lucide:file-x'"
                  :size="18"
                  :color="a.file ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)'"
                />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium" :class="a.file ? 'text-gray-800 dark:text-white/90' : 'text-gray-400'">
                    {{ a.label }}
                  </p>
                  <p v-if="a.file" class="truncate text-theme-xs text-gray-400 dark:text-gray-500">
                    {{ a.file.originalFileName }}
                  </p>
                </div>
                <a
                  v-if="a.file"
                  :href="getAttachmentUrl(a.file)"
                  target="_blank"
                  download
                  class="flex shrink-0 items-center gap-1 text-xs font-medium text-brand-500 dark:text-brand-400"
                >
                  <AppIcon icon="lucide:download" :size="14" />
                  Descargar
                </a>
                <span v-else class="text-theme-xs text-gray-400">Sin adjunto</span>
              </li>
            </ul>
            <BaseButton v-if="canWrite" variant="outline" size="sm" icon="lucide:upload" block class="mt-3" @click="goToEdit">
              Gestionar adjuntos
            </BaseButton>
          </FormSectionCard>

          <FormSectionCard title="Comisión (ingreso)">
            <ul class="space-y-2 text-sm">
              <li class="flex items-center justify-between gap-2">
                <span class="text-gray-600 dark:text-gray-400">Estado</span>
                <Badge :variant="rental.commissionStatus === 'PAID' ? 'success' : 'warning'">
                  {{ rental.commissionStatus === 'PAID' ? 'Pagada' : 'Pendiente de pago' }}
                </Badge>
              </li>
              <li v-if="breakdown" class="flex items-center justify-between gap-2">
                <span class="text-gray-600 dark:text-gray-400">Monto</span>
                <span class="font-semibold text-gray-800 dark:text-white/90">
                  {{ formatMoney(breakdown.baseAmount, breakdown.currency) }}
                </span>
              </li>
              <li class="flex items-center justify-between gap-2">
                <span class="text-gray-600 dark:text-gray-400">Fecha estimada</span>
                <span class="text-gray-800 dark:text-white/90">
                  {{ rental.commissionDueDate ? formatShortDate(rental.commissionDueDate) : '—' }}
                </span>
              </li>
              <li v-if="rental.commissionPaidDate" class="flex items-center justify-between gap-2">
                <span class="text-gray-600 dark:text-gray-400">Cobrada el</span>
                <span class="text-gray-800 dark:text-white/90">{{ formatShortDate(rental.commissionPaidDate) }}</span>
              </li>
            </ul>
            <BaseButton
              variant="outline"
              size="sm"
              icon="lucide:percent"
              block
              class="mt-3"
              @click="router.push({ name: 'alquileres-comisiones' })"
            >
              Ver comisiones
            </BaseButton>
          </FormSectionCard>

          <FormSectionCard title="Alertas del contrato">
            <ul class="space-y-2 text-sm">
              <li class="flex items-center justify-between gap-2">
                <span class="text-gray-600 dark:text-gray-400">Vencimiento</span>
                <Badge :variant="rental.enableExpirationAlerts ? 'success' : 'neutral'">
                  {{ rental.enableExpirationAlerts ? 'Activas' : 'Apagadas' }}
                </Badge>
              </li>
              <li class="flex items-center justify-between gap-2">
                <span class="text-gray-600 dark:text-gray-400">Cobranza</span>
                <Badge :variant="rental.enableCollectionAlerts ? 'success' : 'neutral'">
                  {{ rental.enableCollectionAlerts ? 'Activas' : 'Apagadas' }}
                </Badge>
              </li>
            </ul>
          </FormSectionCard>
        </aside>
      </div>
    </div>
  </div>
</template>
