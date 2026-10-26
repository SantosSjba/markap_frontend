<script setup lang="ts">
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import { useRental, useRentalFinancialBreakdown } from '../composables/useRentals'
import type { RentalDetail } from '../../domain/rental.types'
import { getAttachmentUrl } from '../downloads/rental-attachment-url'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatShortDate } from '@shared/utils/formatters'
import { RENTAL_UTILITY_NET_LABEL } from '../../domain/rental-financial.labels'
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

function formatDate(d: string): string {
  return formatShortDate(d)
}

function formatMoney(r: RentalDetail): string {
  const sym = r.currency === 'USD' ? 'US$' : 'S/'
  return `${sym} ${Number(r.monthlyAmount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function formatAmount(amount: number, currency: string): string {
  const sym = currency === 'USD' ? 'US$' : 'S/'
  return `${sym} ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'Vigente',
    EXPIRED: 'Vencido',
    CANCELLED: 'Cancelado',
  }
  return map[s] ?? s
}

function statusVariant(s: string): 'success' | 'error' | 'warning' | 'neutral' {
  if (s === 'ACTIVE') return 'success'
  if (s === 'EXPIRED') return 'error'
  if (s === 'CANCELLED') return 'warning'
  return 'neutral'
}

const goBack = () => router.push('/alquileres/contratos')
const goToEdit = () => router.push(`/alquileres/contratos/${id.value}/editar`)
const goToFinancialConfig = () =>
  router.push(`/alquileres/contratos/${id.value}/distribucion-financiera`)
</script>

<template>
  <div >
    <!-- Header -->
    <PageHeader
      :title="rental?.code ?? 'Detalle del alquiler'"
      subtitle="Contrato de alquiler"
      back
      @back="goBack"
      class="mb-6"
    >
      <template #actions>
        <div v-if="rental" class="flex items-center gap-2 shrink-0">
        <BaseButton variant="outline" size="sm" class="flex items-center gap-1.5" @click="goToFinancialConfig">
          <AppIcon icon="lucide:sliders-horizontal" :size="15" />
          <span class="hidden sm:inline">Distribución financiera</span>
        </BaseButton>
        <BaseButton variant="primary" size="sm" class="flex items-center gap-1.5" @click="goToEdit">
          <AppIcon icon="lucide:pencil" :size="15" />
          Editar
        </BaseButton>
      </div>
      </template>
    </PageHeader>

    <!-- Loading -->
    <LoadingState v-if="loadingRental" text="Cargando contrato..." class="py-24" />

    <!-- Error -->
    <div
      v-else-if="rentalError || !rental"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="text-sm font-medium text-center max-w-md text-error-500 dark:text-error-400">
        {{ rentalError ? getApiErrorMessage(rentalFetchError) : 'No se encontró el alquiler.' }}
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <BaseButton v-if="rentalError" variant="outline" size="sm" @click="() => refetchRental()">Reintentar</BaseButton>
        <BaseButton variant="outline" size="sm" @click="goBack">Volver al listado</BaseButton>
      </div>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <!-- Columna principal -->
        <div class="xl:col-span-2 space-y-5">

          <FormSectionCard
            title="Propiedad"
            subtitle="Datos del inmueble del contrato"
            icon="lucide:building-2"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p class="text-xs uppercase tracking-wide font-medium mb-1 text-gray-400 dark:text-gray-500">Código</p>
                <p class="font-semibold text-gray-800 dark:text-white/90">{{ rental.code }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide font-medium mb-1 text-gray-400 dark:text-gray-500">Estado</p>
                <Badge :variant="statusVariant(rental.status)">{{ statusLabel(rental.status) }}</Badge>
              </div>
              <div class="sm:col-span-2">
                <p class="text-xs uppercase tracking-wide font-medium mb-1 text-gray-400 dark:text-gray-500">Dirección</p>
                <div class="flex items-start gap-2">
                  <AppIcon icon="lucide:map-pin" :size="15" color="var(--color-text-muted)" class="mt-0.5 shrink-0" />
                  <p class="font-medium text-gray-800 dark:text-white/90">
                    {{ rental.property?.code }} – {{ rental.property?.addressLine }}
                  </p>
                </div>
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard
            title="Partes"
            subtitle="Inquilino y propietario"
            icon="lucide:users"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-blue-light-500/12">
                  <AppIcon icon="lucide:user" :size="17" color="var(--color-info, #3b82f6)" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-medium mb-0.5 text-gray-400 dark:text-gray-500">Inquilino</p>
                  <p class="font-semibold text-gray-800 dark:text-white/90">
                    {{
                      (rental.tenants?.length
                        ? rental.tenants.map((t) => t.fullName)
                        : rental.tenant?.fullName
                          ? [rental.tenant.fullName]
                          : []
                      ).join(', ') || '—'
                    }}
                  </p>
                </div>
              </div>
              <div
                class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-success-500/12">
                  <AppIcon icon="lucide:briefcase" :size="17" color="var(--color-success, #16a34a)" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-medium mb-0.5 text-gray-400 dark:text-gray-500">Propietario</p>
                  <p class="font-semibold truncate text-gray-800 dark:text-white/90">{{ rental.property?.owner?.fullName }}</p>
                </div>
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard
            title="Distribución financiera"
            subtitle="Desglose de ingresos y comisiones"
            icon="lucide:wallet"
          >
            <div class="flex justify-end mb-4">
              <BaseButton variant="outline" size="sm" class="flex items-center gap-1.5" @click="goToFinancialConfig">
                <AppIcon :icon="breakdown?.config ? 'lucide:pencil' : 'lucide:settings'" :size="13" />
                {{ breakdown?.config ? 'Editar' : 'Configurar' }}
              </BaseButton>
            </div>

            <LoadingState v-if="loadingBreakdown" variant="inline" text="Cargando desglose..." />

            <div
              v-else-if="breakdownQueryError"
              class="flex flex-col items-center py-6 gap-2 rounded-lg text-center px-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
            >
              <p class="text-xs text-error-500 dark:text-error-400">{{ getApiErrorMessage(breakdownFetchError) }}</p>
              <BaseButton variant="outline" size="sm" @click="() => refetchBreakdown()">Reintentar</BaseButton>
            </div>

            <template v-else-if="breakdown">
              <div class="grid grid-cols-2 gap-3 mb-4">
                <div
                  class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
                >
                  <p class="text-xs font-medium mb-1 text-gray-400 dark:text-gray-500">Monto mensual (contrato)</p>
                  <p class="text-base font-bold text-gray-800 dark:text-white/90">
                    {{ formatAmount(breakdown.monthlyAmount, breakdown.currency) }}
                  </p>
                </div>
                <div
                  class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
                >
                  <p class="text-xs font-medium mb-1 text-gray-400 dark:text-gray-500">Monto base para distribución</p>
                  <p class="text-base font-bold text-brand-500 dark:text-brand-400">
                    {{ formatAmount(breakdown.baseAmount, breakdown.currency) }}
                  </p>
                  <p v-if="breakdown.baseAmount !== breakdown.monthlyAmount" class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
                    Monto personalizado
                  </p>
                </div>
              </div>

              <div class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                <Table class="w-full text-sm">
                  <TableHeader>
                    <TableRow class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                      <TableCell is-header class="text-left py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400">Concepto</TableCell>
                      <TableCell is-header class="text-right py-2.5 px-4 font-medium text-gray-500 dark:text-gray-400">Monto</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow class="border-b border-gray-200 dark:border-gray-800">
                      <TableCell class="py-2.5 px-4 flex items-center gap-2 text-gray-800 dark:text-white/90">
                        <AppIcon icon="lucide:circle-plus" :size="15" color="var(--color-success, #16a34a)" />
                        Ingreso (monto base)
                      </TableCell>
                      <TableCell class="py-2.5 px-4 text-right font-semibold text-gray-800 dark:text-white/90">
                        {{ formatAmount(breakdown.baseAmount, breakdown.currency) }}
                      </TableCell>
                    </TableRow>
                    <TableRow class="border-b border-gray-200 dark:border-gray-800">
                      <TableCell class="py-2.5 px-4 text-gray-500 dark:text-gray-400">
                        <span class="flex items-center gap-2">
                          <AppIcon icon="lucide:minus-circle" :size="15" color="var(--color-warning, #d97706)" />
                          Gastos
                        </span>
                        <p
                          v-if="breakdown.config?.expenseDetail"
                          class="text-xs mt-1 pl-6 text-gray-400 dark:text-gray-500"
                        >
                          {{ breakdown.config.expenseDetail }}
                        </p>
                      </TableCell>
                      <TableCell class="py-2.5 px-4 text-right text-gray-500 dark:text-gray-400">
                        − {{ formatAmount(breakdown.expense, breakdown.currency) }}
                      </TableCell>
                    </TableRow>
                    <TableRow class="border-b border-gray-200 dark:border-gray-800">
                      <TableCell class="py-2.5 px-4 text-gray-500 dark:text-gray-400">
                        <span class="flex items-center gap-2">
                          <AppIcon icon="lucide:minus-circle" :size="15" color="var(--color-warning, #d97706)" />
                          Impuestos
                        </span>
                        <p
                          v-if="breakdown.config?.taxDetail"
                          class="text-xs mt-1 pl-6 text-gray-400 dark:text-gray-500"
                        >
                          {{ breakdown.config.taxDetail }}
                        </p>
                      </TableCell>
                      <TableCell class="py-2.5 px-4 text-right text-gray-500 dark:text-gray-400">
                        − {{ formatAmount(breakdown.tax, breakdown.currency) }}
                      </TableCell>
                    </TableRow>
                    <TableRow class="border-b border-gray-200 dark:border-gray-800">
                      <TableCell class="py-2.5 px-4 text-gray-500 dark:text-gray-400">
                        <span class="flex items-center gap-2">
                          <AppIcon icon="lucide:minus-circle" :size="15" color="var(--color-warning, #d97706)" />
                          Comisión agente externo
                        </span>
                      </TableCell>
                      <TableCell class="py-2.5 px-4 text-right text-gray-500 dark:text-gray-400">
                        − {{ formatAmount(breakdown.externalAgentCommission, breakdown.currency) }}
                      </TableCell>
                    </TableRow>
                    <TableRow class="border-b border-gray-200 dark:border-gray-800">
                      <TableCell class="py-2.5 px-4 text-gray-500 dark:text-gray-400">
                        <span class="flex items-center gap-2">
                          <AppIcon icon="lucide:minus-circle" :size="15" color="var(--color-warning, #d97706)" />
                          Comisión agente interno
                        </span>
                      </TableCell>
                      <TableCell class="py-2.5 px-4 text-right text-gray-500 dark:text-gray-400">
                        − {{ formatAmount(breakdown.internalAgentCommission, breakdown.currency) }}
                      </TableCell>
                    </TableRow>
                    <TableRow class="bg-brand-500/5">
                      <TableCell class="py-3 px-4 font-semibold text-gray-800 dark:text-white/90">
                        <span class="flex items-center gap-2">
                          <AppIcon icon="lucide:circle-check" :size="16" color="var(--color-primary)" />
                          {{ RENTAL_UTILITY_NET_LABEL }}
                        </span>
                      </TableCell>
                      <TableCell class="py-3 px-4 text-right font-bold text-base text-brand-500 dark:text-brand-400">
                        {{ formatAmount(breakdown.utility, breakdown.currency) }}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </template>

            <div
              v-else
              class="flex flex-col items-center py-8 gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700"
            >
              <AppIcon icon="lucide:sliders-horizontal" :size="28" color="var(--color-text-muted)" />
              <p class="text-sm text-center max-w-xs text-gray-400 dark:text-gray-500">
                Sin configuración financiera. Presione "Configurar" para definir el monto base, gastos, impuestos y comisiones.
              </p>
            </div>
          </FormSectionCard>
        </div>

        <!-- Columna lateral -->
        <div class="space-y-5">
          <FormSectionCard
            title="Vigencia y montos"
            subtitle="Fechas y condiciones del contrato"
            icon="lucide:calendar"
          >
            <dl class="space-y-3">
              <div class="flex justify-between items-center">
                <dt class="text-sm flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                  <AppIcon icon="lucide:calendar-plus" :size="14" />
                  Inicio
                </dt>
                <dd class="text-sm font-medium text-gray-800 dark:text-white/90">{{ formatDate(rental.startDate) }}</dd>
              </div>
              <div class="flex justify-between items-center">
                <dt class="text-sm flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                  <AppIcon icon="lucide:calendar-check" :size="14" />
                  Fin
                </dt>
                <dd class="text-sm font-medium text-gray-800 dark:text-white/90">{{ formatDate(rental.endDate) }}</dd>
              </div>
              <div class="border-t pt-3 border-gray-200 dark:border-gray-800">
                <div class="flex justify-between items-center">
                  <dt class="text-sm flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                    <AppIcon icon="lucide:banknote" :size="14" />
                    Monto mensual
                  </dt>
                  <dd class="font-bold text-base text-brand-500 dark:text-brand-400">{{ formatMoney(rental) }}</dd>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <dt class="text-sm flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                  <AppIcon icon="lucide:shield" :size="14" />
                  Garantía
                </dt>
                <dd class="text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ rental.securityDeposit != null ? formatMoney({ ...rental, monthlyAmount: rental.securityDeposit }) : '–' }}
                </dd>
              </div>
              <div class="flex justify-between items-center">
                <dt class="text-sm flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                  <AppIcon icon="lucide:clock" :size="14" />
                  Día de pago
                </dt>
                <dd class="text-sm font-medium text-gray-800 dark:text-white/90">Día {{ rental.paymentDueDay }}</dd>
              </div>
            </dl>
          </FormSectionCard>

          <FormSectionCard
            title="Adjuntos"
            subtitle="Contrato y acta de entrega"
            icon="lucide:paperclip"
          >
            <ul class="space-y-2">
              <!-- Contrato -->
              <li class="flex items-center gap-3 p-3 rounded-lg border"
                :class="rental.hasContract ? 'border-success-500/20 bg-success-500/6' : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800'"
              >
                <AppIcon
                  :icon="rental.hasContract ? 'lucide:file-check' : 'lucide:file-x'"
                  :size="20"
                  :color="rental.hasContract ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)'"
                />
                <div class="flex-1 min-w-0">
                  <span :class="(rental.hasContract) ? 'text-gray-800 dark:text-white/90' : 'text-gray-400 dark:text-gray-500'" class="text-sm font-medium block">
                    Contrato firmado
                  </span>
                  <span v-if="rental.attachments?.find(a => a.type === 'CONTRACT')" class="text-xs truncate block text-gray-400 dark:text-gray-500">
                    {{ rental.attachments.find(a => a.type === 'CONTRACT')!.originalFileName }}
                  </span>
                </div>
                <a
                  v-if="rental.attachments?.find(a => a.type === 'CONTRACT')"
                  :href="getAttachmentUrl(rental.attachments.find(a => a.type === 'CONTRACT')!)"
                  target="_blank"
                  download
                  class="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors text-brand-500 dark:text-brand-400 bg-brand-500/10"
                >
                  <AppIcon icon="lucide:download" :size="14" />
                  Descargar
                </a>
                <span
                  v-else
                  class="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500"
                >Sin adjunto</span>
              </li>

              <!-- Acta de entrega -->
              <li class="flex items-center gap-3 p-3 rounded-lg border"
                :class="rental.hasDeliveryAct ? 'border-success-500/20 bg-success-500/6' : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800'"
              >
                <AppIcon
                  :icon="rental.hasDeliveryAct ? 'lucide:file-check' : 'lucide:file-x'"
                  :size="20"
                  :color="rental.hasDeliveryAct ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)'"
                />
                <div class="flex-1 min-w-0">
                  <span :class="(rental.hasDeliveryAct) ? 'text-gray-800 dark:text-white/90' : 'text-gray-400 dark:text-gray-500'" class="text-sm font-medium block">
                    Acta de entrega
                  </span>
                  <span v-if="rental.attachments?.find(a => a.type === 'DELIVERY_ACT')" class="text-xs truncate block text-gray-400 dark:text-gray-500">
                    {{ rental.attachments.find(a => a.type === 'DELIVERY_ACT')!.originalFileName }}
                  </span>
                </div>
                <a
                  v-if="rental.attachments?.find(a => a.type === 'DELIVERY_ACT')"
                  :href="getAttachmentUrl(rental.attachments.find(a => a.type === 'DELIVERY_ACT')!)"
                  target="_blank"
                  download
                  class="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors text-brand-500 dark:text-brand-400 bg-brand-500/10"
                >
                  <AppIcon icon="lucide:download" :size="14" />
                  Descargar
                </a>
                <span
                  v-else
                  class="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500"
                >Sin adjunto</span>
              </li>
            </ul>
            <BaseButton variant="outline" size="sm" class="w-full mt-3 flex items-center justify-center gap-1.5" @click="goToEdit">
              <AppIcon icon="lucide:upload" :size="14" />
              Gestionar adjuntos
            </BaseButton>
          </FormSectionCard>

          <FormSectionCard
            v-if="rental.notes"
            title="Observaciones"
            subtitle="Notas del contrato"
            icon="lucide:message-square"
          >
            <p class="text-sm whitespace-pre-wrap leading-relaxed text-gray-500 dark:text-gray-400">{{ rental.notes }}</p>
          </FormSectionCard>
        </div>
      </div>
    </template>
  </div>
</template>
