<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, filterActions } = useApplicationAccess('alquileres')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { commissionsRepositoryKey } from '../../application/ports/commissions.port'
import { useService } from '@shared/presentation/di/services'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseAlert from '@shared/presentation/components/ui/BaseAlert.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatShortDate, parseCalendarDate, toCalendarDateString } from '@shared/utils/formatters'
import { useCurrencyCatalog } from '@shared/presentation/composables/useCurrencyCatalog'
import { useCommissions, useUpdateCommission } from '../composables/useCommissions'
import type {
  CommissionStatus,
  ListCommissionsParams,
  RentalCommissionItem,
} from '../../domain/commission.types'
const commissionsRepository = useService(commissionsRepositoryKey)

const router = useRouter()
const { format: formatAmount } = useCurrencyCatalog()

const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const statusFilter = ref<'ALL' | CommissionStatus>('PENDING')
const currentPage = ref(1)
const pageSize = ref(10)

const filterParams = computed<ListCommissionsParams>(() => ({
  search: debouncedSearch.value.trim() || undefined,
  status: statusFilter.value === 'ALL' ? undefined : statusFilter.value,
}))
const params = computed<ListCommissionsParams>(() => ({
  ...filterParams.value,
  page: currentPage.value,
  limit: pageSize.value,
}))
// Un filtro nuevo vuelve a la primera página
watch(filterParams, () => {
  currentPage.value = 1
})

const {
  data: result,
  isFetching,
  isError: listQueryError,
  error: listFetchError,
  refetch: refetchList,
} = useCommissions(params)

const commissions = computed(() => result.value?.items ?? [])
const totalsByCurrency = computed(() => result.value?.totalsByCurrency ?? [])
const totalItems = computed(() => result.value?.total ?? 0)
const paginationProps = computed(() => {
  const totalPages = Math.max(1, Math.ceil(totalItems.value / pageSize.value))
  return {
    currentPage: currentPage.value,
    totalPages,
    totalItems: totalItems.value,
    pageSize: pageSize.value,
    hasPrevPage: currentPage.value > 1,
    hasNextPage: currentPage.value < totalPages,
  }
})
function onPageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
}

const statusOptions = [
  { value: 'PENDING', label: 'Pendientes de pago' },
  { value: 'PAID', label: 'Pagadas' },
  { value: 'ALL', label: 'Todas' },
]

function formatDate(value: string | null): string {
  return value ? formatShortDate(value) : '—'
}

function statusLabel(item: RentalCommissionItem): string {
  if (item.status === 'PAID') return 'Pagada'
  return item.isOverdue ? 'Pendiente (vencida)' : 'Pendiente'
}

function statusVariant(item: RentalCommissionItem): 'success' | 'warning' | 'error' {
  if (item.status === 'PAID') return 'success'
  return item.isOverdue ? 'error' : 'warning'
}

const tableColumns = [
  {
    key: 'alquiler',
    label: 'Alquiler',
    sortable: true,
    sortAccessor: (r: unknown) => (r as RentalCommissionItem).rentalCode,
  },
  {
    key: 'partes',
    label: 'Partes',
    sortable: true,
    sortAccessor: (r: unknown) => (r as RentalCommissionItem).ownerName,
  },
  {
    key: 'monto',
    label: 'Comisión',
    align: 'right' as const,
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => (r as RentalCommissionItem).amount,
  },
  {
    key: 'estimada',
    label: 'Fecha estimada',
    sortable: true,
    sortType: 'basic' as const,
    sortAccessor: (r: unknown) => {
      const d = (r as RentalCommissionItem).dueDate
      return d ? parseCalendarDate(d).getTime() : Number.MAX_SAFE_INTEGER
    },
  },
  {
    key: 'estado',
    label: 'Estado',
    sortable: true,
    sortAccessor: (r: unknown) => (r as RentalCommissionItem).status,
  },
  { key: 'actions', label: '', align: 'right' as const },
]

// ── Modal: registrar cobro o cambiar fecha estimada ──
type ModalMode = 'pay' | 'due'
const showModal = ref(false)
const modalMode = ref<ModalMode>('pay')
const selected = ref<RentalCommissionItem | null>(null)
const modalDate = ref('')
const modalError = ref('')
const { mutateAsync: updateCommission, isPending: updating } = useUpdateCommission()

function openModal(item: RentalCommissionItem, mode: ModalMode) {
  selected.value = item
  modalMode.value = mode
  modalDate.value =
    mode === 'pay' ? (item.paidDate ?? toCalendarDateString()) : (item.dueDate ?? '')
  modalError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selected.value = null
}

async function submitModal() {
  if (!selected.value) return
  if (modalMode.value === 'pay' && !modalDate.value) {
    modalError.value = 'Indica la fecha en que se cobró la comisión.'
    return
  }
  try {
    await updateCommission({
      rentalId: selected.value.rentalId,
      data:
        modalMode.value === 'pay'
          ? { status: 'PAID', paidDate: modalDate.value }
          : { dueDate: modalDate.value || null },
    })
    closeModal()
  } catch (err) {
    modalError.value = getApiErrorMessage(err)
  }
}

async function revertToPending(item: RentalCommissionItem) {
  const ok = await markapAlert.confirm({
    title: 'Volver a pendiente',
    text: `La comisión de ${item.rentalCode} dejará de contar como cobrada el ${formatDate(item.paidDate)}.`,
    confirmText: 'Sí, volver a pendiente',
    icon: 'warning',
  })
  if (!ok) return
  await updateCommission({ rentalId: item.rentalId, data: { status: 'PENDING' } }).catch(() => {
    /* useUpdateCommission onError muestra toast */
  })
}

function getActions(item: RentalCommissionItem) {
  const actions: { label: string; icon: string; onClick: () => void }[] = []
  if (item.status === 'PAID') {
    actions.push(
      {
        label: 'Corregir fecha de cobro',
        icon: 'lucide:calendar-check',
        onClick: () => openModal(item, 'pay'),
      },
      {
        label: 'Volver a pendiente',
        icon: 'lucide:rotate-ccw',
        onClick: () => void revertToPending(item),
      },
    )
  } else {
    actions.push({
      label: 'Cambiar fecha estimada',
      icon: 'lucide:calendar-clock',
      onClick: () => openModal(item, 'due'),
    })
  }
  actions.push(
    {
      label: 'Ver alquiler',
      icon: 'lucide:file-text',
      onClick: () => router.push({ name: 'alquileres-contratos-detalle', params: { id: item.rentalId } }),
    },
    {
      label: 'Ver distribución financiera',
      icon: 'lucide:sliders-horizontal',
      onClick: () =>
        router.push({
          name: 'alquileres-contratos-distribucion-financiera',
          params: { id: item.rentalId },
        }),
    },
  )
  return actions
}

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  const data = await commissionsRepository.list({ ...filterParams.value, page: 1, limit: 10000 })
  await exportToExcel({
    fileName: `comisiones_alquileres_${toCalendarDateString()}`,
    sheetName: 'Comisiones',
    columns: [
      { header: 'Código', key: 'rentalCode', width: 34 },
      { header: 'Propiedad', key: 'propertyAddress', width: 32 },
      { header: 'Propietario', key: 'ownerName', width: 24 },
      { header: 'Inquilino', key: 'tenantName', width: 24 },
      { header: 'Inicio contrato', key: 'contractStartDate', width: 16 },
      { header: 'Moneda', key: 'currency', width: 10 },
      { header: 'Comisión (ingreso)', key: 'amount', width: 18 },
      { header: 'Estado', key: 'status', width: 20 },
      { header: 'Fecha estimada', key: 'dueDate', width: 16 },
      { header: 'Fecha de cobro', key: 'paidDate', width: 16 },
    ],
    rows: data.items.map((c) => ({
      rentalCode: c.rentalCode,
      propertyAddress: c.propertyAddress,
      ownerName: c.ownerName,
      tenantName: c.tenantName,
      contractStartDate: formatDate(c.contractStartDate),
      currency: c.currency,
      amount: c.amount,
      status: statusLabel(c),
      dueDate: formatDate(c.dueDate),
      paidDate: formatDate(c.paidDate),
    })),
  })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Comisiones"
      subtitle="Seguimiento del cobro de la comisión (ingreso) de cada alquiler hasta que se pague"
      :help-items="[
        { icon: 'lucide:building-2', term: 'Qué es', text: 'Lo que cobra la empresa por intermediar el alquiler; se registra una sola vez por contrato.' },
        { icon: 'lucide:clock', term: 'Pendiente', text: 'Aún no se cobra; la fecha estimada sirve para el seguimiento.' },
        { icon: 'lucide:check', term: 'Cobrada', text: 'Su fecha de cobro define el mes en que aparece en Reportes.' },
        { icon: 'lucide:scale', term: 'Distribución', text: 'Gastos, impuestos y comisiones de agentes sobre ese ingreso se ven en la Distribución financiera del contrato.' },
      ]"
    >
      <template #actions>
        <BaseButton
          variant="outline"
          class="flex items-center gap-2"
          :loading="isExporting"
          title="Exportar a Excel"
          @click="handleExport"
        >
          <ExcelIcon class="w-5 h-5" />
          Exportar
        </BaseButton>
      </template>
    </PageHeader>

    <!-- Totales por moneda (sin sumar soles con dólares) -->
    <div v-if="totalsByCurrency.length" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <template v-for="t in totalsByCurrency" :key="t.currency">
        <StatsCard
          compact
          :title="`Pendiente de cobro · ${t.currency}`"
          :value="formatAmount(t.pendingAmount, t.currency)"
          :subtitle="`${t.pendingCount} ${t.pendingCount === 1 ? 'comisión' : 'comisiones'}`"
        >
          <template #icon><AppIcon icon="lucide:clock" :size="20" color="#d97706" /></template>
        </StatsCard>
        <StatsCard
          compact
          :title="`Cobrado · ${t.currency}`"
          :value="formatAmount(t.paidAmount, t.currency)"
          :subtitle="`${t.paidCount} ${t.paidCount === 1 ? 'comisión' : 'comisiones'}`"
        >
          <template #icon><AppIcon icon="lucide:circle-check" :size="20" color="#16a34a" /></template>
        </StatsCard>
      </template>
    </div>

    <BaseCard padding="none" class="block overflow-hidden">
      <div class="overflow-x-auto">
        <div
          v-if="listQueryError"
          class="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center"
        >
          <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(listFetchError) }}</p>
          <BaseButton variant="outline" size="sm" @click="() => refetchList()">Reintentar</BaseButton>
        </div>
        <DataTable
          v-else
          :columns="tableColumns"
          :data="commissions"
          row-key="rentalId"
          :loading="isFetching && !result"
          :empty-text="statusFilter === 'PENDING' ? 'No hay comisiones pendientes de pago.' : 'No hay comisiones para mostrar.'"
        >
          <template #toolbar>
            <div class="flex-1 min-w-0">
              <SearchInput v-model="searchInput" placeholder="Buscar por código, propiedad, propietario o inquilino..." />
            </div>
            <div class="w-full sm:w-[200px] min-w-0 shrink-0">
              <FormSelect v-model="statusFilter" :options="statusOptions" />
            </div>
          </template>
          <template #row="{ row }">
            <td class="py-3 px-4">
              <p class="font-medium text-gray-800 dark:text-white/90">{{ (row as RentalCommissionItem).rentalCode }}</p>
              <p class="text-sm mt-0.5 text-gray-500 dark:text-gray-400">{{ (row as RentalCommissionItem).propertyAddress }}</p>
              <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
                Inicio: {{ formatDate((row as RentalCommissionItem).contractStartDate) }}
              </p>
            </td>
            <td class="py-3 px-4 text-sm">
              <p class="text-gray-800 dark:text-white/90">{{ (row as RentalCommissionItem).ownerName }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Propietario</p>
              <p class="mt-1 text-gray-800 dark:text-white/90">{{ (row as RentalCommissionItem).tenantName }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Inquilino</p>
            </td>
            <td class="py-3 px-4 text-right">
              <span class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {{ formatAmount((row as RentalCommissionItem).amount, (row as RentalCommissionItem).currency) }}
              </span>
            </td>
            <td class="py-3 px-4 text-sm">
              <span
                :class="(row as RentalCommissionItem).isOverdue ? 'text-error-500 dark:text-error-400 font-medium' : 'text-gray-800 dark:text-white/90'"
              >
                {{ formatDate((row as RentalCommissionItem).dueDate) }}
              </span>
            </td>
            <td class="py-3 px-4">
              <Badge :variant="statusVariant(row as RentalCommissionItem)">
                {{ statusLabel(row as RentalCommissionItem) }}
              </Badge>
              <p v-if="(row as RentalCommissionItem).paidDate" class="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Cobrada el {{ formatDate((row as RentalCommissionItem).paidDate) }}
              </p>
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2 justify-end">
                <BaseButton
                  v-if="canWrite && (row as RentalCommissionItem).status === 'PENDING'"
                  size="sm"
                  icon="lucide:circle-check"
                  @click="openModal(row as RentalCommissionItem, 'pay')"
                >
                  Marcar pagada
                </BaseButton>
                <ActionsDropdown :items="filterActions(getActions(row as RentalCommissionItem))" />
              </div>
            </td>
          </template>
        </DataTable>
        <div v-if="!listQueryError" class="border-t border-gray-200 dark:border-gray-800">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="currentPage = $event"
            @update:page-size="onPageSizeChange"
          />
        </div>
      </div>
    </BaseCard>

    <BaseModal v-model="showModal" size="sm" @close="closeModal">
      <template #title>
        <div class="flex items-center gap-2">
          <AppIcon
            :icon="modalMode === 'pay' ? 'lucide:circle-check' : 'lucide:calendar-clock'"
            :size="18"
            color="var(--color-primary)"
          />
          <span>{{ modalMode === 'pay' ? 'Registrar cobro de la comisión' : 'Fecha estimada de cobro' }}</span>
        </div>
      </template>

      <form v-if="selected" id="comisiones-update" class="space-y-4" @submit.prevent="submitModal">
        <div
          class="flex items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800"
        >
          <div class="min-w-0">
            <p class="text-sm font-semibold truncate text-gray-800 dark:text-white/90">{{ selected.rentalCode }}</p>
            <p class="text-xs truncate text-gray-500 dark:text-gray-400">{{ selected.propertyAddress }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-xs text-gray-400 dark:text-gray-500">Comisión</p>
            <p class="text-lg font-bold text-gray-800 dark:text-white/90">
              {{ formatAmount(selected.amount, selected.currency) }}
            </p>
          </div>
        </div>
        <FormInput
          v-model="modalDate"
          type="date"
          :label="modalMode === 'pay' ? 'Fecha de cobro' : 'Fecha estimada'"
          :hint="modalMode === 'pay'
            ? 'El ingreso aparecerá en los reportes en el mes de esta fecha.'
            : 'Déjala vacía si aún no hay una fecha acordada.'"
          :required="modalMode === 'pay'"
        />
        <p class="text-xs text-gray-500 dark:text-gray-400">
          El monto sale del ingreso de la distribución financiera del alquiler.
        </p>
        <BaseAlert v-if="modalError" type="error">{{ modalError }}</BaseAlert>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="closeModal">Cancelar</BaseButton>
          <BaseButton variant="primary" type="submit" form="comisiones-update" :loading="updating" :disabled="updating">
            {{ modalMode === 'pay' ? 'Confirmar cobro' : 'Guardar fecha' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
