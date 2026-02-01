<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usersService } from '../services'
import type { RoleInfo } from '../types'

/**
 * RolesView
 * Roles list view (read-only for now)
 */

const roles = ref<RoleInfo[]>([])
const isLoading = ref(true)

const loadRoles = async () => {
  isLoading.value = true
  try {
    roles.value = await usersService.getRoles()
  } catch (err) {
    console.error('Failed to load roles:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRoles()
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6" style="color: var(--color-text-primary);">Roles</h2>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <svg class="animate-spin h-8 w-8" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Roles list -->
    <div v-else class="grid gap-4">
      <div
        v-for="role in roles"
        :key="role.id"
        class="card p-4 flex items-center justify-between"
      >
        <div class="flex items-center gap-4">
          <div 
            class="w-12 h-12 rounded-lg flex items-center justify-center"
            style="background-color: var(--color-primary-light);"
          >
            <svg class="w-6 h-6" style="color: var(--color-primary);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold" style="color: var(--color-text-primary);">{{ role.name }}</h3>
            <p class="text-sm" style="color: var(--color-text-muted);">Código: {{ role.code }}</p>
          </div>
        </div>
        <span class="badge badge-info">{{ role.code }}</span>
      </div>
    </div>
  </div>
</template>
