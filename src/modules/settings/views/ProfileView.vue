<script setup lang="ts">
import { useAuthStore } from '@modules/auth/stores'

/**
 * ProfileView
 * User profile page
 */

const authStore = useAuthStore()
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6" style="color: var(--color-text-primary);">Mi Perfil</h2>

    <div class="card p-6">
      <!-- Avatar -->
      <div class="flex items-center gap-6 mb-8 pb-8 border-b" style="border-color: var(--color-border);">
        <div 
          class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
          style="background-color: var(--color-primary);"
        >
          {{ authStore.userInitials }}
        </div>
        <div>
          <h3 class="text-xl font-semibold" style="color: var(--color-text-primary);">
            {{ authStore.userFullName }}
          </h3>
          <p style="color: var(--color-text-secondary);">{{ authStore.user?.email }}</p>
        </div>
      </div>

      <!-- Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-text-secondary);">
            Nombre
          </label>
          <p class="text-lg" style="color: var(--color-text-primary);">
            {{ authStore.user?.firstName }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-text-secondary);">
            Apellido
          </label>
          <p class="text-lg" style="color: var(--color-text-primary);">
            {{ authStore.user?.lastName }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-text-secondary);">
            Correo Electrónico
          </label>
          <p class="text-lg" style="color: var(--color-text-primary);">
            {{ authStore.user?.email }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-text-secondary);">
            Estado
          </label>
          <span 
            class="badge"
            :class="authStore.user?.isActive ? 'badge-success' : 'badge-error'"
          >
            {{ authStore.user?.isActive ? 'Activo' : 'Inactivo' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
