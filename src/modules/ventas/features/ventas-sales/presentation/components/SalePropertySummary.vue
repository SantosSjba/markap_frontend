<script setup lang="ts">
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import { formatCurrency } from '@shared/utils/formatters'
import {
  listingStatusLabel,
  listingStatusVariant,
} from '../../../propiedades/domain/listing-status'
/**
 * SalePropertySummary — ficha compacta del inmueble de un proceso: código, tipo, dirección,
 * precio en su moneda y características. Se usa en el alta (al elegir el inmueble) y en el detalle.
 */

export interface SalePropertySummaryData {
  code: string
  addressLine: string
  propertyTypeName?: string | null
  locationLabel?: string | null
  projectName?: string | null
  listingStatus?: string | null
  salePrice?: number | null
  saleCurrency?: string | null
  area?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
}

defineProps<{ property: SalePropertySummaryData }>()
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-start gap-3">
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/10">
        <AppIcon icon="lucide:building-2" :size="20" color="var(--color-primary)" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <p class="font-semibold break-all text-gray-800 dark:text-white/90">{{ property.code }}</p>
          <Badge v-if="property.listingStatus" :variant="listingStatusVariant(property.listingStatus)">
            {{ listingStatusLabel(property.listingStatus) }}
          </Badge>
        </div>
        <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
          {{ property.propertyTypeName ?? 'Inmueble' }}<template v-if="property.projectName"> · {{ property.projectName }}</template>
        </p>
        <p class="mt-1 flex items-start gap-1.5 text-sm text-gray-700 dark:text-gray-300">
          <AppIcon icon="lucide:map-pin" :size="14" class="mt-0.5 shrink-0" color="var(--color-text-muted)" />
          <span>
            {{ property.addressLine }}
            <span v-if="property.locationLabel" class="block text-theme-xs text-gray-400 dark:text-gray-500">{{ property.locationLabel }}</span>
          </span>
        </p>
      </div>
      <div class="shrink-0 text-right">
        <p class="text-theme-xs text-gray-400 dark:text-gray-500">Precio de venta</p>
        <p class="text-lg font-bold tabular-nums text-brand-500 dark:text-brand-400">
          {{ property.salePrice != null ? formatCurrency(property.salePrice, property.saleCurrency ?? 'PEN') : '—' }}
        </p>
      </div>
    </div>

    <div
      v-if="property.area != null || property.bedrooms != null || property.bathrooms != null"
      class="grid grid-cols-3 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-white/3"
    >
      <div class="flex flex-col items-center gap-1 text-center">
        <AppIcon icon="lucide:ruler" :size="16" color="var(--color-text-muted)" />
        <span class="text-sm font-bold text-gray-800 dark:text-white/90">{{ property.area != null ? `${property.area} m²` : '—' }}</span>
        <span class="text-xs text-gray-400 dark:text-gray-500">Área</span>
      </div>
      <div class="flex flex-col items-center gap-1 text-center">
        <AppIcon icon="lucide:bed-double" :size="16" color="var(--color-text-muted)" />
        <span class="text-sm font-bold text-gray-800 dark:text-white/90">{{ property.bedrooms ?? '—' }}</span>
        <span class="text-xs text-gray-400 dark:text-gray-500">Dorm.</span>
      </div>
      <div class="flex flex-col items-center gap-1 text-center">
        <AppIcon icon="lucide:bath" :size="16" color="var(--color-text-muted)" />
        <span class="text-sm font-bold text-gray-800 dark:text-white/90">{{ property.bathrooms ?? '—' }}</span>
        <span class="text-xs text-gray-400 dark:text-gray-500">Baños</span>
      </div>
    </div>
  </div>
</template>
