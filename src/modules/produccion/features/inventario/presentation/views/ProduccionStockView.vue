<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import {
  useProduccionMaterialsList,
  useProduccionInventoryStats,
} from '../composables/useProduccionInventory'
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
  <div class="space-y-6">
    <PageHeader
      title="Stock"
      subtitle="Niveles de inventario y alertas por stock mínimo."
    >
      <template #actions>
        <BaseButton variant="secondary" @click="goMovements('')">
        <AppIcon icon="lucide:arrow-left-right" :size="18" class="mr-1.5" />
        Ver movimientos
      </BaseButton>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard title="Materiales" :value="String(stats?.totalMaterials ?? 0)" />
      <StatsCard title="Activos" :value="String(stats?.activeMaterials ?? 0)" />
      <StatsCard
        title="Bajo mínimo"
        :value="String(stats?.lowStockCount ?? 0)"
        :class="(stats?.lowStockCount ?? 0) > 0 ? 'ring-1 ring-warning-400/50' : ''"
      />
      <StatsCard title="Valor inventario" :value="formatSol(stats?.totalStockValue)" />
    </div>

    <BaseCard padding="none" class="block overflow-hidden">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin datos de stock." row-key="id">
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar…" />
          </div>
          <div class="w-full sm:w-[220px] min-w-0 shrink-0">
            <FormSelect
              :model-value="String(lowStockOnly)"
              :options="filterOptions"
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
            <Badge v-if="(row as ProduccionMaterial).isLowStock" variant="warning"><AppIcon icon="lucide:alert-triangle" :size="12" /> Bajo mínimo</Badge>
            <span v-else class="text-xs text-gray-500 dark:text-gray-400">OK</span>
          </td>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
