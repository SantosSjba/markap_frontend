<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('produccion')

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
import { useProduccionClient } from '../composables/useClients'
import {
  useProduccionQuotationsList,
  useProduccionOrdersList,
} from '../../../ventas/presentation/composables/useProduccionSales'
import {
  formatSol,
  formatDate,
  QUOTATION_STATUS_LABELS,
  quotationStatusClass,
  ORDER_STATUS_LABELS,
  orderStatusClass,
} from '../../../ventas/presentation/labels'
import { PRODUCCION_BASE_PATH } from '../../../../config/routes.constants'
import type { ClientDetail } from '../../domain/client.types'
const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id ?? ''))

const activeTab = ref<'datos' | 'cotizaciones' | 'pedidos' | 'notas'>('datos')

const { data: client, isLoading, isError } = useProduccionClient(id)

const salesListParams = computed(() => ({ page: 1, limit: 10, clientId: id.value }))
const { data: quotationsRes } = useProduccionQuotationsList(salesListParams)
const { data: ordersRes } = useProduccionOrdersList(salesListParams)

const clientQuotations = computed(() => quotationsRes.value?.data ?? [])
const clientOrders = computed(() => ordersRes.value?.data ?? [])

watch(isError, (e) => {
  if (e) void router.replace(`${PRODUCCION_BASE_PATH}/clientes`)
})

watch(
  client,
  (c) => {
    if (c && c.clientType !== 'RESIDENTIAL' && c.clientType !== 'CORPORATE') {
      void router.replace(`${PRODUCCION_BASE_PATH}/clientes`)
    }
  },
  { immediate: true },
)

const typeLabel = (c: ClientDetail | undefined) => {
  if (!c) return ''
  return c.clientType === 'RESIDENTIAL' ? 'Residencial' : 'Corporativo'
}

const goBack = () => router.push(`${PRODUCCION_BASE_PATH}/clientes`)
const goEdit = () => router.push(`${PRODUCCION_BASE_PATH}/clientes/${id.value}/editar`)

const addrText = computed(() => {
  const c = client.value
  if (!c?.primaryAddress) return 'Sin dirección registrada'
  const a = c.primaryAddress
  const d = a.district
  return `${a.addressLine} — ${d.name}, ${d.province.name}, ${d.province.department.name}`
})
</script>

<template>
  <div class="space-y-6">
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
        <BaseButton v-if="(client) && canWrite" variant="primary" size="sm" class="flex items-center gap-1.5" @click="goEdit">
        <AppIcon icon="lucide:pencil" :size="15" />
        Editar
      </BaseButton>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading" />

    <template v-else-if="client">
      <BaseTabs v-model="activeTab" :tabs="[ { id: 'datos' as const, label: 'Datos' }, { id: 'cotizaciones' as const, label: 'Cotizaciones' }, { id: 'pedidos' as const, label: 'Pedidos' }, { id: 'notas' as const, label: 'Notas internas' } ]" />

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

      <BaseCard v-show="activeTab === 'cotizaciones'" class="block space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Cotizaciones</h3>
          <BaseButton
            variant="outline"
            size="sm"
            @click="router.push(`${PRODUCCION_BASE_PATH}/ventas/cotizaciones?clientId=${client.id}`)"
          >
            Ver todas
          </BaseButton>
        </div>
        <p v-if="!clientQuotations.length" class="text-sm text-gray-500 dark:text-gray-400">
          Sin cotizaciones para este cliente.
        </p>
        <ul v-else class="divide-y border-gray-200 dark:border-gray-800">
          <li
            v-for="q in clientQuotations"
            :key="q.id"
            class="py-3 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:opacity-80"
            @click="router.push({ name: 'produccion-ventas-cotizacion-detalle', params: { id: q.id } })"
          >
            <span class="font-mono text-sm font-medium text-brand-500 dark:text-brand-400">{{ q.code }}</span>
            <span class="text-sm" :class="quotationStatusClass(q.status)">{{ QUOTATION_STATUS_LABELS[q.status] }}</span>
            <span class="text-sm">{{ formatDate(q.validUntil) }}</span>
            <span class="text-sm font-medium">{{ formatSol(q.totalAmount) }}</span>
          </li>
        </ul>
      </BaseCard>

      <BaseCard v-show="activeTab === 'pedidos'" class="block space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Pedidos</h3>
          <BaseButton
            variant="outline"
            size="sm"
            @click="router.push(`${PRODUCCION_BASE_PATH}/ventas/pedidos?clientId=${client.id}`)"
          >
            Ver todos
          </BaseButton>
        </div>
        <p v-if="!clientOrders.length" class="text-sm text-gray-500 dark:text-gray-400">
          Sin pedidos para este cliente.
        </p>
        <ul v-else class="divide-y border-gray-200 dark:border-gray-800">
          <li
            v-for="o in clientOrders"
            :key="o.id"
            class="py-3 flex flex-wrap items-center justify-between gap-2 cursor-pointer hover:opacity-80"
            @click="router.push({ name: 'produccion-ventas-pedido-detalle', params: { id: o.id } })"
          >
            <span class="font-mono text-sm font-medium text-brand-500 dark:text-brand-400">{{ o.code }}</span>
            <span class="text-sm" :class="orderStatusClass(o.status)">{{ ORDER_STATUS_LABELS[o.status] }}</span>
            <span class="text-sm">{{ formatDate(o.orderedAt) }}</span>
            <span class="text-sm font-medium">{{ formatSol(o.totalAmount) }}</span>
          </li>
        </ul>
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
