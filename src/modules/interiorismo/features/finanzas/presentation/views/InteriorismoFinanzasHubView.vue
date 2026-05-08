<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, BasePagination, DataTable, SearchInput, Badge, AppIcon } from '@shared/components'
import { useInteriorProjectsList } from '@modules/interiorismo/features/proyectos/application/useInteriorProjects'
import type { InteriorProjectListItem, ListInteriorProjectsParams } from '@modules/interiorismo/features/proyectos/domain/project.types'
import { PROJECT_STATUS_LABELS } from '@modules/interiorismo/features/proyectos/presentation/labels'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'

const router = useRouter()
const ITEMS = 12

const listParams = ref<ListInteriorProjectsParams>({
  page: 1,
  limit: ITEMS,
  inProgressOnly: true,
})
const searchInput = ref('')

watch(
  searchInput,
  () => {
    listParams.value = {
      ...listParams.value,
      page: 1,
      search: searchInput.value.trim() || undefined,
    }
  },
  { immediate: true },
)

const { data: result, isLoading } = useInteriorProjectsList(listParams)

const rows = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)

const onPage = (p: number) => {
  listParams.value = { ...listParams.value, page: p }
}
const onSize = (s: number) => {
  listParams.value = { ...listParams.value, limit: s, page: 1 }
}

const columns = [
  { key: 'code', label: 'Código', align: 'left' as const, sortable: true },
  { key: 'name', label: 'Proyecto', align: 'left' as const, sortable: true },
  { key: 'client', label: 'Cliente', align: 'left' as const },
  { key: 'progressPct', label: 'Avance', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
]

const paginationProps = computed(() => {
  const page = listParams.value.page ?? 1
  const limit = listParams.value.limit ?? ITEMS
  const totalPages = Math.max(1, Math.ceil(total.value / limit))
  return {
    currentPage: page,
    totalPages,
    totalItems: total.value,
    pageSize: limit,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  }
})

const openBoard = (p: InteriorProjectListItem) => {
  router.push(`${INTERIORISMO_BASE_PATH}/finanzas/${p.id}`)
}

const goProjects = () => router.push(`${INTERIORISMO_BASE_PATH}/proyectos`)
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1400px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Finanzas</h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Ingresos, adelantos, cuotas, pagos del cliente, egresos de obra (desde ejecución), flujo de caja y rentabilidad vs presupuesto.
        </p>
      </div>
      <BaseButton variant="outline" type="button" @click="goProjects">
        <AppIcon icon="lucide:folder-kanban" :size="18" class="mr-1.5" />
        Ver todos los proyectos
      </BaseButton>
    </div>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <div v-if="isLoading" class="flex justify-center py-16">
        <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
      </div>
      <template v-else>
        <DataTable
          empty-text="No hay proyectos en curso. Avance un proyecto o consulte el listado general."
          :columns="columns"
          :data="rows"
          row-key="id"
        >
          <template #toolbar>
            <div class="flex-1 min-w-0">
              <SearchInput v-model="searchInput" placeholder="Buscar por código o nombre…" />
            </div>
          </template>
          <template #row="{ row }">
            <td class="py-3 px-4">
              <button
                type="button"
                class="font-medium hover:underline"
                :style="{ color: 'var(--color-primary)' }"
                @click="openBoard(row as InteriorProjectListItem)"
              >
                {{ (row as InteriorProjectListItem).code }}
              </button>
            </td>
            <td class="py-3 px-4">
              <button type="button" class="text-left font-medium" @click="openBoard(row as InteriorProjectListItem)">
                <span :style="{ color: 'var(--color-text-primary)' }">{{ (row as InteriorProjectListItem).name }}</span>
              </button>
            </td>
            <td class="py-3 px-4 text-sm" :style="{ color: 'var(--color-text-secondary)' }">
              {{ (row as InteriorProjectListItem).client.fullName }}
            </td>
            <td class="py-3 px-4 text-sm">{{ Math.round((row as InteriorProjectListItem).progressPct) }}%</td>
            <td class="py-3 px-4">
              <Badge variant="neutral">{{ PROJECT_STATUS_LABELS[(row as InteriorProjectListItem).status] }}</Badge>
            </td>
          </template>
        </DataTable>
        <div class="border-t" :style="{ borderColor: 'var(--color-border)' }">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="onPage"
            @update:page-size="onSize"
          />
        </div>
      </template>
    </div>
  </div>
</template>
