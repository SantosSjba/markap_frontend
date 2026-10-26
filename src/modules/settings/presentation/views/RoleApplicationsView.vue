<script setup lang="ts">
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import { computed, watch } from 'vue'
import {
  useRoleApplicationsPage,
  useAssignRoleApplication,
  useRevokeRoleApplication,
} from '../composables/useRoleApplications'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
/**
 * Gestión de roles y aplicaciones
 * Controlar qué roles tienen acceso a cada aplicación (TanStack Query)
 */

const pageQuery = useRoleApplicationsPage()
const assignMutation = useAssignRoleApplication()
const revokeMutation = useRevokeRoleApplication()

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
const roleApplicationIds = computed(() => pageQuery.data.value?.roleApplicationIds ?? {})

const hasAccess = (roleId: string, applicationId: string) =>
  (roleApplicationIds.value[roleId] ?? []).includes(applicationId)

const isSaving = (roleId: string, applicationId: string) => {
  const a =
    assignMutation.isPending.value &&
    assignMutation.variables.value?.roleId === roleId &&
    assignMutation.variables.value?.applicationId === applicationId
  const r =
    revokeMutation.isPending.value &&
    revokeMutation.variables.value?.roleId === roleId &&
    revokeMutation.variables.value?.applicationId === applicationId
  return a || r
}

const toggleAccess = (roleId: string, applicationId: string) => {
  const current = hasAccess(roleId, applicationId)
  if (current) {
    revokeMutation.mutate({ roleId, applicationId })
  } else {
    assignMutation.mutate({ roleId, applicationId })
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white/90">
      Gestión de roles y aplicaciones
    </h2>
    <p class="text-sm mb-6 text-gray-500 dark:text-gray-400">
      Define qué roles tienen acceso a cada aplicación del sistema.
    </p>

    <div
      v-if="pageQuery.isError.value"
      class="rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3 bg-error-50 dark:bg-error-500/15 text-error-500 dark:text-error-400"
    >
      <span>Error al cargar. Intenta de nuevo.</span>
      <BaseButton :disabled="pageQuery.isFetching.value" @click="() => pageQuery.refetch()" variant="secondary" size="sm" :loading="pageQuery.isFetching.value">Reintentar</BaseButton>
    </div>

    <LoadingState v-if="loading" class="py-12" />

    <div v-else class="card overflow-x-auto">
      <Table class="w-full border-collapse min-w-[600px]">
        <TableHeader>
          <TableRow class="border-b border-gray-200 dark:border-gray-800">
            <TableCell is-header
              class="text-left py-3 px-4 font-semibold sticky left-0 z-10 text-gray-800 dark:text-white/90 bg-white dark:bg-gray-dark"
            >
              Rol
            </TableCell>
            <TableCell is-header
              v-for="app in applications"
              :key="app.id"
              class="text-center py-3 px-3 font-medium text-sm text-gray-500 dark:text-gray-400"
            >
              <span class="block truncate max-w-[120px]" :title="app.name">{{ app.name }}</span>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="role in roles"
            :key="role.id"
            class="border-b border-t border-gray-200 dark:border-gray-800"
          >
            <TableCell
              class="py-3 px-4 sticky left-0 z-10 font-medium text-gray-800 dark:text-white/90 bg-white dark:bg-gray-dark"
            >
              <span class="font-medium">{{ role.name }}</span>
              <span class="text-xs block mt-0.5 text-gray-400 dark:text-gray-500">
                {{ role.code }}
              </span>
            </TableCell>
            <TableCell
              v-for="app in applications"
              :key="app.id"
              class="py-2 px-3 text-center"
            >
              <IconButton
                :variant="hasAccess(role.id, app.id) ? 'primary' : 'outline'"
                :disabled="isSaving(role.id, app.id)"
                :loading="isSaving(role.id, app.id)"
                :icon="hasAccess(role.id, app.id) ? 'lucide:check' : 'lucide:plus'"
                :label="hasAccess(role.id, app.id) ? `Quitar ${app.name}` : `Dar acceso a ${app.name}`"
                @click="toggleAccess(role.id, app.id)"
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p
        v-if="!loading && (roles.length === 0 || applications.length === 0)"
        class="py-8 text-center text-sm text-gray-400 dark:text-gray-500"
      >
        No hay roles o aplicaciones para configurar.
      </p>
    </div>
  </div>
</template>
