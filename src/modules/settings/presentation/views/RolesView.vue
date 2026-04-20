<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useRoles } from '../../application/useUsers'
import type { RoleInfo } from '../../domain/settings.types'

/**
 * RolesView
 * Roles list view (read-only) — uses TanStack Query
 */

const { data: rolesData, isLoading, isFetching, error, refetch } = useRoles()

const roles = computed<RoleInfo[]>(() => rolesData.value ?? [])
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold mb-6" style="color: var(--color-text-primary);">Roles</h2>

    <!-- Error -->
    <div v-if="error" class="rounded-lg p-4 mb-6" style="background-color: var(--color-error-light); color: var(--color-error);">
      Error al cargar los roles.
      <button
        type="button"
        class="underline ml-2 font-medium inline-flex items-center gap-1.5 disabled:opacity-60"
        :disabled="isFetching"
        @click="() => refetch()"
      >
        <Icon
          v-if="isFetching"
          icon="svg-spinners:ring-resize"
          class="w-4 h-4"
        />
        Reintentar
      </button>
    </div>

    <!-- Loading -->
    <div v-else-if="isLoading" class="flex justify-center py-12">
      <Icon icon="svg-spinners:ring-resize" class="w-10 h-10" :style="{ color: 'var(--color-primary)' }" />
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
            <Icon icon="lucide:shield-check" class="w-6 h-6" :style="{ color: 'var(--color-primary)' }" />
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
