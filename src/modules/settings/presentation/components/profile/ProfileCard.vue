<script setup lang="ts">
import Badge from '@shared/presentation/components/ui/Badge.vue'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
/**
 * ProfileCard - Componente reutilizable para mostrar datos del perfil
 */
const authStore = useAuthStore()
</script>

<template>
  <div class="card p-6">
    <div class="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
      <div
        class="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white bg-brand-500"
      >
        {{ authStore.userInitials }}
      </div>
      <div>
        <h3 class="text-xl font-semibold text-gray-800 dark:text-white/90">
          {{ authStore.userFullName }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400">{{ authStore.user?.email }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label class="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">
          Nombre
        </label>
        <p class="text-lg text-gray-800 dark:text-white/90">
          {{ authStore.user?.firstName }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">
          Apellido
        </label>
        <p class="text-lg text-gray-800 dark:text-white/90">
          {{ authStore.user?.lastName }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">
          Correo Electrónico
        </label>
        <p class="text-lg text-gray-800 dark:text-white/90">
          {{ authStore.user?.email }}
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-400">
          Estado
        </label>
        <Badge :variant="authStore.user?.isActive ? 'success' : 'error'">{{ authStore.user?.isActive ? 'Activo' : 'Inactivo' }}</Badge>
      </div>
    </div>
  </div>
</template>
