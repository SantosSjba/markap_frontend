<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { DataTable, SearchInput, AppIcon } from '@shared/components'
import { useProduccionWorkOrdersList } from '../../application/useProduccionWorkOrders'
import { WO_STATUS_LABELS, WO_PRIORITY_LABELS, woStatusClass, priorityClass } from '../labels'
import type { ProduccionWorkOrderListItem } from '../../domain/work-orders.types'

const props = defineProps<{
  status?: ProduccionWorkOrderListItem['status']
  stageKey?: string
  title: string
  subtitle?: string
  showNewButton?: boolean
}>()

const router = useRouter()
const searchInput = ref('')

const listParams = computed(() => ({
  page: 1,
  limit: 50,
  search: searchInput.value.trim() || undefined,
  status: props.status,
  stageKey: props.stageKey,
}))

const { data: result, isLoading } = useProduccionWorkOrdersList(listParams)
const rows = computed(() => result.value?.data ?? [])

const columns = [
  { key: 'code', label: 'OT', align: 'left' as const },
  { key: 'furniture', label: 'Mueble(s)', align: 'left' as const },
  { key: 'client', label: 'Cliente', align: 'left' as const },
  { key: 'stage', label: 'Etapa', align: 'left' as const },
  { key: 'progress', label: 'Avance', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
]

function goDetail(r: ProduccionWorkOrderListItem) {
  void router.push({ name: 'produccion-ot-detalle', params: { id: r.id } })
}

function goNew() {
  void router.push({ name: 'produccion-ot-nueva' })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">{{ subtitle }}</p>
      </div>
      <button
        v-if="showNewButton"
        type="button"
        class="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white"
        :style="{ background: 'var(--color-primary)' }"
        @click="goNew"
      >
        <AppIcon icon="lucide:plus" :size="18" class="mr-1.5" />
        Nueva OT
      </button>
    </div>

    <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin órdenes de trabajo." row-key="id">
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar OT, cliente o mueble…" />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4">
            <button type="button" class="font-mono text-sm font-medium hover:underline" :style="{ color: 'var(--color-primary)' }" @click="goDetail(row as ProduccionWorkOrderListItem)">
              {{ (row as ProduccionWorkOrderListItem).code }}
            </button>
            <div class="text-xs" :class="priorityClass((row as ProduccionWorkOrderListItem).priority)">
              {{ WO_PRIORITY_LABELS[(row as ProduccionWorkOrderListItem).priority] }}
            </div>
          </td>
          <td class="py-3 px-4 text-sm truncate max-w-[180px]">{{ (row as ProduccionWorkOrderListItem).furnitureSummary }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionWorkOrderListItem).clientName ?? '—' }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionWorkOrderListItem).currentStageLabel ?? '—' }}</td>
          <td class="py-3 px-4 text-sm">{{ (row as ProduccionWorkOrderListItem).progressPercent }}%</td>
          <td class="py-3 px-4 text-sm font-medium" :class="woStatusClass((row as ProduccionWorkOrderListItem).status)">
            {{ WO_STATUS_LABELS[(row as ProduccionWorkOrderListItem).status] }}
          </td>
        </template>
      </DataTable>
    </div>
  </div>
</template>
