<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { DataTable, FormSelect, SearchInput, StatsCard, AppIcon, BaseButton } from '@shared/components'
import { useProduccionMaterialsList, useProduccionInventoryStats } from '../../application/useProduccionInventory'
import { formatSol, formatQty } from '../labels'
import type { ProduccionMaterial } from '../../domain/inventory.types'

const router = useRouter()
const listParams = ref({ page: 1, limit: 50, lowStockOnly: false })
const searchInput = ref('')
const lowStockOnly = ref(false)

const { data: stats } = useProduccionInventoryStats()
const { data: result, isLoading } = useProduccionMaterialsList(
  computed(() => ({
    ...listParams.value,
    search: searchInput.value.trim() || undefined,
    lowStockOnly: lowStockOnly.value,
  })),
)

const rows = computed(() => result.value?.data ?? [])

const columns = [
  { key: 'code', label: 'Código', align: 'left' as const },
  { key: 'name', label: 'Material', align: 'left' as const },
  { key: 'currentStock', label: 'Stock actual', align: 'left' as const },
  { key: 'minStockQty', label: 'Mínimo', align: 'left' as const },
  { key: 'value', label: 'Valor stock', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
]

const filterOptions = [
  { value: 'false', label: 'Todos los materiales' },
  { value: 'true', label: 'Solo bajo mínimo' },
]

function stockValue(r: ProduccionMaterial) {
  return r.currentStock * r.unitCost
}

function goMovements(materialId: string) {
  void router.push({ name: 'produccion-inventario-movimientos', query: { materialId } })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1100px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Stock</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Niveles de inventario y alertas por stock mínimo.
        </p>
      </div>
      <BaseButton variant="secondary" @click="goMovements('')">
        <AppIcon icon="lucide:arrow-left-right" :size="18" class="mr-1.5" />
        Ver movimientos
      </BaseButton>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard title="Materiales" :value="String(stats?.totalMaterials ?? 0)" />
      <StatsCard title="Activos" :value="String(stats?.activeMaterials ?? 0)" />
      <StatsCard
        title="Bajo mínimo"
        :value="String(stats?.lowStockCount ?? 0)"
        :class="(stats?.lowStockCount ?? 0) > 0 ? 'ring-1 ring-amber-400/50' : ''"
      />
      <StatsCard title="Valor inventario" :value="formatSol(stats?.totalStockValue)" />
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin datos de stock." row-key="id">
        <template #toolbar>
          <div class="flex flex-wrap gap-3">
            <SearchInput v-model="searchInput" placeholder="Buscar…" class="max-w-xs" />
            <FormSelect
              :model-value="String(lowStockOnly)"
              :options="filterOptions"
              class="max-w-[220px]"
              @update:model-value="(v: string) => { lowStockOnly = v === 'true' }"
            />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4 font-mono text-sm">{{ (row as ProduccionMaterial).code }}</td>
          <td class="py-3 px-4 font-medium">{{ (row as ProduccionMaterial).name }}</td>
          <td class="py-3 px-4 text-sm font-semibold">
            {{ formatQty((row as ProduccionMaterial).currentStock, (row as ProduccionMaterial).unit) }}
          </td>
          <td class="py-3 px-4 text-sm">{{ formatQty((row as ProduccionMaterial).minStockQty, (row as ProduccionMaterial).unit) }}</td>
          <td class="py-3 px-4 text-sm">{{ formatSol(stockValue(row as ProduccionMaterial)) }}</td>
          <td class="py-3 px-4">
            <span
              v-if="(row as ProduccionMaterial).isLowStock"
              class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
              :style="{ background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)' }"
            >
              <AppIcon icon="lucide:alert-triangle" :size="12" />
              Bajo mínimo
            </span>
            <span v-else class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">OK</span>
          </td>
        </template>
      </DataTable>
    </div>
  </div>
</template>
