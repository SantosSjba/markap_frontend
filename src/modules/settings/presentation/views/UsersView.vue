<script setup lang="ts">
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import Avatar from '@shared/presentation/components/ui/Avatar.vue'
import { ref, computed, watch } from 'vue'
import * as yup from 'yup'
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
    <PageHeader title="Usuarios" class="mb-6">
      <template #actions>
        <BaseButton icon="lucide:plus" @click="openCreateModal">Nuevo Usuario</BaseButton>
      </template>
    </PageHeader>

    <!-- Search -->
    <div class="card mb-6 p-4">
      <SearchInput v-model="searchQuery" placeholder="Buscar usuarios..." />
    </div>

    <!-- Loading -->
    <LoadingState v-if="isLoading" class="py-12" />

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-error-500 dark:text-error-400">Error al cargar los datos</p>
      <BaseButton :disabled="isFetching" @click="() => refetch()" size="sm" :loading="isFetching" class="mt-4">Reintentar</BaseButton>
    </div>

    <!-- Users table -->
    <div v-else class="card overflow-hidden">
      <div
        v-if="isRolesError"
        class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b text-sm border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
      >
        <span class="text-gray-800 dark:text-white/90">
          No se pudieron cargar los roles para asignar:
          <span class="text-error-500 dark:text-error-400">{{ getApiErrorMessage(rolesError) }}</span>
        </span>
        <BaseButton @click="() => refetchRoles()" size="sm" class="shrink-0">Reintentar roles</BaseButton>
      </div>
      <div class="table-container">
        <DataTable
          :columns="[
            { key: 'c0', label: 'Usuario' },
            { key: 'c1', label: 'Roles' },
            { key: 'c2', label: 'Estado' },
            { key: 'c3', label: 'Acciones', align: 'right' },
          ]"
          :data="paginatedUsers"
        >
          <template #row="{ row: user }">
              <td>
                <div class="flex items-center gap-3">
                  <Avatar :name="`${user.firstName} ${user.lastName}`" />
                  <div>
                    <p class="font-medium text-gray-800 dark:text-white/90">{{ user.fullName }}</p>
                    <p class="text-sm text-gray-400 dark:text-gray-500">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <Badge v-for="role in user.roles" :key="role.id" variant="info">{{ role.name }}</Badge>
                  <span v-if="user.roles.length === 0" class="text-sm text-gray-400 dark:text-gray-500">
                    Sin roles
                  </span>
                </div>
              </td>
              <td>
                <Badge :variant="user.isActive ? 'success' : 'error'">{{ user.isActive ? 'Activo' : 'Inactivo' }}</Badge>
              </td>
              <td>
                <div class="flex items-center justify-end gap-2">
                  <IconButton :disabled="isUserRowBusy(user.id)" @click="openRolesModal(user)" icon="lucide:shield-check" label="Gestionar roles" />
                  <IconButton :disabled="isUserRowBusy(user.id)" @click="openEditModal(user)" icon="lucide:pencil" label="Editar" />
                  <IconButton
                    :disabled="isUserRowBusy(user.id)"
                    :loading="isTogglingActive(user.id)"
                    :icon="user.isActive ? 'lucide:circle-x' : 'lucide:circle-check'"
                    :label="user.isActive ? 'Desactivar' : 'Activar'"
                    :danger="user.isActive"
                    :class="user.isActive ? undefined : 'text-success-600 dark:text-success-500'"
                    @click="toggleUserActive(user)"
                  />
                </div>
              </td>
          </template>
        </DataTable>
      </div>

      <!-- Pagination -->
<div class="border-t border-gray-200 dark:border-gray-800">
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
      <p class="text-sm mb-4 text-gray-500 dark:text-gray-400">{{ selectedUser?.fullName }}</p>
      <div class="space-y-2">
        <FormCheckbox
          v-for="role in (roles ?? [])"
          :key="role.id"
          class="rounded-lg border border-gray-200 p-3 has-data-checked:border-brand-500 has-data-checked:bg-brand-500/5 dark:border-gray-800"
          :model-value="hasRole(role.id)"
          :label="role.name"
          :description="role.code"
          :disabled="isRoleRowSaving(role.id)"
          @update:model-value="toggleRole(role.id)"
        />
      </div>
      <template #footer>
        <div class="flex justify-end">
          <BaseButton @click="closeRolesModal">Listo</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
