<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin, filterActions } = useApplicationAccess('interiorismo')

import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatShortDate } from '@shared/utils/formatters'
import { splitCurrencyTotals } from '@shared/utils/money'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import {
  useDeleteInteriorMaterialSupplier,
  useInteriorMaterialSupplierStats,
  useInteriorMaterialSuppliersList,
} from '../composables/useInteriorMaterialSuppliers'
import type { InteriorSupplierListItem, ListInteriorMaterialSuppliersParams } from '../../domain/suppliers.types'
/** Proveedores: indicadores, una fila por proveedor con materiales, partidas en proyectos y última compra. */

const router = useRouter()
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const page = ref(1)
const pageSize = ref(10)
watch(debouncedSearch, () => (page.value = 1))

const params = computed<ListInteriorMaterialSuppliersParams>(() => ({
  page: page.value,
  limit: pageSize.value,
  search: debouncedSearch.value.trim() || undefined,
}))
const { data: result, isLoading, isFetching, isError, error, refetch } = useInteriorMaterialSuppliersList(params)
const rows = computed(() => result.value?.data ?? [])
const total = computed(() => result.value?.total ?? 0)

const statsQuery = useInteriorMaterialSupplierStats()
const stats = computed(() => statsQuery.data.value)
const purchased = computed(() => splitCurrencyTotals(stats.value?.purchasedThisMonth ?? [], true))

const columns = [
  { key: 'supplier', label: 'Proveedor', align: 'left' as const },
  { key: 'contact', label: 'Contacto', align: 'left' as const },
  { key: 'materials', label: 'Materiales', align: 'left' as const },
  { key: 'projects', label: 'En proyectos', align: 'left' as const },
  { key: 'last', label: 'Última compra', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]
const asRow = (r: unknown) => r as InteriorSupplierListItem
const paginationProps = computed(() => {
  const totalPages = Math.max(1, Math.ceil(total.value / pageSize.value))
  return { currentPage: page.value, totalPages, totalItems: total.value, pageSize: pageSize.value, hasPrevPage: page.value > 1, hasNextPage: page.value < totalPages }
})

const base = `${INTERIORISMO_BASE_PATH}/materiales/proveedores`
const goDetail = (s: InteriorSupplierListItem) => router.push(`${base}/${s.id}`)
const deleteMut = useDeleteInteriorMaterialSupplier()
async function remove(s: InteriorSupplierListItem) {
  const ok = await markapAlert.confirmDanger({ title: 'Eliminar proveedor', text: `«${s.companyName}» y su historial de compras se eliminarán.`, confirmText: 'Eliminar' })
  if (ok) await deleteMut.mutateAsync(s.id).catch(() => undefined)
}
const actionsFor = (s: InteriorSupplierListItem) => {
  const items: { label: string; icon: string; onClick: () => void }[] = [
    { label: 'Ver ficha', icon: 'lucide:eye', onClick: () => goDetail(s) },
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => router.push(`${base}/${s.id}/editar`) },
  ]
  if (canAdmin.value) items.push({ label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => void remove(s) })
  return items
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Proveedores" subtitle="Quién surte cada material y qué se les compró en los proyectos">
      <template #actions>
        <BaseButton v-if="canWrite" variant="primary" icon="lucide:plus" class="w-full justify-center sm:w-auto" @click="router.push(`${base}/nuevo`)">Nuevo proveedor</BaseButton>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatsCard compact title="Proveedores" :value="String(stats?.total ?? 0)" subtitle="registrados" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:truck" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard compact title="Con materiales" :value="String(stats?.withMaterials ?? 0)" subtitle="del catálogo" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:layers" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard compact title="En proyectos" :value="String(stats?.withProjects ?? 0)" subtitle="con partidas asignadas" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:folder-kanban" :size="20" color="#16a34a" /></template>
      </StatsCard>
      <StatsCard compact title="Comprado este mes" :value="purchased.main" :subtitle="purchased.rest || 'compras de catálogo'" :loading="statsQuery.isPending.value">
        <template #icon><AppIcon icon="lucide:shopping-cart" :size="20" color="#ca8a04" /></template>
      </StatsCard>
    </div>

    <BaseCard padding="none" class="block overflow-hidden">
      <div v-if="isError" class="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <p class="text-sm font-medium text-error-500">{{ getApiErrorMessage(error) }}</p>
        <BaseButton variant="outline" size="sm" @click="() => refetch()">Reintentar</BaseButton>
      </div>
      <template v-else>
        <DataTable :columns="columns" :data="rows" row-key="id" :loading="isLoading || isFetching" empty-text="No hay proveedores con esa búsqueda.">
          <template #toolbar>
            <div class="min-w-0 flex-1"><SearchInput v-model="searchInput" placeholder="Buscar por razón social, RUC, contacto o email..." /></div>
          </template>
          <template #row="{ row }">
            <td class="px-4 py-3">
              <button type="button" class="flex items-center gap-3 text-left" @click="goDetail(asRow(row))">
                <Avatar :name="asRow(row).companyName" size="md" />
                <span>
                  <span class="block font-medium text-gray-800 hover:text-brand-500 dark:text-white/90">{{ asRow(row).companyName }}</span>
                  <span class="block text-xs text-gray-400">RUC {{ asRow(row).ruc }}</span>
                </span>
              </button>
            </td>
            <td class="px-4 py-3 text-sm">
              <span class="block text-gray-800 dark:text-white/90">{{ asRow(row).contactName ?? '—' }}</span>
              <span class="block text-xs text-gray-500">{{ [asRow(row).phone, asRow(row).email].filter(Boolean).join(' · ') }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-800 dark:text-white/90">{{ asRow(row).linkedMaterialsCount || '—' }}</td>
            <td class="px-4 py-3 text-sm text-gray-800 dark:text-white/90">{{ asRow(row).projectItemsCount ? `${asRow(row).projectItemsCount} partidas` : '—' }}</td>
            <td class="px-4 py-3 text-sm text-gray-500">{{ asRow(row).lastPurchaseAt ? formatShortDate(asRow(row).lastPurchaseAt!) : '—' }}</td>
            <td class="px-4 py-3 text-right"><ActionsDropdown :items="filterActions(actionsFor(asRow(row)))" /></td>
          </template>
        </DataTable>
        <div class="border-t border-gray-200 dark:border-gray-800">
          <BasePagination v-bind="paginationProps" :show-page-size="true" @update:current-page="(p: number) => (page = p)" @update:page-size="(s: number) => { pageSize = s; page = 1 }" />
        </div>
      </template>
    </BaseCard>
  </div>
</template>
