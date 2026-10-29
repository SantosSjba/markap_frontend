<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin, filterActions } = useApplicationAccess('interiorismo')

import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import { useService } from '@shared/presentation/di/services'
import { useDebouncedRef } from '@shared/presentation/composables/useDebouncedRef'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { fetchAllPages } from '@shared/utils/fetchAllPages'
import { toCalendarDateString } from '@shared/utils/formatters'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import { interiorTeamRepositoryKey } from '../../application/ports/team.port'
import { TEAM_ROLES, type ListTeamParams, type TeamMember, type TeamRole } from '../../domain/team.types'
import { TEAM_MEMBER_TYPE_LABELS, TEAM_ROLE_LABELS } from '../labels'
import {
  useDeleteInteriorTeamMember,
  useInteriorTeamList,
  useUpdateInteriorTeamMember,
} from '../composables/useTeam'
/**
 * Equipo de Interiorismo: responsables que se asignan en los proyectos.
 * Registro informativo; los integrantes no tienen acceso al sistema.
 */

const router = useRouter()
const teamRepository = useService(interiorTeamRepositoryKey)
const ITEMS_PER_PAGE = 10

const listParams = ref<ListTeamParams>({ page: 1, limit: ITEMS_PER_PAGE })
const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput)
const filterRole = ref<'ALL' | TeamRole>('ALL')
const filterStatus = ref<'ALL' | 'active' | 'inactive'>('ALL')

const currentFilters = () => ({
  search: searchInput.value.trim() || undefined,
  role: filterRole.value === 'ALL' ? undefined : filterRole.value,
  isActive: filterStatus.value === 'ALL' ? undefined : filterStatus.value === 'active',
})

watch(
  [debouncedSearch, filterRole, filterStatus],
  () => {
    listParams.value = { ...listParams.value, page: 1, ...currentFilters(), search: debouncedSearch.value.trim() || undefined }
  },
  { immediate: true },
)

const { data: listResult, isFetching, isError, error, refetch } = useInteriorTeamList(listParams)
const members = computed(() => listResult.value?.data ?? [])
const total = computed(() => listResult.value?.total ?? 0)

const onPageChange = (page: number) => {
  listParams.value = { ...listParams.value, page }
}
const onPageSizeChange = (size: number) => {
  listParams.value = { ...listParams.value, limit: size, page: 1 }
}

const paginationProps = computed(() => {
  const page = listParams.value.page ?? 1
  const limit = listParams.value.limit ?? ITEMS_PER_PAGE
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

const roleOptions = [
  { value: 'ALL', label: 'Todas las funciones' },
  ...TEAM_ROLES.map((r) => ({ value: r, label: TEAM_ROLE_LABELS[r] })),
]
const statusOptions = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const goToNew = () => router.push(`${INTERIORISMO_BASE_PATH}/equipo/nuevo`)
const goToEdit = (m: TeamMember) => router.push(`${INTERIORISMO_BASE_PATH}/equipo/${m.id}/editar`)

// ── Confirmaciones ──
type ConfirmType = 'deactivate' | 'activate' | 'delete'
const CONFIRM_COPY: Record<ConfirmType, { title: string; action: string; icon: string; text: string }> = {
  deactivate: {
    title: 'Desactivar integrante',
    action: 'Desactivar',
    icon: 'lucide:user-x',
    text: 'Dejará de ofrecerse al asignar responsables; los proyectos actuales lo conservan.',
  },
  activate: {
    title: 'Reactivar integrante',
    action: 'Reactivar',
    icon: 'lucide:user-check',
    text: 'Volverá a estar disponible para asignarse en los proyectos.',
  },
  delete: {
    title: 'Eliminar integrante',
    action: 'Eliminar',
    icon: 'lucide:trash-2',
    text: 'Se ocultará del equipo; los proyectos donde figura conservan la referencia.',
  },
}
const showConfirm = ref(false)
const confirmState = ref<{ type: ConfirmType; member: TeamMember } | null>(null)
const confirmCopy = computed(() => (confirmState.value ? CONFIRM_COPY[confirmState.value.type] : null))

const updateMutation = useUpdateInteriorTeamMember()
const deleteMutation = useDeleteInteriorTeamMember()
const confirmPending = computed(() => updateMutation.isPending.value || deleteMutation.isPending.value)

function openConfirm(type: ConfirmType, member: TeamMember) {
  confirmState.value = { type, member }
  showConfirm.value = true
}

async function executeConfirm() {
  if (!confirmState.value) return
  const { type, member } = confirmState.value
  showConfirm.value = false
  try {
    if (type === 'delete') await deleteMutation.mutateAsync(member.id)
    else await updateMutation.mutateAsync({ id: member.id, data: { isActive: type === 'activate' } })
  } catch {
    /* onError en composables */
  }
}

const getActions = (m: TeamMember) => [
  { label: 'Editar', icon: 'lucide:pencil', onClick: () => goToEdit(m) },
  m.isActive
    ? { label: 'Desactivar', icon: 'lucide:user-x', onClick: () => openConfirm('deactivate', m) }
    : { label: 'Reactivar', icon: 'lucide:user-check', onClick: () => openConfirm('activate', m) },
  { label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => openConfirm('delete', m) },
]

const tableColumns = [
  {
    key: 'integrante',
    label: 'Integrante',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as TeamMember).fullName,
  },
  { key: 'funciones', label: 'Funciones', align: 'left' as const },
  {
    key: 'vinculo',
    label: 'Vínculo',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => (r as TeamMember).type,
  },
  { key: 'contacto', label: 'Contacto', align: 'left' as const },
  {
    key: 'estado',
    label: 'Estado',
    align: 'left' as const,
    sortable: true,
    sortAccessor: (r: unknown) => ((r as TeamMember).isActive ? 1 : 0),
  },
  { key: 'actions', label: '', align: 'right' as const },
]

const { isExporting, exportToExcel } = useExcelExport()

async function handleExport() {
  const rows = await fetchAllPages((page, limit) => teamRepository.list({ page, limit, ...currentFilters() }))
  await exportToExcel({
    fileName: `equipo_interiorismo_${toCalendarDateString()}`,
    sheetName: 'Equipo',
    columns: [
      { header: 'Nombre', key: 'fullName', width: 28 },
      { header: 'Funciones', key: 'roles', width: 40 },
      { header: 'Vínculo', key: 'type', width: 20 },
      { header: 'Tipo doc.', key: 'documentTypeCode', width: 12 },
      { header: 'N° documento', key: 'documentNumber', width: 16 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Teléfono', key: 'phone', width: 16 },
      { header: 'Estado', key: 'isActive', width: 10 },
    ],
    rows: rows.map((m) => ({
      fullName: m.fullName,
      roles: m.roles.map((r) => TEAM_ROLE_LABELS[r]).join(', ') || '—',
      type: TEAM_MEMBER_TYPE_LABELS[m.type],
      documentTypeCode: m.documentType?.code ?? '—',
      documentNumber: m.documentNumber ?? '—',
      email: m.email ?? '—',
      phone: m.phone ?? '—',
      isActive: m.isActive ? 'Activo' : 'Inactivo',
    })),
  })
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Equipo"
      subtitle="Responsables que se asignan en los proyectos (sin acceso al sistema)"
      :help-items="[
        { icon: 'lucide:id-card', term: 'Registro informativo', text: 'Los integrantes no tienen usuario ni acceso al sistema; solo figuran como responsables.' },
        { icon: 'lucide:briefcase', term: 'Funciones', text: 'Diseño, arquitectura (senior o junior), obra y comercial: cada puesto del proyecto lista a quien tiene esa función.' },
        { icon: 'lucide:user-x', term: 'Desactivar', text: 'Deja de ofrecerse en proyectos nuevos; los actuales lo conservan.' },
        { icon: 'lucide:calendar', term: 'Calendario', text: 'El filtro por persona muestra lo de los proyectos donde integra el equipo.' },
      ]"
    >
      <template #actions>
        <div class="flex w-full gap-2 sm:w-auto">
          <BaseButton
            variant="outline"
            class="flex flex-1 items-center justify-center gap-2 sm:flex-none"
            :loading="isExporting"
            title="Exportar a Excel"
            @click="handleExport"
          >
            <ExcelIcon class="h-5 w-5" />
            Exportar
          </BaseButton>
          <BaseButton
            v-if="canWrite"
            variant="primary"
            class="flex flex-1 items-center justify-center gap-2 sm:flex-none"
            @click="goToNew"
          >
            <AppIcon icon="lucide:plus" :size="18" />
            Nuevo integrante
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <BaseCard padding="none" class="block overflow-hidden">
      <div class="overflow-x-auto">
        <div v-if="isError" class="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
          <p class="text-sm font-medium text-error-500 dark:text-error-400">{{ getApiErrorMessage(error) }}</p>
          <BaseButton variant="outline" size="sm" @click="() => refetch()">Reintentar</BaseButton>
        </div>
        <template v-else>
          <DataTable
            empty-text="Aún no hay integrantes en el equipo."
            :columns="tableColumns"
            :data="members"
            row-key="id"
            :loading="isFetching"
          >
            <template #toolbar>
              <div class="min-w-0 flex-1">
                <SearchInput v-model="searchInput" placeholder="Buscar por nombre, email o teléfono..." />
              </div>
              <div class="flex shrink-0 flex-wrap gap-3 sm:flex-nowrap">
                <div class="w-full min-w-0 sm:w-[200px]">
                  <FormSelect v-model="filterRole" :options="roleOptions" placeholder="Todas las funciones" />
                </div>
                <div class="w-full min-w-0 sm:w-[175px]">
                  <FormSelect v-model="filterStatus" :options="statusOptions" placeholder="Todos los estados" />
                </div>
              </div>
            </template>
            <template #row="{ row }">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    :class="(row as TeamMember).isActive ? 'bg-brand-500/10' : 'bg-gray-50 dark:bg-gray-800'"
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  >
                    <AppIcon
                      icon="lucide:hard-hat"
                      :size="16"
                      :color="(row as TeamMember).isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'"
                    />
                  </div>
                  <div>
                    <p class="font-medium text-gray-800 dark:text-white/90">{{ (row as TeamMember).fullName }}</p>
                    <p v-if="(row as TeamMember).documentType" class="text-xs text-gray-400 dark:text-gray-500">
                      {{ (row as TeamMember).documentType?.code }}: {{ (row as TeamMember).documentNumber ?? '–' }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <div class="flex max-w-xs flex-wrap gap-1">
                  <Badge v-for="role in (row as TeamMember).roles" :key="role" variant="info">
                    {{ TEAM_ROLE_LABELS[role] }}
                  </Badge>
                  <span v-if="!(row as TeamMember).roles.length" class="text-sm text-warning-600 dark:text-warning-500">
                    Sin funciones
                  </span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {{ TEAM_MEMBER_TYPE_LABELS[(row as TeamMember).type] }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                <div class="flex flex-col gap-0.5">
                  <span v-if="(row as TeamMember).phone" class="flex items-center gap-1.5">
                    <AppIcon icon="lucide:phone" :size="12" color="var(--color-text-muted)" />
                    {{ (row as TeamMember).phone }}
                  </span>
                  <span v-if="(row as TeamMember).email" class="flex items-center gap-1.5">
                    <AppIcon icon="lucide:mail" :size="12" color="var(--color-text-muted)" />
                    {{ (row as TeamMember).email }}
                  </span>
                  <span v-if="!(row as TeamMember).phone && !(row as TeamMember).email">–</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <Badge :variant="(row as TeamMember).isActive ? 'success' : 'error'">
                  {{ (row as TeamMember).isActive ? 'Activo' : 'Inactivo' }}
                </Badge>
              </td>
              <td class="px-4 py-3 text-right">
                <ActionsDropdown :items="filterActions(getActions(row as TeamMember))" />
              </td>
            </template>
          </DataTable>
          <div class="border-t border-gray-200 dark:border-gray-800">
            <BasePagination
              v-bind="paginationProps"
              :show-page-size="true"
              @update:current-page="onPageChange"
              @update:page-size="onPageSizeChange"
            />
          </div>
        </template>
      </div>
    </BaseCard>

    <BaseModal v-model="showConfirm" size="sm">
      <template #title>
        <div class="flex items-center gap-2">
          <AppIcon v-if="confirmCopy" :icon="confirmCopy.icon" :size="17" />
          <span>{{ confirmCopy?.title }}</span>
        </div>
      </template>
      <div v-if="confirmState && confirmCopy">
        <p class="mb-1 font-semibold text-gray-800 dark:text-white/90">{{ confirmState.member.fullName }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ confirmCopy.text }}</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="showConfirm = false">Cancelar</BaseButton>
          <BaseButton
            v-if="confirmState?.type === 'delete' ? canAdmin : canWrite"
            :variant="confirmState?.type === 'delete' ? 'danger' : 'primary'"
            :loading="confirmPending"
            @click="executeConfirm"
          >
            {{ confirmCopy?.action }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
