<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, Badge } from '@shared/components'
import { useRental } from '../composables/useRentals'
import type { RentalDetail } from '../services/rentals.service'

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const { data: rental, isLoading: loadingRental, isError: rentalError } = useRental(id)

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatMoney(r: RentalDetail): string {
  const sym = r.currency === 'USD' ? 'US$' : 'S/'
  return `${sym} ${Number(r.monthlyAmount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

function statusLabel(s: string): string {
  const map: Record<string, string> = { ACTIVE: 'Vigente', EXPIRED: 'Vencido', CANCELLED: 'Cancelado' }
  return map[s] ?? s
}

function statusVariant(s: string): 'success' | 'error' | 'warning' | 'default' {
  if (s === 'ACTIVE') return 'success'
  if (s === 'EXPIRED') return 'error'
  if (s === 'CANCELLED') return 'warning'
  return 'default'
}

const goBack = () => router.push('/alquileres/contratos')
const goToEdit = () => router.push(`/alquileres/contratos/${id.value}/editar`)
</script>

<template>
  <div class="max-w-4xl mx-auto px-3 sm:px-5 py-6 sm:py-8">
    <div class="flex items-center justify-between gap-4 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      </button>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-bold truncate" :style="{ color: 'var(--color-text-primary)' }">
          {{ rental?.code ?? 'Detalle del alquiler' }}
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Contrato de alquiler
        </p>
      </div>
      <BaseButton v-if="rental" variant="outline" @click="goToEdit">
        Editar
      </BaseButton>
    </div>

    <div v-if="loadingRental" class="flex justify-center py-16">
      <svg
        class="animate-spin h-8 w-8"
        style="color: var(--color-primary)"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <p v-else-if="rentalError || !rental" class="text-sm py-8" :style="{ color: 'var(--color-error)' }">
      No se encontró el alquiler o ocurrió un error.
    </p>

    <template v-else>
      <!-- Alquiler y propiedad -->
      <section
        class="p-5 rounded-xl mb-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
          Alquiler y propiedad
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Código</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ rental.code }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Estado</p>
            <Badge :variant="statusVariant(rental.status)">{{ statusLabel(rental.status) }}</Badge>
          </div>
          <div class="sm:col-span-2">
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Propiedad</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ rental.property?.code }} – {{ rental.property?.addressLine }}</p>
          </div>
        </div>
      </section>

      <!-- Partes -->
      <section
        class="p-5 rounded-xl mb-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
          Partes
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Inquilino</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ rental.tenant?.fullName }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Propietario</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ rental.property?.owner?.fullName }}</p>
          </div>
        </div>
      </section>

      <!-- Vigencia y montos -->
      <section
        class="p-5 rounded-xl mb-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
          Vigencia y montos
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Inicio</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ formatDate(rental.startDate) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Fin</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ formatDate(rental.endDate) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Monto mensual</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">{{ formatMoney(rental) }}</p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Garantía</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">
              {{ rental.securityDeposit != null ? formatMoney({ ...rental, monthlyAmount: rental.securityDeposit }) : '–' }}
            </p>
          </div>
          <div>
            <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--color-text-muted)' }">Día de pago</p>
            <p class="font-medium" :style="{ color: 'var(--color-text-primary)' }">Día {{ rental.paymentDueDay }} de cada mes</p>
          </div>
        </div>
      </section>

      <!-- Adjuntos -->
      <section
        class="p-5 rounded-xl mb-4"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
          Adjuntos
        </h2>
        <ul class="space-y-2 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          <li class="flex items-center gap-2">
            <span v-if="rental.hasContract">✓</span>
            <span v-else>–</span>
            Contrato firmado
          </li>
          <li class="flex items-center gap-2">
            <span v-if="rental.hasDeliveryAct">✓</span>
            <span v-else>–</span>
            Acta de entrega
          </li>
        </ul>
      </section>

      <!-- Notas -->
      <section
        v-if="rental.notes"
        class="p-5 rounded-xl"
        :style="{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }"
      >
        <h2 class="text-base font-semibold mb-2" :style="{ color: 'var(--color-text-primary)' }">
          Notas
        </h2>
        <p class="text-sm whitespace-pre-wrap" :style="{ color: 'var(--color-text-secondary)' }">{{ rental.notes }}</p>
      </section>
    </template>
  </div>
</template>
