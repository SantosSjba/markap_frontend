<script setup lang="ts">
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useRoles } from '../composables/useUsers'
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
    <h2 class="text-xl font-semibold mb-6 text-gray-800 dark:text-white/90">Roles</h2>

    <!-- Error -->
    <div v-if="error" class="rounded-lg p-4 mb-6 bg-error-50 dark:bg-error-500/15 text-error-500 dark:text-error-400">
      Error al cargar los roles.
      <BaseButton :disabled="isFetching" @click="() => refetch()" variant="link" :loading="isFetching" class="font-medium ml-2">Reintentar</BaseButton>
    </div>

    <!-- Loading -->
    <LoadingState v-else-if="isLoading" class="py-12" />

    <!-- Roles list -->
    <div v-else class="grid gap-4">
      <div
        v-for="role in roles"
        :key="role.id"
        class="card p-4 flex items-center justify-between"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center bg-brand-50 dark:bg-brand-500/12"
          >
            <Icon icon="lucide:shield-check" class="w-6 h-6 text-brand-500 dark:text-brand-400" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-800 dark:text-white/90">{{ role.name }}</h3>
            <p class="text-sm text-gray-400 dark:text-gray-500">Código: {{ role.code }}</p>
          </div>
        </div>
        <Badge variant="info">{{ role.code }}</Badge>
      </div>
    </div>
  </div>
</template>
