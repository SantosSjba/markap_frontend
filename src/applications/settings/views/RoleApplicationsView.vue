<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import {
  useRoleApplicationsPage,
  useAssignRoleApplication,
  useRevokeRoleApplication,
} from '../composables'

/**
 * Gestión de roles y aplicaciones
 * Controlar qué roles tienen acceso a cada aplicación (TanStack Query)
 */

const pageQuery = useRoleApplicationsPage()
const assignMutation = useAssignRoleApplication()
const revokeMutation = useRevokeRoleApplication()

const loading = computed(() => pageQuery.isPending.value)
const roles = computed(() => pageQuery.data.value?.roles ?? [])
const applications = computed(() => pageQuery.data.value?.applications ?? [])
const roleApplicationIds = computed(() => pageQuery.data.value?.roleApplicationIds ?? {})

const hasAccess = (roleId: string, applicationId: string) =>
  (roleApplicationIds.value[roleId] ?? []).includes(applicationId)

const isSaving = (roleId: string, applicationId: string) => {
  const a = assignMutation.isPending.value && assignMutation.variables.value?.roleId === roleId && assignMutation.variables.value?.applicationId === applicationId
  const r = revokeMutation.isPending.value && revokeMutation.variables.value?.roleId === roleId && revokeMutation.variables.value?.applicationId === applicationId
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
    <h2 class="text-2xl font-bold mb-2" style="color: var(--color-text-primary);">
      Gestión de roles y aplicaciones
    </h2>
    <p class="text-sm mb-6" style="color: var(--color-text-secondary);">
      Define qué roles tienen acceso a cada aplicación del sistema.
    </p>

    <div v-if="pageQuery.isError.value" class="rounded-lg p-4 mb-6" style="background-color: var(--color-error-light); color: var(--color-error);">
      Error al cargar. Intenta de nuevo.
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <Icon icon="svg-spinners:ring-resize" class="w-10 h-10" :style="{ color: 'var(--color-primary)' }" />
    </div>

    <div v-else class="card overflow-x-auto">
      <table class="w-full border-collapse min-w-[600px]">
        <thead>
          <tr style="border-bottom: 1px solid var(--color-border);">
            <th
              class="text-left py-3 px-4 font-semibold sticky left-0 z-10"
              style="color: var(--color-text-primary); background-color: var(--color-surface);"
            >
              Rol
            </th>
            <th
              v-for="app in applications"
              :key="app.id"
              class="text-center py-3 px-3 font-medium text-sm"
              style="color: var(--color-text-secondary);"
            >
              <span class="block truncate max-w-[120px]" :title="app.name">{{ app.name }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="role in roles"
            :key="role.id"
            class="border-b border-t"
            style="border-color: var(--color-border);"
          >
            <td
              class="py-3 px-4 sticky left-0 z-10 font-medium"
              style="color: var(--color-text-primary); background-color: var(--color-surface);"
            >
              <span class="font-medium">{{ role.name }}</span>
              <span class="text-xs block mt-0.5" style="color: var(--color-text-muted);">
                {{ role.code }}
              </span>
            </td>
            <td
              v-for="app in applications"
              :key="app.id"
              class="py-2 px-3 text-center"
            >
              <button
                type="button"
                :disabled="isSaving(role.id, app.id)"
                :aria-label="hasAccess(role.id, app.id) ? `Quitar ${app.name}` : `Dar acceso a ${app.name}`"
                class="inline-flex items-center justify-center w-9 h-9 rounded-lg border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60"
                :style="{
                  borderColor: hasAccess(role.id, app.id) ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: hasAccess(role.id, app.id) ? 'var(--color-primary-light)' : 'transparent',
                  color: hasAccess(role.id, app.id) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                }"
                @click="toggleAccess(role.id, app.id)"
              >
                <Icon v-if="isSaving(role.id, app.id)" icon="svg-spinners:ring-resize" class="w-5 h-5" />
                <Icon
                  v-else
                  :icon="hasAccess(role.id, app.id) ? 'lucide:check' : 'lucide:plus'"
                  class="w-5 h-5"
                />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p
        v-if="!loading && (roles.length === 0 || applications.length === 0)"
        class="py-8 text-center text-sm"
        style="color: var(--color-text-muted);"
      >
        No hay roles o aplicaciones para configurar.
      </p>
    </div>
  </div>
</template>
