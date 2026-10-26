<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { useProduccionWorkOrdersList } from '../composables/useProduccionWorkOrders'
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
  <div class="space-y-6">
    <PageHeader
      :title="title"
      :subtitle="subtitle ? subtitle : undefined"
    >
      <template #actions>
        <BaseButton v-if="showNewButton" @click="goNew" size="sm" icon="lucide:plus">Nueva OT</BaseButton>
      </template>
    </PageHeader>

    <BaseCard padding="none" class="block overflow-hidden">
      <DataTable :columns="columns" :data="rows" :loading="isLoading" empty-text="Sin órdenes de trabajo." row-key="id">
        <template #toolbar>
          <div class="flex-1 min-w-0">
            <SearchInput v-model="searchInput" placeholder="Buscar OT, cliente o mueble…" />
          </div>
        </template>
        <template #row="{ row }">
          <td class="py-3 px-4">
            <BaseButton @click="goDetail(row as ProduccionWorkOrderListItem)" variant="link" class="font-mono font-medium">{{ (row as ProduccionWorkOrderListItem).code }}</BaseButton>
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
    </BaseCard>
  </div>
</template>
