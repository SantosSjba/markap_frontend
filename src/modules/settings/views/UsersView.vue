<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  useUsers, 
  useRoles, 
  useCreateUser, 
  useUpdateUser, 
  useToggleUserActive, 
  useAssignRole, 
  useRevokeRole 
} from '../composables'
import type { UserListItem, CreateUserData } from '../types'

/**
 * UsersView
 * User management page with TanStack Query
 */

// Queries
const { data: users, isLoading, error, refetch } = useUsers()
const { data: roles } = useRoles()

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
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Nuevo Usuario
      </button>
    </div>

    <!-- Search -->
    <div class="card p-4 mb-6">
      <div class="relative">
        <svg 
          class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          style="color: var(--color-text-muted);"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
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
      <svg class="animate-spin h-8 w-8" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <p style="color: var(--color-error);">Error al cargar los datos</p>
      <button @click="refetch" class="btn-primary mt-4 px-6 py-2 rounded-lg">Reintentar</button>
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
            <tr v-for="user in filteredUsers" :key="user.id">
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
                    class="p-2 rounded-lg transition-colors hover:bg-gray-100"
                    title="Gestionar roles"
                  >
                    <svg class="w-5 h-5" style="color: var(--color-text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </button>
                  <button
                    @click="openEditModal(user)"
                    class="p-2 rounded-lg transition-colors hover:bg-gray-100"
                    title="Editar"
                  >
                    <svg class="w-5 h-5" style="color: var(--color-text-muted);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    @click="toggleUserActive(user)"
                    class="p-2 rounded-lg transition-colors hover:bg-gray-100"
                    :title="user.isActive ? 'Desactivar' : 'Activar'"
                  >
                    <svg 
                      class="w-5 h-5" 
                      :style="{ color: user.isActive ? 'var(--color-error)' : 'var(--color-success)' }"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path v-if="user.isActive" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
                  class="px-4 py-2 rounded-lg transition-colors hover:bg-gray-100"
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
                  class="px-4 py-2 rounded-lg transition-colors hover:bg-gray-100"
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
                  hasRole(role.id) ? 'border-2' : 'hover:bg-gray-50',
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
                <svg
                  v-if="hasRole(role.id)"
                  class="w-5 h-5"
                  style="color: var(--color-primary);"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </button>
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
