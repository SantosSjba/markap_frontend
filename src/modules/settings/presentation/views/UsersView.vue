<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import * as yup from 'yup'
import { Icon } from '@iconify/vue'
import {
  useUsers,
  useRoles,
  useCreateUser,
  useUpdateUser,
  useToggleUserActive,
  useAssignRole,
  useRevokeRole,
} from '../composables/useUsers'
import { usePagination } from '@shared/presentation/composables/usePagination'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BasePagination from '@shared/presentation/components/ui/BasePagination.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import type { UserListItem } from '../../domain/settings.types'
/**
 * UsersView
 * User management page with TanStack Query
 */

const ITEMS_PER_PAGE = 10

// Queries
const { data: users, isLoading, isFetching, error, refetch } = useUsers()
const { data: roles, isError: isRolesError, error: rolesError, refetch: refetchRoles } = useRoles()

// Pagination
const pagination = usePagination({
  initialPage: 1,
  initialLimit: ITEMS_PER_PAGE,
})

// Mutations
const createUserMutation = useCreateUser()
const updateUserMutation = useUpdateUser()
const toggleActiveMutation = useToggleUserActive()
const assignRoleMutation = useAssignRole()
const revokeRoleMutation = useRevokeRole()

const searchQuery = ref('')

// Modal states
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isRolesModalOpen = ref(false)
const selectedUser = ref<UserListItem | null>(null)

const createUserSchema = yup.object({
  email: yup.string().email('Correo inválido').required('El correo es requerido').trim(),
  password: yup.string().min(6, 'Mínimo 6 caracteres').required('La contraseña es requerida'),
  firstName: yup.string().required('El nombre es requerido').trim(),
  lastName: yup.string().required('El apellido es requerido').trim(),
})

const editUserSchema = yup.object({
  email: yup.string().email('Correo inválido').required('El correo es requerido').trim(),
  firstName: yup.string().required('El nombre es requerido').trim(),
  lastName: yup.string().required('El apellido es requerido').trim(),
})

const createForm = useForm({
  validationSchema: toTypedSchema(createUserSchema),
  initialValues: {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  },
})

const editForm = useForm({
  validationSchema: toTypedSchema(editUserSchema),
  initialValues: {
    firstName: '',
    lastName: '',
    email: '',
  },
})

const createEmailBinds = createForm.defineComponentBinds('email')
const createPasswordBinds = createForm.defineComponentBinds('password')
const createFirstNameBinds = createForm.defineComponentBinds('firstName')
const createLastNameBinds = createForm.defineComponentBinds('lastName')

const createErrors = createForm.errors
const editErrors = editForm.errors

const editFirstNameBinds = editForm.defineComponentBinds('firstName')
const editLastNameBinds = editForm.defineComponentBinds('lastName')
const editEmailBinds = editForm.defineComponentBinds('email')

const filteredUsers = computed(() => {
  if (!users.value) return []
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(
    (user) =>
      user.fullName.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
  )
})

// Update total when filtered users change
watch(
  filteredUsers,
  (list) => {
    pagination.setTotal(list.length)
    // Reset to page 1 if current page exceeds total pages
    if (
      pagination.page.value > 1 &&
      pagination.totalPages.value > 0 &&
      pagination.page.value > pagination.totalPages.value
    ) {
      pagination.page.value = pagination.totalPages.value
    }
  },
  { immediate: true },
)

// Paginated users (slice of filtered users)
const paginatedUsers = computed(() => {
  const list = filteredUsers.value
  const start = (pagination.page.value - 1) * pagination.limit.value
  const end = start + pagination.limit.value
  return list.slice(start, end)
})

// Reset to page 1 when search changes
watch(searchQuery, () => {
  pagination.page.value = 1
})

// Watch for users update to refresh selectedUser
watch(users, (newUsers) => {
  if (selectedUser.value && newUsers) {
    selectedUser.value = newUsers.find((u) => u.id === selectedUser.value?.id) || null
  }
})

const openCreateModal = () => {
  createForm.resetForm({
    values: { email: '', password: '', firstName: '', lastName: '' },
  })
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  isCreateModalOpen.value = false
}

const handleCreate = createForm.handleSubmit(async (vals) => {
  try {
    await createUserMutation.mutateAsync({
      email: vals.email.trim(),
      password: vals.password,
      firstName: vals.firstName.trim(),
      lastName: vals.lastName.trim(),
    })
    closeCreateModal()
  } catch {
    /* onError en useCreateUser */
  }
})

const openEditModal = (user: UserListItem) => {
  selectedUser.value = user
  editForm.resetForm({
    values: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  })
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedUser.value = null
}

const handleEdit = editForm.handleSubmit(async (vals) => {
  if (!selectedUser.value) return

  try {
    await updateUserMutation.mutateAsync({
      id: selectedUser.value.id,
      data: {
        firstName: vals.firstName.trim(),
        lastName: vals.lastName.trim(),
        email: vals.email.trim(),
      },
    })
    closeEditModal()
  } catch {
    /* onError en useUpdateUser */
  }
})

const toggleUserActive = async (user: UserListItem) => {
  try {
    await toggleActiveMutation.mutateAsync(user.id)
  } catch {
    /* onError en useToggleUserActive */
  }
}

const openRolesModal = (user: UserListItem) => {
  selectedUser.value = user
  isRolesModalOpen.value = true
}

const closeRolesModal = () => {
  isRolesModalOpen.value = false
  selectedUser.value = null
}

const hasRole = (roleId: string): boolean => {
  return selectedUser.value?.roles.some((r) => r.id === roleId) || false
}

const toggleRole = async (roleId: string) => {
  if (!selectedUser.value) return

  try {
    if (hasRole(roleId)) {
      await revokeRoleMutation.mutateAsync({
        userId: selectedUser.value.id,
        roleId,
      })
    } else {
      await assignRoleMutation.mutateAsync({
        userId: selectedUser.value.id,
        roleId,
      })
    }
  } catch {
    /* onError en mutaciones de rol */
  }
}

const isCreating = computed(() => createUserMutation.isPending.value)
const isUpdating = computed(() => updateUserMutation.isPending.value)

const isTogglingActive = (userId: string) =>
  toggleActiveMutation.isPending.value && toggleActiveMutation.variables.value === userId

const isUserRowBusy = (userId: string) =>
  isTogglingActive(userId) ||
  (updateUserMutation.isPending.value && updateUserMutation.variables.value?.id === userId) ||
  (assignRoleMutation.isPending.value && assignRoleMutation.variables.value?.userId === userId) ||
  (revokeRoleMutation.isPending.value && revokeRoleMutation.variables.value?.userId === userId)

const isRoleRowSaving = (roleId: string) => {
  if (!selectedUser.value) return false
  const uid = selectedUser.value.id
  const assigning =
    assignRoleMutation.isPending.value &&
    assignRoleMutation.variables.value?.userId === uid &&
    assignRoleMutation.variables.value?.roleId === roleId
  const revoking =
    revokeRoleMutation.isPending.value &&
    revokeRoleMutation.variables.value?.userId === uid &&
    revokeRoleMutation.variables.value?.roleId === roleId
  return assigning || revoking
}

// Pagination props (unwrapped for BasePagination)
const paginationProps = computed(() => ({
  currentPage: pagination.page.value,
  totalPages: pagination.totalPages.value,
  totalItems: pagination.total.value,
  pageSize: pagination.limit.value,
  hasPrevPage: pagination.hasPrevPage.value,
  hasNextPage: pagination.hasNextPage.value,
}))
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold" style="color: var(--color-text-primary);">Usuarios</h2>
      <button
        @click="openCreateModal"
        class="btn-primary px-4 py-2 rounded-lg flex items-center gap-2"
      >
        <Icon icon="lucide:plus" class="w-5 h-5" />
        Nuevo Usuario
      </button>
    </div>

    <!-- Search -->
      <div class="card p-4 mb-6">
      <div class="relative">
        <Icon
          icon="lucide:search"
          class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
          :style="{ color: 'var(--color-text-muted)' }"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar usuarios..."
          class="w-full"
          style="padding-left: 2.75rem;"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <Icon icon="svg-spinners:ring-resize" class="w-10 h-10" :style="{ color: 'var(--color-primary)' }" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <p style="color: var(--color-error);">Error al cargar los datos</p>
      <button
        type="button"
        :disabled="isFetching"
        class="btn-primary mt-4 px-6 py-2 rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-60"
        @click="() => refetch()"
      >
        <Icon
          v-if="isFetching"
          icon="svg-spinners:ring-resize"
          class="w-5 h-5"
        />
        Reintentar
      </button>
    </div>

    <!-- Users table -->
    <div v-else class="card overflow-hidden">
      <div
        v-if="isRolesError"
        class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b text-sm"
        style="border-color: var(--color-border); background-color: var(--color-warning-light)"
      >
        <span style="color: var(--color-text-primary)">
          No se pudieron cargar los roles para asignar:
          <span style="color: var(--color-error)">{{ getApiErrorMessage(rolesError) }}</span>
        </span>
        <button
          type="button"
          class="btn-primary px-4 py-2 rounded-lg text-sm shrink-0"
          @click="() => refetchRoles()"
        >
          Reintentar roles
        </button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Roles</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.id">
              <td>
                <div class="flex items-center gap-3">
                  <div 
                    class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
                    style="background-color: var(--color-primary);"
                  >
                    {{ user.firstName.charAt(0) }}{{ user.lastName.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-medium" style="color: var(--color-text-primary);">{{ user.fullName }}</p>
                    <p class="text-sm" style="color: var(--color-text-muted);">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="role in user.roles"
                    :key="role.id"
                    class="badge badge-info text-xs"
                  >
                    {{ role.name }}
                  </span>
                  <span v-if="user.roles.length === 0" class="text-sm" style="color: var(--color-text-muted);">
                    Sin roles
                  </span>
                </div>
              </td>
              <td>
                <span :class="user.isActive ? 'badge-success' : 'badge-error'" class="badge">
                  {{ user.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td>
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    :disabled="isUserRowBusy(user.id)"
                    class="p-2 rounded-lg hover-surface disabled:opacity-50 disabled:pointer-events-none"
                    title="Gestionar roles"
                    @click="openRolesModal(user)"
                  >
                    <Icon icon="lucide:shield-check" class="w-5 h-5" :style="{ color: 'var(--color-text-muted)' }" />
                  </button>
                  <button
                    type="button"
                    :disabled="isUserRowBusy(user.id)"
                    class="p-2 rounded-lg hover-surface disabled:opacity-50 disabled:pointer-events-none"
                    title="Editar"
                    @click="openEditModal(user)"
                  >
                    <Icon icon="lucide:pencil" class="w-5 h-5" :style="{ color: 'var(--color-text-muted)' }" />
                  </button>
                  <button
                    type="button"
                    :disabled="isUserRowBusy(user.id)"
                    class="p-2 rounded-lg hover-surface disabled:opacity-50 disabled:pointer-events-none"
                    :title="user.isActive ? 'Desactivar' : 'Activar'"
                    @click="toggleUserActive(user)"
                  >
                    <Icon
                      v-if="isTogglingActive(user.id)"
                      icon="svg-spinners:ring-resize"
                      class="w-5 h-5"
                      :style="{ color: 'var(--color-text-muted)' }"
                    />
                    <Icon
                      v-else
                      :icon="user.isActive ? 'lucide:circle-x' : 'lucide:circle-check'"
                      class="w-5 h-5"
                      :style="{ color: user.isActive ? 'var(--color-error)' : 'var(--color-success)' }"
                    />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
<div class="border-t" style="border-color: var(--color-border);">
        <BasePagination
          :current-page="paginationProps.currentPage"
          :total-pages="paginationProps.totalPages"
          :total-items="paginationProps.totalItems"
          :page-size="paginationProps.pageSize"
          :has-prev-page="paginationProps.hasPrevPage"
          :has-next-page="paginationProps.hasNextPage"
          :show-page-size="true"
          :page-size-options="[5, 10, 20, 50]"
          @update:current-page="pagination.setPage"
          @update:page-size="pagination.setLimit"
        />
      </div>
    </div>

    <!-- Create Modal -->
    <BaseModal
      :model-value="isCreateModalOpen"
      title="Nuevo Usuario"
      @update:model-value="(open) => !open && closeCreateModal()"
    >
      <form id="users-create-form" class="space-y-4" @submit.prevent="handleCreate">
        <div class="grid grid-cols-2 gap-4">
          <FormInput
            v-bind="createFirstNameBinds"
            label="Nombre"
            :error="createErrors.firstName"
            required
          />
          <FormInput
            v-bind="createLastNameBinds"
            label="Apellido"
            :error="createErrors.lastName"
            required
          />
        </div>
        <FormInput
          v-bind="createEmailBinds"
          type="email"
          label="Email"
          :error="createErrors.email"
          required
        />
        <FormInput
          v-bind="createPasswordBinds"
          type="password"
          label="Contraseña"
          :error="createErrors.password"
          required
        />
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="closeCreateModal">Cancelar</BaseButton>
          <BaseButton type="submit" form="users-create-form" :loading="isCreating">
            Crear Usuario
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal
      :model-value="isEditModalOpen"
      title="Editar Usuario"
      @update:model-value="(open) => !open && closeEditModal()"
    >
      <form id="users-edit-form" class="space-y-4" @submit.prevent="handleEdit">
        <div class="grid grid-cols-2 gap-4">
          <FormInput
            v-bind="editFirstNameBinds"
            label="Nombre"
            :error="editErrors.firstName"
            required
          />
          <FormInput
            v-bind="editLastNameBinds"
            label="Apellido"
            :error="editErrors.lastName"
            required
          />
        </div>
        <FormInput
          v-bind="editEmailBinds"
          type="email"
          label="Email"
          :error="editErrors.email"
          required
        />
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <BaseButton variant="ghost" @click="closeEditModal">Cancelar</BaseButton>
          <BaseButton type="submit" form="users-edit-form" :loading="isUpdating">
            Guardar Cambios
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Roles Modal -->
    <BaseModal
      :model-value="isRolesModalOpen && !!selectedUser"
      title="Gestionar Roles"
      @update:model-value="(open) => !open && closeRolesModal()"
    >
      <p class="text-sm mb-4" style="color: var(--color-text-secondary);">{{ selectedUser?.fullName }}</p>
      <div class="space-y-2">
        <button
          v-for="role in (roles ?? [])"
          :key="role.id"
          type="button"
          :disabled="isRoleRowSaving(role.id)"
          :aria-pressed="hasRole(role.id)"
          :class="[
            'w-full flex items-center justify-between p-3 rounded-lg border transition-colors disabled:opacity-60',
            hasRole(role.id) ? 'border-2' : 'hover-surface',
          ]"
          :style="{
            borderColor: hasRole(role.id) ? 'var(--color-primary)' : 'var(--color-border)',
            backgroundColor: hasRole(role.id) ? 'var(--color-primary-light)' : '',
          }"
          @click="toggleRole(role.id)"
        >
          <div>
            <p class="font-medium text-left" style="color: var(--color-text-primary);">{{ role.name }}</p>
            <p class="text-sm text-left" style="color: var(--color-text-muted);">{{ role.code }}</p>
          </div>
          <Icon
            v-if="isRoleRowSaving(role.id)"
            icon="svg-spinners:ring-resize"
            class="w-5 h-5 shrink-0"
            :style="{ color: 'var(--color-primary)' }"
          />
          <Icon
            v-else-if="hasRole(role.id)"
            icon="lucide:circle-check"
            class="w-5 h-5 shrink-0"
            :style="{ color: 'var(--color-primary)' }"
          />
        </button>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <BaseButton @click="closeRolesModal">Listo</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
