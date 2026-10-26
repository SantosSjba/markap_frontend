<script setup lang="ts">
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import type { AccessLevel, RoleInfo } from '../../domain/settings.types'
import { computed, ref, watch } from 'vue'
import {
  useRoleApplicationsPage,
  useSaveRoleAccess,
  type RoleAccessChange,
} from '../composables/useRoleApplications'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
/**
 * Gestión de roles y aplicaciones
 * Lista de roles con sus accesos; el nivel por aplicación se edita en un modal
 * y se guarda en lote (TanStack Query).
 */

type BadgeVariant = 'info' | 'success' | 'warning' | 'neutral'

interface LevelOption { value: AccessLevel | null; label: string; hint: string; variant: BadgeVariant }
const NO_ACCESS: LevelOption = { value: null, label: 'Sin acceso', hint: 'No puede entrar a la aplicación', variant: 'neutral' }
const LEVELS: LevelOption[] = [
  NO_ACCESS,
  { value: 'READ', label: 'Lectura', hint: 'Ver información', variant: 'info' },
  { value: 'WRITE', label: 'Edición', hint: 'Crear y modificar', variant: 'success' },
  { value: 'ADMIN', label: 'Admin', hint: 'Además eliminar', variant: 'warning' },
]
const levelInfo = (level: AccessLevel | null) => LEVELS.find((l) => l.value === level) ?? NO_ACCESS

const pageQuery = useRoleApplicationsPage()
const saveMutation = useSaveRoleAccess()

watch(
  () => pageQuery.error.value,
  (err) => {
    if (err != null) {
      void markapAlert.toast.error(
        'No se pudo cargar roles y aplicaciones',
        getApiErrorMessage(err),
      )
    }
  },
)

const loading = computed(() => pageQuery.isPending.value)
const roles = computed(() => pageQuery.data.value?.roles ?? [])
const applications = computed(() => pageQuery.data.value?.applications ?? [])
const access = computed(() => pageQuery.data.value?.access ?? {})

const isFullAdmin = (role: RoleInfo) => role.code === 'ADMIN'

/** Apps con acceso del rol, en el orden de las aplicaciones */
const grantedApps = (roleId: string) =>
  applications.value.flatMap((app) => {
    const level = access.value[roleId]?.[app.id]
    return level ? [{ app, level }] : []
  })

// --- Modal de accesos ---
const editingRole = ref<RoleInfo | null>(null)
const draft = ref<Record<string, AccessLevel | null>>({})

const openAccessModal = (role: RoleInfo) => {
  editingRole.value = role
  draft.value = Object.fromEntries(
    applications.value.map((app) => [app.id, access.value[role.id]?.[app.id] ?? null]),
  )
}

const closeAccessModal = () => {
  if (saveMutation.isPending.value) return
  editingRole.value = null
}

const changes = computed<RoleAccessChange[]>(() => {
  const role = editingRole.value
  if (!role) return []
  return applications.value
    .filter((app) => (access.value[role.id]?.[app.id] ?? null) !== draft.value[app.id])
    .map((app) => ({ applicationId: app.id, level: draft.value[app.id] ?? null }))
})

const setAll = (level: AccessLevel | null) => {
  for (const app of applications.value) draft.value[app.id] = level
}

const saveAccess = () => {
  const role = editingRole.value
  if (!role || changes.value.length === 0) return
  saveMutation.mutate(
    { roleId: role.id, changes: changes.value },
    { onSuccess: () => (editingRole.value = null) },
  )
}
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white/90">
      Gestión de roles y aplicaciones
    </h2>
    <p class="text-sm mb-6 text-gray-500 dark:text-gray-400">
      Define a qué aplicaciones entra cada rol y con qué nivel. Si un usuario tiene varios roles, recibe el mayor nivel.
    </p>

    <div
      v-if="pageQuery.isError.value"
      class="rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3 bg-error-50 dark:bg-error-500/15 text-error-500 dark:text-error-400"
    >
      <span>Error al cargar. Intenta de nuevo.</span>
      <BaseButton :disabled="pageQuery.isFetching.value" @click="() => pageQuery.refetch()" variant="secondary" size="sm" :loading="pageQuery.isFetching.value">Reintentar</BaseButton>
    </div>

    <LoadingState v-if="loading" class="py-12" />

    <template v-else-if="!pageQuery.isError.value">
      <!-- Leyenda de niveles -->
      <div class="flex flex-wrap gap-x-5 gap-y-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
        <span v-for="l in LEVELS.slice(1)" :key="l.label" class="flex items-center gap-2">
          <Badge :variant="l.variant">{{ l.label }}</Badge>
          {{ l.hint }}
        </span>
      </div>

      <div class="card overflow-hidden">
        <div class="table-container">
          <DataTable
            :columns="[
              { key: 'role', label: 'Rol' },
              { key: 'access', label: 'Aplicaciones' },
              { key: 'actions', label: 'Acciones', align: 'right' },
            ]"
            :data="roles"
            empty-text="No hay roles para configurar."
          >
            <template #row="{ row: role }">
              <td class="align-top">
                <p class="font-medium text-gray-800 dark:text-white/90">{{ role.name }}</p>
                <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">{{ role.code }}</p>
              </td>
              <td>
                <Badge v-if="isFullAdmin(role)" variant="warning">Acceso total a todas las aplicaciones</Badge>
                <div v-else-if="grantedApps(role.id).length" class="flex flex-wrap gap-1.5">
                  <Badge
                    v-for="{ app, level } in grantedApps(role.id)"
                    :key="app.id"
                    :variant="levelInfo(level).variant"
                    :title="`${app.name}: ${levelInfo(level).label}`"
                  >
                    {{ app.name }} · {{ levelInfo(level).label }}
                  </Badge>
                </div>
                <span v-else class="text-sm text-gray-400 dark:text-gray-500">Sin acceso a aplicaciones</span>
              </td>
              <td>
                <div class="flex justify-end">
                  <BaseButton
                    v-if="!isFullAdmin(role)"
                    variant="secondary"
                    size="sm"
                    :disabled="applications.length === 0"
                    @click="openAccessModal(role)"
                  >
                    Gestionar accesos
                  </BaseButton>
                  <span v-else class="text-xs text-gray-400 dark:text-gray-500">No editable</span>
                </div>
              </td>
            </template>
          </DataTable>
        </div>
      </div>
    </template>

    <!-- Modal de accesos del rol -->
    <BaseModal
      :model-value="editingRole !== null"
      size="lg"
      :persistent="saveMutation.isPending.value"
      :title="editingRole ? `Accesos de ${editingRole.name}` : ''"
      @update:model-value="(open) => !open && closeAccessModal()"
    >
      <div class="flex flex-wrap items-center gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
        <span>Aplicar a todas:</span>
        <button
          v-for="l in LEVELS"
          :key="l.label"
          type="button"
          class="rounded-md px-2 py-1 text-xs font-medium text-brand-500 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/15"
          :disabled="saveMutation.isPending.value"
          @click="setAll(l.value)"
        >
          {{ l.label }}
        </button>
      </div>

      <ul class="divide-y divide-gray-100 dark:divide-gray-800">
        <li
          v-for="app in applications"
          :key="app.id"
          class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <span class="font-medium text-gray-800 dark:text-white/90">{{ app.name }}</span>
          <div
            role="radiogroup"
            :aria-label="`Nivel de acceso a ${app.name}`"
            class="inline-flex w-full rounded-lg border border-gray-200 p-0.5 sm:w-auto dark:border-gray-700"
          >
            <button
              v-for="l in LEVELS"
              :key="l.label"
              type="button"
              role="radio"
              :aria-checked="draft[app.id] === l.value"
              :title="l.hint"
              :disabled="saveMutation.isPending.value"
              class="flex-1 rounded-md px-2 py-1.5 sm:px-3 text-xs font-medium whitespace-nowrap transition-colors sm:flex-none"
              :class="
                draft[app.id] === l.value
                  ? 'bg-brand-500 text-white shadow-theme-xs'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'
              "
              @click="draft[app.id] = l.value"
            >
              {{ l.label }}
            </button>
          </div>
        </li>
      </ul>

      <template #footer>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span class="text-sm text-gray-400 dark:text-gray-500">
            {{ changes.length ? `${changes.length} cambio(s) sin guardar` : 'Sin cambios' }}
          </span>
          <div class="flex gap-3">
            <BaseButton variant="ghost" :disabled="saveMutation.isPending.value" @click="closeAccessModal">Cancelar</BaseButton>
            <BaseButton :disabled="changes.length === 0" :loading="saveMutation.isPending.value" @click="saveAccess">
              Guardar cambios
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
