<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, Badge, AppIcon } from '@shared/components'
import { useArquitecturaClient } from '../../application/useClients'
import { ARQUITECTURA_BASE_PATH } from '@modules/arquitectura/config/routes.constants'
import type { ClientDetail } from '../../domain/client.types'

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const activeTab = ref<'datos' | 'proyectos' | 'presupuestos' | 'notas'>('datos')

const { data: client, isLoading, isError } = useArquitecturaClient(id)

watch(isError, (e) => {
  if (e) void router.replace(`${ARQUITECTURA_BASE_PATH}/clientes`)
})

watch(
  client,
  (c) => {
    if (c && c.clientType !== 'RESIDENTIAL' && c.clientType !== 'CORPORATE') {
      void router.replace(`${ARQUITECTURA_BASE_PATH}/clientes`)
    }
  },
  { immediate: true },
)

const typeLabel = (c: ClientDetail | undefined) => {
  if (!c) return ''
  return c.clientType === 'RESIDENTIAL' ? 'Residencial' : 'Corporativo'
}

const goBack = () => router.push(`${ARQUITECTURA_BASE_PATH}/clientes`)
const goEdit = () => router.push(`${ARQUITECTURA_BASE_PATH}/clientes/${id.value}/editar`)

const addrText = computed(() => {
  const c = client.value
  if (!c?.primaryAddress) return 'Sin dirección registrada'
  const a = c.primaryAddress
  const d = a.district
  return `${a.addressLine} — ${d.name}, ${d.province.name}, ${d.province.department.name}`
})
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1200px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start gap-4">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)] shrink-0"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" />
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-xl font-bold truncate" :style="{ color: 'var(--color-text-primary)' }">
            {{ client?.fullName ?? 'Cliente' }}
          </h1>
          <Badge v-if="client" :variant="client.clientType === 'RESIDENTIAL' ? 'info' : 'success'">
            {{ typeLabel(client) }}
          </Badge>
          <Badge v-if="client" :variant="client.isActive ? 'success' : 'error'">
            {{ client.isActive ? 'Activo' : 'Inactivo' }}
          </Badge>
        </div>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          {{ client?.documentType.name }} {{ client?.documentNumber }}
        </p>
      </div>
      <BaseButton v-if="client" variant="primary" size="sm" class="flex items-center gap-1.5" @click="goEdit">
        <AppIcon icon="lucide:pencil" :size="15" />
        Editar
      </BaseButton>
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <template v-else-if="client">
      <div
        class="flex flex-wrap gap-2 p-1 rounded-xl border"
        :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
      >
        <button
          v-for="tab in (
            [
              { id: 'datos' as const, label: 'Datos' },
              { id: 'proyectos' as const, label: 'Proyectos' },
              { id: 'presupuestos' as const, label: 'Cotizaciones' },
              { id: 'notas' as const, label: 'Notas internas' },
            ]
          )"
          :key="tab.id"
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          :style="{
            background: activeTab === tab.id ? 'var(--color-primary-subtle)' : 'transparent',
            color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div
        v-show="activeTab === 'datos'"
        class="p-6 rounded-xl border space-y-6"
        :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
      >
        <div>
          <h3 class="text-sm font-semibold mb-3" :style="{ color: 'var(--color-text-primary)' }">
            Contacto
          </h3>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Teléfono</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ client.primaryPhone }}</dd>
            </div>
            <div>
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Tel. secundario</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ client.secondaryPhone ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Email</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ client.primaryEmail }}</dd>
            </div>
            <div>
              <dt class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Email secundario</dt>
              <dd :style="{ color: 'var(--color-text-primary)' }">{{ client.secondaryEmail ?? '—' }}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h3 class="text-sm font-semibold mb-2" :style="{ color: 'var(--color-text-primary)' }">
            Dirección
          </h3>
          <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">{{ addrText }}</p>
        </div>
        <div v-if="client.legalRepresentativeName">
          <h3 class="text-sm font-semibold mb-2" :style="{ color: 'var(--color-text-primary)' }">
            Representante legal
          </h3>
          <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
            {{ client.legalRepresentativeName }}
            <span v-if="client.legalRepresentativePosition"> — {{ client.legalRepresentativePosition }}</span>
          </p>
        </div>
      </div>

      <div
        v-show="activeTab === 'proyectos'"
        class="p-8 rounded-xl border text-center"
        :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
      >
        <AppIcon icon="lucide:folder-kanban" :size="40" class="mx-auto mb-3 opacity-40" />
        <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
          Historial de proyectos
        </p>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Aquí se listarán los proyectos vinculados a este cliente cuando el módulo de proyectos esté conectado.
        </p>
      </div>

      <div
        v-show="activeTab === 'presupuestos'"
        class="p-8 rounded-xl border text-center"
        :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
      >
        <AppIcon icon="lucide:file-spreadsheet" :size="40" class="mx-auto mb-3 opacity-40" />
        <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
          Presupuestos del cliente
        </p>
        <p class="text-sm mt-1 mb-4" :style="{ color: 'var(--color-text-secondary)' }">
          Cada proyecto incluye su presupuesto en la pestaña correspondiente.
        </p>
        <BaseButton
          variant="outline"
          size="sm"
          @click="router.push(`${ARQUITECTURA_BASE_PATH}/proyectos?clientId=${client.id}`)"
        >
          Ver proyectos
        </BaseButton>
      </div>

      <div
        v-show="activeTab === 'notas'"
        class="p-6 rounded-xl border"
        :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
      >
        <h3 class="text-sm font-semibold mb-2" :style="{ color: 'var(--color-text-primary)' }">
          Notas internas del equipo
        </h3>
        <p class="text-sm whitespace-pre-wrap" :style="{ color: 'var(--color-text-secondary)' }">
          {{ client.notes?.trim() || 'Sin notas. Puedes añadirlas desde Editar cliente.' }}
        </p>
      </div>
    </template>
  </div>
</template>
