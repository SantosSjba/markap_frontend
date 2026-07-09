<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon } from '@shared/components'
import type { ProjectBudgetDetailDto, ProjectSettlementDto } from '../../domain/project-budget.types'
import { formatSol } from '../labels'

const props = defineProps<{
  budget?: ProjectBudgetDetailDto | null
  settlement?: ProjectSettlementDto | null
}>()

const allItems = computed(() => props.budget?.sections.flatMap((s) => s.lineItems) ?? [])

const pendingClientCollect = computed(() => (props.settlement?.pendingToCollect ?? 0) > 0.01)

const supplierBalanceItems = computed(() =>
  allItems.value.filter(
    (i) => (i.supplierBalance ?? 0) > 0.01 && (i.actualPurchaseCost ?? 0) > 0,
  ),
)

const totalSupplierPending = computed(() =>
  supplierBalanceItems.value.reduce((s, i) => s + (i.supplierBalance ?? 0), 0),
)

const itemsWithoutSupplier = computed(() =>
  allItems.value.filter(
    (i) => (i.actualPurchaseCost ?? 0) > 0 && !i.supplierId && !i.supplierName?.trim(),
  ),
)

const hasAlerts = computed(
  () =>
    pendingClientCollect.value ||
    supplierBalanceItems.value.length > 0 ||
    itemsWithoutSupplier.value.length > 0,
)
</script>

<template>
  <div
    v-if="hasAlerts"
    class="rounded-xl border p-4 space-y-3"
    :style="{ borderColor: 'var(--color-warning, #f59e0b)', background: 'color-mix(in srgb, #f59e0b 8%, transparent)' }"
  >
    <div class="flex items-center gap-2 text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">
      <AppIcon icon="lucide:triangle-alert" :size="18" color="#d97706" />
      Alertas financieras
    </div>

    <ul class="space-y-2 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
      <li v-if="pendingClientCollect" class="flex gap-2">
        <AppIcon icon="lucide:wallet" :size="16" color="#d97706" class="shrink-0 mt-0.5" />
        <span>
          Cobro pendiente al cliente:
          <strong :style="{ color: 'var(--color-text-primary)' }">
            {{ formatSol(settlement!.pendingToCollect) }}
          </strong>
        </span>
      </li>
      <li v-if="supplierBalanceItems.length" class="flex gap-2">
        <AppIcon icon="lucide:hand-coins" :size="16" color="#d97706" class="shrink-0 mt-0.5" />
        <span>
          Saldo pendiente a proveedores:
          <strong :style="{ color: 'var(--color-text-primary)' }">
            {{ formatSol(totalSupplierPending) }}
          </strong>
          en {{ supplierBalanceItems.length }} partida(s)
        </span>
      </li>
      <li v-if="itemsWithoutSupplier.length" class="flex gap-2">
        <AppIcon icon="lucide:truck" :size="16" color="#d97706" class="shrink-0 mt-0.5" />
        <span>
          {{ itemsWithoutSupplier.length }} partida(s) con costo real sin proveedor asignado
        </span>
      </li>
    </ul>
  </div>
</template>
