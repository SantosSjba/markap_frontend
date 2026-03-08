<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { 
  useUsers, 
  useRoles, 
  useCreateUser, 
  useUpdateUser, 
  useToggleUserActive, 
  useAssignRole, 
  useRevokeRole 
} from '../composables'
import { usePagination } from '@shared/composables'
import { BasePagination } from '@shared/components'
import type { UserListItem, CreateUserData } from '../types'

/**
 * UsersView
 * User management page with TanStack Query
 */

const ITEMS_PER_PAGE = 10

// Queries
const { data: users, isLoading, error, refetch } = useUsers()
const { data: roles } = useRoles()

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

// Create form
const createForm = ref<CreateUserData>({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  roleIds: [],
})

// Edit form
const editForm = ref({
  firstName: '',
  lastName: '',
  email: '',
})

const filteredUsers = computed(() => {
  if (!users.value) return []
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(
    (user) =>
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
  )
})

// Update total when filtered users change
watch(filteredUsers, (list) => {
  pagination.setTotal(list.length)
  // Reset to page 1 if current page exceeds total pages
  if (pagination.page.value > 1 && pagination.totalPages.value > 0 && pagination.page.value > pagination.totalPages.value) {
    pagination.page.value = pagination.totalPages.value
  }
}, { immediate: true })

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
  createForm.value = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleIds: [],
  }
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  isCreateModalOpen.value = false
}

const handleCreate = async () => {
  if (!createForm.value.email || !createForm.value.password || !createForm.value.firstName || !createForm.value.lastName) {
    return
  }

  await createUserMutation.mutateAsync(createForm.value)
  closeCreateModal()
}

const openEditModal = (user: UserListItem) => {
  selectedUser.value = user
  editForm.value = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  }
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedUser.value = null
}

const handleEdit = async () => {
  if (!selectedUser.value) return

  await updateUserMutation.mutateAsync({
    id: selectedUser.value.id,
    data: editForm.value,
  })
  closeEditModal()
}

const toggleUserActive = async (user: UserListItem) => {
  await toggleActiveMutation.mutateAsync(user.id)
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

  if (hasRole(roleId)) {
    await revokeRoleMutation.mutateAsync({ 
      userId: selectedUser.value.id, 
      roleId 
    })
  } else {
    await assignRoleMutation.mutateAsync({ 
      userId: selectedUser.value.id, 
      roleId 
    })
  }
}

// Computed for loading states
const isSaving = computed(() => 
  createUserMutation.isPending.value || updateUserMutation.isPending.value
)

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
      <button @click="() => refetch()" class="btn-primary mt-4 px-6 py-2 rounded-lg">Reintentar</button>
    </div>

    <!-- Users table -->
    <div v-else class="card overflow-hidden">
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
                    @click="openRolesModal(user)"
                    class="p-2 rounded-lg hover-surface"
                    title="Gestionar roles"
                  >
                    <Icon icon="lucide:shield-check" class="w-5 h-5" :style="{ color: 'var(--color-text-muted)' }" />
                  </button>
                  <button
                    @click="openEditModal(user)"
                    class="p-2 rounded-lg hover-surface"
                    title="Editar"
                  >
                    <Icon icon="lucide:pencil" class="w-5 h-5" :style="{ color: 'var(--color-text-muted)' }" />
                  </button>
                  <button
                    @click="toggleUserActive(user)"
                    class="p-2 rounded-lg hover-surface"
                    :title="user.isActive ? 'Desactivar' : 'Activar'"
                  >
                    <Icon
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
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="isCreateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="closeCreateModal" />
          <div class="relative card p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary);">Nuevo Usuario</h3>
            
            <form @submit.prevent="handleCreate" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1" style="color: var(--color-text-secondary);">Nombre</label>
                  <input v-model="createForm.firstName" type="text" required class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1" style="color: var(--color-text-secondary);">Apellido</label>
                  <input v-model="createForm.lastName" type="text" required class="w-full" />
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-text-secondary);">Email</label>
                <input v-model="createForm.email" type="email" required class="w-full" />
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-text-secondary);">Contraseña</label>
                <input v-model="createForm.password" type="password" required class="w-full" />
              </div>

              <div class="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  @click="closeCreateModal"
                  class="px-4 py-2 rounded-lg hover-surface"
                  style="color: var(--color-text-secondary);"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="isSaving"
                  class="btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {{ isSaving ? 'Guardando...' : 'Crear Usuario' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Edit Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="closeEditModal" />
          <div class="relative card p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold mb-4" style="color: var(--color-text-primary);">Editar Usuario</h3>
            
            <form @submit.prevent="handleEdit" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1" style="color: var(--color-text-secondary);">Nombre</label>
                  <input v-model="editForm.firstName" type="text" required class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1" style="color: var(--color-text-secondary);">Apellido</label>
                  <input v-model="editForm.lastName" type="text" required class="w-full" />
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-1" style="color: var(--color-text-secondary);">Email</label>
                <input v-model="editForm.email" type="email" required class="w-full" />
              </div>

              <div class="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  @click="closeEditModal"
                  class="px-4 py-2 rounded-lg hover-surface"
                  style="color: var(--color-text-secondary);"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="isSaving"
                  class="btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {{ isSaving ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Roles Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="isRolesModalOpen && selectedUser" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50" @click="closeRolesModal" />
          <div class="relative card p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold mb-2" style="color: var(--color-text-primary);">Gestionar Roles</h3>
            <p class="text-sm mb-4" style="color: var(--color-text-secondary);">{{ selectedUser.fullName }}</p>
            
            <div class="space-y-2">
              <button
                v-for="role in (roles ?? [])"
                :key="role.id"
                @click="toggleRole(role.id)"
                :class="[
                  'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
                  hasRole(role.id) ? 'border-2' : 'hover-surface',
                ]"
                :style="{
                  borderColor: hasRole(role.id) ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: hasRole(role.id) ? 'var(--color-primary-light)' : '',
                }"
              >
                <div>
                  <p class="font-medium text-left" style="color: var(--color-text-primary);">{{ role.name }}</p>
                  <p class="text-sm text-left" style="color: var(--color-text-muted);">{{ role.code }}</p>
                </div>
                <Icon
                  v-if="hasRole(role.id)"
                  icon="lucide:circle-check"
                  class="w-5 h-5"
                  :style="{ color: 'var(--color-primary)' }"
                />              </button>
            </div>

            <div class="flex justify-end pt-4">
              <button
                @click="closeRolesModal"
                class="btn-primary px-4 py-2 rounded-lg"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
