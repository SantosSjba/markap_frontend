<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useInteriorClient } from '../composables/useClients'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import type { ClientDetail } from '../../domain/client.types'
const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const activeTab = ref<'datos' | 'proyectos' | 'presupuestos' | 'notas'>('datos')

const { data: client, isLoading, isError } = useInteriorClient(id)

watch(isError, (e) => {
  if (e) void router.replace(`${INTERIORISMO_BASE_PATH}/clientes`)
})

watch(
  client,
  (c) => {
    if (c && c.clientType !== 'RESIDENTIAL' && c.clientType !== 'CORPORATE') {
      void router.replace(`${INTERIORISMO_BASE_PATH}/clientes`)
    }
  },
  { immediate: true },
)

const typeLabel = (c: ClientDetail | undefined) => {
  if (!c) return ''
  return c.clientType === 'RESIDENTIAL' ? 'Residencial' : 'Corporativo'
}

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/clientes`)
const goEdit = () => router.push(`${INTERIORISMO_BASE_PATH}/clientes/${id.value}/editar`)

const addrText = computed(() => {
  const c = client.value
  if (!c?.primaryAddress) return 'Sin dirección registrada'
  const a = c.primaryAddress
  const d = a.district
  return `${a.addressLine} — ${d.name}, ${d.province.name}, ${d.province.department.name}`
})
</script>

<template>
  <div class="max-w-[1200px] mx-auto space-y-6">
    <PageHeader
      :title="client?.fullName ?? 'Cliente'"
      :subtitle="`${client?.documentType.name} ${client?.documentNumber}`"
      back
      @back="goBack"
    >
      <template #badges>
        <Badge v-if="client" :variant="client.clientType === 'RESIDENTIAL' ? 'info' : 'success'">
            {{ typeLabel(client) }}
          </Badge>
        <Badge v-if="client" :variant="client.isActive ? 'success' : 'error'">
            {{ client.isActive ? 'Activo' : 'Inactivo' }}
          </Badge>
      </template>
      <template #actions>
        <BaseButton v-if="client" variant="primary" size="sm" class="flex items-center gap-1.5" @click="goEdit">
        <AppIcon icon="lucide:pencil" :size="15" />
        Editar
      </BaseButton>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading" />

    <template v-else-if="client">
      <BaseTabs v-model="activeTab" :tabs="[ { id: 'datos' as const, label: 'Datos' }, { id: 'proyectos' as const, label: 'Proyectos' }, { id: 'presupuestos' as const, label: 'Cotizaciones' }, { id: 'notas' as const, label: 'Notas internas' } ]" />

      <BaseCard v-show="activeTab === 'datos'" class="block space-y-6">
        <div>
          <h3 class="text-sm font-semibold mb-3 text-gray-800 dark:text-white/90">
            Contacto
          </h3>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-xs text-gray-400 dark:text-gray-500">Teléfono</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ client.primaryPhone }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400 dark:text-gray-500">Tel. secundario</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ client.secondaryPhone ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400 dark:text-gray-500">Email</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ client.primaryEmail }}</dd>
            </div>
            <div>
              <dt class="text-xs text-gray-400 dark:text-gray-500">Email secundario</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ client.secondaryEmail ?? '—' }}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h3 class="text-sm font-semibold mb-2 text-gray-800 dark:text-white/90">
            Dirección
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ addrText }}</p>
        </div>
        <div v-if="client.legalRepresentativeName">
          <h3 class="text-sm font-semibold mb-2 text-gray-800 dark:text-white/90">
            Representante legal
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ client.legalRepresentativeName }}
            <span v-if="client.legalRepresentativePosition"> — {{ client.legalRepresentativePosition }}</span>
          </p>
        </div>
      </BaseCard>

      <BaseCard v-show="activeTab === 'proyectos'" padding="lg" class="block text-center">
        <AppIcon icon="lucide:folder-kanban" :size="40" class="mx-auto mb-3 opacity-40" />
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">
          Historial de proyectos
        </p>
        <p class="text-sm mt-1 text-gray-500 dark:text-gray-400">
          Aquí se listarán los proyectos vinculados a este cliente cuando el módulo de proyectos esté conectado.
        </p>
      </BaseCard>

      <BaseCard v-show="activeTab === 'presupuestos'" padding="lg" class="block text-center">
        <AppIcon icon="lucide:file-spreadsheet" :size="40" class="mx-auto mb-3 opacity-40" />
        <p class="text-sm font-medium text-gray-800 dark:text-white/90">
          Presupuestos del cliente
        </p>
        <p class="text-sm mt-1 mb-4 text-gray-500 dark:text-gray-400">
          Cada proyecto incluye su presupuesto en la pestaña correspondiente.
        </p>
        <BaseButton
          variant="outline"
          size="sm"
          @click="router.push(`${INTERIORISMO_BASE_PATH}/proyectos?clientId=${client.id}`)"
        >
          Ver proyectos
        </BaseButton>
      </BaseCard>

      <FormSectionCard
        v-show="activeTab === 'notas'"
        title="Notas internas del equipo"
        :subtitle="client.notes?.trim() || 'Sin notas. Puedes añadirlas desde Editar cliente.'"
      >

      </FormSectionCard>
    </template>
  </div>
</template>
