<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  BaseButton,
  AppIcon,
  BaseModal,
  FormInput,
  FormCheckbox,
  SearchInput,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useExcelExport } from '@/shared/composables/useExcelExport'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { useDebouncedRef } from '@/shared/composables/useDebouncedRef'
import {
  useContabilidadAccountsTree,
  useContabilidadCreateAccount,
  useContabilidadUpdateAccount,
  useContabilidadDeactivateAccount,
} from '../../application/useContabilidadAccounts'
import {
  CONTABILIDAD_ACCOUNT_TYPE_OPTIONS,
  type ContabilidadAccountDTO,
} from '../../domain/account.types'
import {
  buildVisibleAccountRows,
  collectExpandableIds,
  flattenAccountTree,
} from '../../domain/account-tree.utils'

const searchInput = ref('')
const debouncedSearch = useDebouncedRef(searchInput, 300)

const { data, isLoading, isError, error, refetch } = useContabilidadAccountsTree(debouncedSearch)
const loadError = computed(() => (isError.value ? getApiErrorMessage(error.value) : ''))

const expandedIds = ref<Set<string>>(new Set())
const searchActive = computed(() => Boolean(debouncedSearch.value.trim()))

watch(
  () => data.value?.tree,
  (tree) => {
    if (!tree?.length || expandedIds.value.size > 0) return
    const ids = collectExpandableIds(tree).slice(0, 3)
    expandedIds.value = new Set(ids)
  },
  { immediate: true },
)

const visibleRows = computed(() => {
  const tree = data.value?.tree ?? []
  return buildVisibleAccountRows(tree, expandedIds.value, searchActive.value)
})

const typeLabels = computed(() => data.value?.accountTypeLabels ?? {})

function toggleExpand(id: string) {
  const next = new Set(expandedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedIds.value = next
}

function expandAll() {
  const tree = data.value?.tree ?? []
  expandedIds.value = new Set(collectExpandableIds(tree))
}

function collapseAll() {
  expandedIds.value = new Set()
}

function typeLabel(type: string) {
  return typeLabels.value[type] ?? type
}

// Modal create / edit
const modalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingAccount = ref<ContabilidadAccountDTO | null>(null)
const parentAccount = ref<ContabilidadAccountDTO | null>(null)

const form = ref({
  code: '',
  name: '',
  accountType: 'ASSET',
  isMovement: false,
  sortOrder: 0,
})

const { mutate: createAccount, isPending: creating } = useContabilidadCreateAccount()
const { mutate: updateAccount, isPending: updating } = useContabilidadUpdateAccount()
const { mutate: deactivateAccount, isPending: deactivating } = useContabilidadDeactivateAccount()

function openCreate(parent: ContabilidadAccountDTO) {
  if (parent.isMovement) {
    void markapAlert.toast.warning('Solo puede agregar subcuentas bajo cuentas título')
    return
  }
  modalMode.value = 'create'
  editingAccount.value = null
  parentAccount.value = parent
  form.value = {
    code: parent.code,
    name: '',
    accountType: parent.accountType,
    isMovement: false,
    sortOrder: 0,
  }
  modalOpen.value = true
}

function openEdit(account: ContabilidadAccountDTO) {
  modalMode.value = 'edit'
  editingAccount.value = account
  parentAccount.value = null
  form.value = {
    code: account.code,
    name: account.name,
    accountType: account.accountType,
    isMovement: account.isMovement,
    sortOrder: account.sortOrder,
  }
  modalOpen.value = true
}

function submitForm() {
  if (!form.value.code.trim() || !form.value.name.trim()) {
    void markapAlert.toast.warning('Código y nombre son obligatorios')
    return
  }

  if (modalMode.value === 'create' && parentAccount.value) {
    createAccount(
      {
        parentId: parentAccount.value.id,
        code: form.value.code.trim(),
        name: form.value.name.trim(),
        accountType: form.value.accountType,
        isMovement: form.value.isMovement,
        sortOrder: form.value.sortOrder,
      },
      {
        onSuccess: () => {
          modalOpen.value = false
          expandedIds.value = new Set([...expandedIds.value, parentAccount.value!.id])
          void refetch()
        },
      },
    )
    return
  }

  if (modalMode.value === 'edit' && editingAccount.value) {
    const body: Record<string, unknown> = {
      name: form.value.name.trim(),
      accountType: form.value.accountType,
      isMovement: form.value.isMovement,
      sortOrder: form.value.sortOrder,
    }
    if (!editingAccount.value.hasMovements && form.value.code.trim() !== editingAccount.value.code) {
      body.code = form.value.code.trim()
    }
    updateAccount(
      { id: editingAccount.value.id, body },
      { onSuccess: () => { modalOpen.value = false; void refetch() } },
    )
  }
}

async function confirmDeactivate(account: ContabilidadAccountDTO) {
  const ok = await markapAlert.confirmDanger({
    title: 'Desactivar cuenta',
    text: `¿Desactivar la cuenta ${account.code} — ${account.name}?`,
    confirmText: 'Desactivar',
  })
  if (!ok) return
  deactivateAccount(account.id, { onSuccess: () => void refetch() })
}

const { exportToExcel, isExporting } = useExcelExport()

function exportPlan() {
  const tree = data.value?.tree ?? []
  const flat = flattenAccountTree(tree)
  exportToExcel({
    fileName: 'plan_cuentas_pcge.xlsx',
    sheetName: 'Plan de cuentas',
    columns: [
      { header: 'Código', key: 'code', width: 14 },
      { header: 'Nombre', key: 'name', width: 48 },
      { header: 'Nivel', key: 'level', width: 8 },
      { header: 'Tipo', key: 'accountType', width: 14 },
      { header: 'Movimiento', key: 'isMovement', width: 12 },
      { header: 'Activa', key: 'isActive', width: 10 },
      { header: 'Sistema', key: 'isSystem', width: 10 },
    ],
    rows: flat.map((row) => ({
      code: row.code,
      name: `${'  '.repeat(Math.max(0, row.level - 1))}${row.name}`,
      level: row.level,
      accountType: typeLabel(row.accountType),
      isMovement: row.isMovement ? 'Sí' : 'No',
      isActive: row.isActive ? 'Sí' : 'No',
      isSystem: row.isSystem ? 'Sí' : 'No',
    })),
  })
}

const codeReadonly = computed(
  () => modalMode.value === 'edit' && Boolean(editingAccount.value?.hasMovements),
)
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Plan de cuentas (PCGE)
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Estructura contable según PCGE (Res. 194-2013-EF). Cuentas título y de movimiento.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="secondary" size="sm" @click="expandAll">Expandir todo</BaseButton>
        <BaseButton variant="secondary" size="sm" @click="collapseAll">Colapsar</BaseButton>
        <BaseButton variant="secondary" size="sm" :loading="isExporting" @click="exportPlan">
          Exportar Excel
        </BaseButton>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
      <SearchInput v-model="searchInput" placeholder="Buscar por código o nombre…" class="flex-1 max-w-md" />
      <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
        {{ visibleRows.length }} cuenta(s) visibles
      </p>
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div
      v-else-if="isError"
      class="rounded-xl border p-8 text-center space-y-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">No se pudo cargar el plan</p>
      <p class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{ loadError }}</p>
      <BaseButton variant="secondary" @click="refetch()">Reintentar</BaseButton>
    </div>

    <div
      v-else
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
            <th class="text-left py-3 px-4 font-medium w-[38%]" :style="{ color: 'var(--color-text-secondary)' }">
              Cuenta
            </th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Tipo</th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">
              Naturaleza
            </th>
            <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Estado</th>
            <th class="py-3 px-4" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in visibleRows"
            :key="row.id"
            class="border-b last:border-b-0 hover:opacity-90"
            :style="{
              borderColor: 'var(--color-border)',
              opacity: row.isActive ? 1 : 0.55,
            }"
          >
            <td class="py-2.5 px-4">
              <div class="flex items-center gap-1" :style="{ paddingLeft: `${row.depth * 1.25}rem` }">
                <button
                  v-if="row.hasChildren && !searchActive"
                  type="button"
                  class="p-0.5 rounded hover:bg-black/5"
                  @click="toggleExpand(row.id)"
                >
                  <AppIcon
                    :icon="expandedIds.has(row.id) ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                    :size="16"
                    color="var(--color-text-muted)"
                  />
                </button>
                <span v-else class="w-5" />
                <span class="font-mono text-xs mr-2" :style="{ color: 'var(--color-primary)' }">{{ row.code }}</span>
                <span :style="{ color: 'var(--color-text-primary)' }">{{ row.name }}</span>
              </div>
            </td>
            <td class="py-2.5 px-4" :style="{ color: 'var(--color-text-secondary)' }">
              {{ typeLabel(row.accountType) }}
            </td>
            <td class="py-2.5 px-4">
              <span
                class="text-xs px-2 py-0.5 rounded-full"
                :style="{
                  backgroundColor: row.isMovement ? 'var(--color-primary-soft)' : 'var(--color-surface-elevated)',
                  color: row.isMovement ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }"
              >
                {{ row.isMovement ? 'Movimiento' : 'Título' }}
              </span>
            </td>
            <td class="py-2.5 px-4">
              <span
                class="text-xs"
                :style="{ color: row.isActive ? 'var(--color-success)' : 'var(--color-text-muted)' }"
              >
                {{ row.isActive ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td class="py-2.5 px-4 text-right">
              <div class="flex justify-end gap-1">
                <BaseButton
                  v-if="!row.isMovement && row.isActive"
                  variant="ghost"
                  size="sm"
                  title="Agregar subcuenta"
                  @click="openCreate(row)"
                >
                  <AppIcon icon="lucide:plus" :size="16" />
                </BaseButton>
                <BaseButton variant="ghost" size="sm" title="Editar" @click="openEdit(row)">
                  <AppIcon icon="lucide:pencil" :size="16" />
                </BaseButton>
                <BaseButton
                  v-if="row.isActive && !row.isSystem"
                  variant="ghost"
                  size="sm"
                  title="Desactivar"
                  :loading="deactivating"
                  @click="confirmDeactivate(row)"
                >
                  <AppIcon icon="lucide:ban" :size="16" />
                </BaseButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BaseModal
      v-model="modalOpen"
      :title="modalMode === 'create' ? 'Nueva subcuenta' : 'Editar cuenta'"
      size="md"
    >
      <form class="space-y-4" @submit.prevent="submitForm">
        <p v-if="parentAccount" class="text-xs" :style="{ color: 'var(--color-text-secondary)' }">
          Cuenta padre: <strong>{{ parentAccount.code }}</strong> — {{ parentAccount.name }}
        </p>
        <FormInput
          v-model="form.code"
          label="Código PCGE"
          :disabled="codeReadonly"
          :hint="codeReadonly ? 'No editable: la cuenta tiene movimientos' : 'Debe iniciar con el código del padre'"
        />
        <FormInput v-model="form.name" label="Nombre de la cuenta" required />
        <div>
          <label class="block text-sm font-medium mb-1" :style="{ color: 'var(--color-text-primary)' }">
            Tipo de cuenta
          </label>
          <select
            v-model="form.accountType"
            class="w-full px-3 py-2 rounded-lg border text-sm"
            :style="{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface-elevated)',
              color: 'var(--color-text-primary)',
            }"
          >
            <option v-for="opt in CONTABILIDAD_ACCOUNT_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <FormCheckbox v-model="form.isMovement" label="Cuenta de movimiento (admite asientos)" />
        <FormInput v-model.number="form.sortOrder" type="number" label="Orden" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="creating || updating">
            {{ modalMode === 'create' ? 'Crear cuenta' : 'Guardar cambios' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
