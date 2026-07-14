<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, Badge, AppIcon, FormSectionCard } from '@shared/components'
import { useRental, useRentalFinancialBreakdown } from '../../application/useRentals'
import type { RentalDetail } from '../../domain/rental.types'
import { getAttachmentUrl } from '../../infrastructure/http/rental-attachment-url'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { formatShortDate } from '@/shared/utils/formatters'
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
  const map: Record<string, string> = { ACTIVE: 'Vigente', EXPIRED: 'Vencido', CANCELLED: 'Cancelado' }
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
const goToFinancialConfig = () => router.push(`/alquileres/contratos/${id.value}/distribucion-financiera`)
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg transition-colors hover:bg-[var(--color-hover)] shrink-0"
        :style="{ color: 'var(--color-text-secondary)' }"
        title="Volver al listado"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <AppIcon icon="lucide:file-text" :size="18" color="var(--color-primary)" />
          <h1 class="text-xl font-bold truncate" :style="{ color: 'var(--color-text-primary)' }">
            {{ rental?.code ?? 'Detalle del alquiler' }}
          </h1>
        </div>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Contrato de alquiler
        </p>
      </div>
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
    </div>

    <!-- Loading -->
    <div v-if="loadingRental" class="flex flex-col items-center justify-center py-24 gap-3">
      <AppIcon icon="svg-spinners:ring-resize" :size="36" color="var(--color-primary)" />
      <p class="text-sm" :style="{ color: 'var(--color-text-muted)' }">Cargando contrato...</p>
    </div>

    <!-- Error -->
    <div
      v-else-if="rentalError || !rental"
      class="flex flex-col items-center justify-center py-16 gap-3"
    >
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="text-sm font-medium text-center max-w-md" :style="{ color: 'var(--color-error)' }">
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
                <p class="text-xs uppercase tracking-wide font-medium mb-1" :style="{ color: 'var(--color-text-muted)' }">Código</p>
                <p class="font-semibold" :style="{ color: 'var(--color-text-primary)' }">{{ rental.code }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide font-medium mb-1" :style="{ color: 'var(--color-text-muted)' }">Estado</p>
                <Badge :variant="statusVariant(rental.status)">{{ statusLabel(rental.status) }}</Badge>
              </div>
              <div class="sm:col-span-2">
                <p class="text-xs uppercase tracking-wide font-medium mb-1" :style="{ color: 'var(--color-text-muted)' }">Dirección</p>
                <div class="flex items-start gap-2">
                  <AppIcon icon="lucide:map-pin" :size="15" color="var(--color-text-muted)" class="mt-0.5 shrink-0" />
                  <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
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
                class="flex items-center gap-3 p-3 rounded-lg"
                :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
              >
                <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-info, #3b82f6)20' }">
                  <AppIcon icon="lucide:user" :size="17" color="var(--color-info, #3b82f6)" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Inquilino</p>
                  <p class="font-semibold" :style="{ color: 'var(--color-text-primary)' }">
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
                class="flex items-center gap-3 p-3 rounded-lg"
                :style="{ backgroundColor: 'var(--color-surface-elevated)' }"
              >
                <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0" :style="{ backgroundColor: 'var(--color-success, #16a34a)20' }">
                  <AppIcon icon="lucide:briefcase" :size="17" color="var(--color-success, #16a34a)" />
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-medium mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Propietario</p>
                  <p class="font-semibold truncate" :style="{ color: 'var(--color-text-primary)' }">{{ rental.property?.owner?.fullName }}</p>
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

            <div v-if="loadingBreakdown" class="flex items-center gap-2 py-4" :style="{ color: 'var(--color-text-muted)' }">
              <AppIcon icon="svg-spinners:ring-resize" :size="18" color="var(--color-primary)" />
              <span class="text-sm">Cargando desglose...</span>
            </div>

            <div
              v-else-if="breakdownQueryError"
              class="flex flex-col items-center py-6 gap-2 rounded-lg text-center px-2"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
            >
              <p class="text-xs" style="color: var(--color-error)">{{ getApiErrorMessage(breakdownFetchError) }}</p>
              <BaseButton variant="outline" size="sm" @click="() => refetchBreakdown()">Reintentar</BaseButton>
            </div>

            <template v-else-if="breakdown">
              <div class="grid grid-cols-2 gap-3 mb-4">
                <div
                  class="p-3 rounded-lg"
                  :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
                >
                  <p class="text-xs font-medium mb-1" :style="{ color: 'var(--color-text-muted)' }">Monto mensual (contrato)</p>
                  <p class="text-base font-bold" :style="{ color: 'var(--color-text-primary)' }">
                    {{ formatAmount(breakdown.monthlyAmount, breakdown.currency) }}
                  </p>
                </div>
                <div
                  class="p-3 rounded-lg"
                  :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)' }"
                >
                  <p class="text-xs font-medium mb-1" :style="{ color: 'var(--color-text-muted)' }">Monto base para distribución</p>
                  <p class="text-base font-bold" :style="{ color: 'var(--color-primary)' }">
                    {{ formatAmount(breakdown.baseAmount, breakdown.currency) }}
                  </p>
                  <p v-if="breakdown.baseAmount !== breakdown.monthlyAmount" class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
                    Monto personalizado
                  </p>
                </div>
              </div>

              <div class="rounded-lg overflow-hidden" :style="{ border: '1px solid var(--color-border)' }">
                <table class="w-full text-sm">
                  <thead>
                    <tr :style="{ backgroundColor: 'var(--color-surface-elevated)', borderBottom: '1px solid var(--color-border)' }">
                      <th class="text-left py-2.5 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Concepto</th>
                      <th class="text-right py-2.5 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                      <td class="py-2.5 px-4 flex items-center gap-2" :style="{ color: 'var(--color-text-primary)' }">
                        <AppIcon icon="lucide:circle-plus" :size="15" color="var(--color-success, #16a34a)" />
                        Ingreso (monto base)
                      </td>
                      <td class="py-2.5 px-4 text-right font-semibold" :style="{ color: 'var(--color-text-primary)' }">
                        {{ formatAmount(breakdown.baseAmount, breakdown.currency) }}
                      </td>
                    </tr>
                    <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                      <td class="py-2.5 px-4" :style="{ color: 'var(--color-text-secondary)' }">
                        <span class="flex items-center gap-2">
                          <AppIcon icon="lucide:minus-circle" :size="15" color="var(--color-warning, #d97706)" />
                          Gastos
                        </span>
                        <p
                          v-if="breakdown.config?.expenseDetail"
                          class="text-xs mt-1 pl-6"
                          style="color: var(--color-text-muted);"
                        >
                          {{ breakdown.config.expenseDetail }}
                        </p>
                      </td>
                      <td class="py-2.5 px-4 text-right" :style="{ color: 'var(--color-text-secondary)' }">
                        − {{ formatAmount(breakdown.expense, breakdown.currency) }}
                      </td>
                    </tr>
                    <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                      <td class="py-2.5 px-4" :style="{ color: 'var(--color-text-secondary)' }">
                        <span class="flex items-center gap-2">
                          <AppIcon icon="lucide:minus-circle" :size="15" color="var(--color-warning, #d97706)" />
                          Impuestos
                        </span>
                        <p
                          v-if="breakdown.config?.taxDetail"
                          class="text-xs mt-1 pl-6"
                          style="color: var(--color-text-muted);"
                        >
                          {{ breakdown.config.taxDetail }}
                        </p>
                      </td>
                      <td class="py-2.5 px-4 text-right" :style="{ color: 'var(--color-text-secondary)' }">
                        − {{ formatAmount(breakdown.tax, breakdown.currency) }}
                      </td>
                    </tr>
                    <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                      <td class="py-2.5 px-4" :style="{ color: 'var(--color-text-secondary)' }">
                        <span class="flex items-center gap-2">
                          <AppIcon icon="lucide:minus-circle" :size="15" color="var(--color-warning, #d97706)" />
                          Comisión agente externo
                        </span>
                      </td>
                      <td class="py-2.5 px-4 text-right" :style="{ color: 'var(--color-text-secondary)' }">
                        − {{ formatAmount(breakdown.externalAgentCommission, breakdown.currency) }}
                      </td>
                    </tr>
                    <tr :style="{ borderBottom: '1px solid var(--color-border)' }">
                      <td class="py-2.5 px-4" :style="{ color: 'var(--color-text-secondary)' }">
                        <span class="flex items-center gap-2">
                          <AppIcon icon="lucide:minus-circle" :size="15" color="var(--color-warning, #d97706)" />
                          Comisión agente interno
                        </span>
                      </td>
                      <td class="py-2.5 px-4 text-right" :style="{ color: 'var(--color-text-secondary)' }">
                        − {{ formatAmount(breakdown.internalAgentCommission, breakdown.currency) }}
                      </td>
                    </tr>
                    <tr :style="{ backgroundColor: 'var(--color-primary)0d' }">
                      <td class="py-3 px-4 font-semibold" :style="{ color: 'var(--color-text-primary)' }">
                        <span class="flex items-center gap-2">
                          <AppIcon icon="lucide:circle-check" :size="16" color="var(--color-primary)" />
                          {{ RENTAL_UTILITY_NET_LABEL }}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-right font-bold text-base" :style="{ color: 'var(--color-primary)' }">
                        {{ formatAmount(breakdown.utility, breakdown.currency) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <div
              v-else
              class="flex flex-col items-center py-8 gap-3 rounded-lg"
              :style="{ backgroundColor: 'var(--color-surface-elevated)', border: '1px dashed var(--color-border)' }"
            >
              <AppIcon icon="lucide:sliders-horizontal" :size="28" color="var(--color-text-muted)" />
              <p class="text-sm text-center max-w-xs" :style="{ color: 'var(--color-text-muted)' }">
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
                <dt class="text-sm flex items-center gap-1.5" :style="{ color: 'var(--color-text-muted)' }">
                  <AppIcon icon="lucide:calendar-plus" :size="14" />
                  Inicio
                </dt>
                <dd class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ formatDate(rental.startDate) }}</dd>
              </div>
              <div class="flex justify-between items-center">
                <dt class="text-sm flex items-center gap-1.5" :style="{ color: 'var(--color-text-muted)' }">
                  <AppIcon icon="lucide:calendar-check" :size="14" />
                  Fin
                </dt>
                <dd class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ formatDate(rental.endDate) }}</dd>
              </div>
              <div class="border-t pt-3" :style="{ borderColor: 'var(--color-border)' }">
                <div class="flex justify-between items-center">
                  <dt class="text-sm flex items-center gap-1.5" :style="{ color: 'var(--color-text-muted)' }">
                    <AppIcon icon="lucide:banknote" :size="14" />
                    Monto mensual
                  </dt>
                  <dd class="font-bold text-base" :style="{ color: 'var(--color-primary)' }">{{ formatMoney(rental) }}</dd>
                </div>
              </div>
              <div class="flex justify-between items-center">
                <dt class="text-sm flex items-center gap-1.5" :style="{ color: 'var(--color-text-muted)' }">
                  <AppIcon icon="lucide:shield" :size="14" />
                  Garantía
                </dt>
                <dd class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
                  {{ rental.securityDeposit != null ? formatMoney({ ...rental, monthlyAmount: rental.securityDeposit }) : '–' }}
                </dd>
              </div>
              <div class="flex justify-between items-center">
                <dt class="text-sm flex items-center gap-1.5" :style="{ color: 'var(--color-text-muted)' }">
                  <AppIcon icon="lucide:clock" :size="14" />
                  Día de pago
                </dt>
                <dd class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">Día {{ rental.paymentDueDay }}</dd>
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
              <li
                class="flex items-center gap-3 p-3 rounded-lg"
                :style="{
                  backgroundColor: rental.hasContract ? 'var(--color-success, #16a34a)0f' : 'var(--color-surface-elevated)',
                  border: `1px solid ${rental.hasContract ? 'var(--color-success, #16a34a)33' : 'var(--color-border)'}`,
                }"
              >
                <AppIcon
                  :icon="rental.hasContract ? 'lucide:file-check' : 'lucide:file-x'"
                  :size="20"
                  :color="rental.hasContract ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)'"
                />
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-medium block" :style="{ color: rental.hasContract ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }">
                    Contrato firmado
                  </span>
                  <span v-if="rental.attachments?.find(a => a.type === 'CONTRACT')" class="text-xs truncate block" :style="{ color: 'var(--color-text-muted)' }">
                    {{ rental.attachments.find(a => a.type === 'CONTRACT')!.originalFileName }}
                  </span>
                </div>
                <a
                  v-if="rental.attachments?.find(a => a.type === 'CONTRACT')"
                  :href="getAttachmentUrl(rental.attachments.find(a => a.type === 'CONTRACT')!)"
                  target="_blank"
                  download
                  class="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors"
                  :style="{ color: 'var(--color-primary)', background: 'var(--color-primary)1a' }"
                >
                  <AppIcon icon="lucide:download" :size="14" />
                  Descargar
                </a>
                <span
                  v-else
                  class="ml-auto text-xs font-medium"
                  :style="{ color: 'var(--color-text-muted)' }"
                >Sin adjunto</span>
              </li>

              <!-- Acta de entrega -->
              <li
                class="flex items-center gap-3 p-3 rounded-lg"
                :style="{
                  backgroundColor: rental.hasDeliveryAct ? 'var(--color-success, #16a34a)0f' : 'var(--color-surface-elevated)',
                  border: `1px solid ${rental.hasDeliveryAct ? 'var(--color-success, #16a34a)33' : 'var(--color-border)'}`,
                }"
              >
                <AppIcon
                  :icon="rental.hasDeliveryAct ? 'lucide:file-check' : 'lucide:file-x'"
                  :size="20"
                  :color="rental.hasDeliveryAct ? 'var(--color-success, #16a34a)' : 'var(--color-text-muted)'"
                />
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-medium block" :style="{ color: rental.hasDeliveryAct ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }">
                    Acta de entrega
                  </span>
                  <span v-if="rental.attachments?.find(a => a.type === 'DELIVERY_ACT')" class="text-xs truncate block" :style="{ color: 'var(--color-text-muted)' }">
                    {{ rental.attachments.find(a => a.type === 'DELIVERY_ACT')!.originalFileName }}
                  </span>
                </div>
                <a
                  v-if="rental.attachments?.find(a => a.type === 'DELIVERY_ACT')"
                  :href="getAttachmentUrl(rental.attachments.find(a => a.type === 'DELIVERY_ACT')!)"
                  target="_blank"
                  download
                  class="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-colors"
                  :style="{ color: 'var(--color-primary)', background: 'var(--color-primary)1a' }"
                >
                  <AppIcon icon="lucide:download" :size="14" />
                  Descargar
                </a>
                <span
                  v-else
                  class="ml-auto text-xs font-medium"
                  :style="{ color: 'var(--color-text-muted)' }"
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
            <p class="text-sm whitespace-pre-wrap leading-relaxed" :style="{ color: 'var(--color-text-secondary)' }">{{ rental.notes }}</p>
          </FormSectionCard>
        </div>
      </div>
    </template>
  </div>
</template>
