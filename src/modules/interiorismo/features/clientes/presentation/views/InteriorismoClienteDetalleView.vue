<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatShortDate } from '@shared/utils/formatters'
import { formatMoney, splitCurrencyTotals, sumByCurrency } from '@shared/utils/money'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import {
  useInteriorClientPayments,
  useInteriorProjectsList,
} from '../../../proyectos/presentation/composables/useInteriorProjects'
import { useInteriorProjectStageOptions } from '../../../proyectos/presentation/composables/useInteriorProjectStageOptions'
import { PROJECT_TYPE_LABELS, projectStatusLabel } from '../../../proyectos/presentation/labels'
import type { ListInteriorProjectsParams } from '../../../proyectos/domain/project.types'
import { PAYMENT_TYPE_LABELS } from '../../../proyecto-presupuesto/presentation/labels'
import { useInteriorClient } from '../composables/useClients'
/**
 * Ficha del cliente: cifras clave, y pestañas sueltas Datos · Proyectos · Cobros
 * (cobros de todos sus proyectos, cada uno en su moneda).
 */

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { data: client, isLoading, isError, error, refetch } = useInteriorClient(id)

const projectsParams = computed<ListInteriorProjectsParams>(() => ({ clientId: id.value, page: 1, limit: 50 }))
const { data: projectsRes, isLoading: loadingProjects } = useInteriorProjectsList(projectsParams)
const projects = computed(() => projectsRes.value?.data ?? [])
const activeProjects = computed(() => projects.value.filter((p) => !['FINISHED', 'CANCELLED'].includes(p.status)))
const { stageLabelMap } = useInteriorProjectStageOptions()

const { data: payments, isLoading: loadingPayments } = useInteriorClientPayments(id)
const paid = computed(() =>
  splitCurrencyTotals(
    sumByCurrency((payments.value ?? []).filter((p) => p.status === 'PAID'), (p) => p.currency, (p) => p.amount),
  ),
)
const budgetByCurrency = computed(() =>
  splitCurrencyTotals(sumByCurrency(activeProjects.value, (p) => p.currency, (p) => p.estimatedBudget)),
)

const TABS = [
  { id: 'datos', label: 'Datos', icon: 'lucide:id-card' },
  { id: 'proyectos', label: 'Proyectos', icon: 'lucide:folder-kanban' },
  { id: 'cobros', label: 'Cobros', icon: 'lucide:wallet' },
] as const
type TabId = (typeof TABS)[number]['id']
const isTab = (t: unknown): t is TabId => TABS.some((x) => x.id === t)
const activeTab = ref<TabId>(isTab(route.query.tab) ? route.query.tab : 'datos')
watch(activeTab, (tab) => {
  if (route.query.tab !== tab) router.replace({ query: { ...route.query, tab } })
})

const location = computed(() => {
  const a = client.value?.primaryAddress
  if (!a) return '—'
  if (a.locationCustom) {
    const l = a.locationCustom
    return [l.district, l.province, l.department, l.country].filter(Boolean).join(', ')
  }
  const d = a.district
  return [d?.name, d?.province?.name, d?.province?.department?.name].filter(Boolean).join(', ')
})

const PAY_STATUS = {
  PAID: { label: 'Cobrado', variant: 'success' },
  PENDING: { label: 'Programado', variant: 'warning' },
  CANCELLED: { label: 'Anulado', variant: 'neutral' },
} as const
const payStatus = (s: string) => PAY_STATUS[s as keyof typeof PAY_STATUS] ?? { label: s, variant: 'neutral' as const }

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/clientes`)
const goEdit = () => router.push(`${INTERIORISMO_BASE_PATH}/clientes/${id.value}/editar`)
const goProject = (projectId: string, tab?: string) =>
  router.push({ path: `${INTERIORISMO_BASE_PATH}/proyectos/${projectId}`, query: tab ? { tab } : {} })
const goNewProject = () => router.push(`${INTERIORISMO_BASE_PATH}/proyectos/nuevo`)

const th = 'border-b border-gray-200 px-4 py-2.5 text-theme-xs font-medium uppercase tracking-wide whitespace-nowrap text-gray-500 dark:border-gray-800 dark:text-gray-400'
const td = 'border-b border-gray-100 px-4 py-3 text-sm dark:border-gray-800'
</script>

<template>
  <div>
    <PageHeader
      :title="client?.fullName ?? 'Cliente'"
      :subtitle="client ? `${client.documentType?.code ?? ''} ${client.documentNumber}` : 'Ficha del cliente'"
      back
      class="mb-6"
      @back="goBack"
    >
      <template #actions>
        <div v-if="client" class="flex shrink-0 flex-wrap items-center gap-2">
          <Badge :variant="client.clientType === 'CORPORATE' ? 'success' : 'info'">{{ client.clientType === 'CORPORATE' ? 'Corporativo' : 'Residencial' }}</Badge>
          <Badge :variant="client.isActive ? 'success' : 'neutral'">{{ client.isActive ? 'Activo' : 'Inactivo' }}</Badge>
          <BaseButton v-if="canWrite" variant="outline" size="sm" icon="lucide:folder-plus" @click="goNewProject">Nuevo proyecto</BaseButton>
          <BaseButton v-if="canWrite" variant="primary" size="sm" icon="lucide:pencil" @click="goEdit">Editar</BaseButton>
        </div>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading" text="Cargando cliente..." class="py-24" />
    <div v-else-if="isError || !client" class="flex flex-col items-center justify-center gap-3 py-16">
      <AppIcon icon="lucide:alert-circle" :size="40" color="var(--color-error)" />
      <p class="max-w-md text-center text-sm font-medium text-error-500 dark:text-error-400">
        {{ isError ? getApiErrorMessage(error) : 'No se encontró el cliente.' }}
      </p>
      <div class="flex gap-2">
        <BaseButton v-if="isError" variant="outline" size="sm" @click="() => refetch()">Reintentar</BaseButton>
        <BaseButton variant="outline" size="sm" @click="goBack">Volver al listado</BaseButton>
      </div>
    </div>

    <div v-else class="space-y-6">
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatsCard compact title="Proyectos" :value="String(projects.length)" :subtitle="`${activeProjects.length} activos`" :loading="loadingProjects">
          <template #icon><AppIcon icon="lucide:folder-kanban" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="Cartera activa" :value="budgetByCurrency.main" :subtitle="budgetByCurrency.rest || 'presupuesto estimado'" :loading="loadingProjects">
          <template #icon><AppIcon icon="lucide:banknote" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="Cobrado" :value="paid.main" :subtitle="paid.rest || 'en todos sus proyectos'" :loading="loadingPayments">
          <template #icon><AppIcon icon="lucide:wallet" :size="20" /></template>
        </StatsCard>
        <StatsCard compact title="Teléfono" :value="client.primaryPhone || '—'" :subtitle="client.primaryEmail ?? 'sin email'">
          <template #icon><AppIcon icon="lucide:phone" :size="20" /></template>
        </StatsCard>
      </div>

      <BaseTabs v-model="activeTab" :tabs="TABS" />

      <!-- Datos -->
      <div v-if="activeTab === 'datos'" class="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <div class="space-y-6 xl:col-span-2">
          <FormSectionCard title="Identificación y contacto" icon="lucide:id-card" show-icon>
            <dl class="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <div><dt class="text-theme-xs text-gray-400">Documento</dt><dd class="font-medium text-gray-800 dark:text-white/90">{{ client.documentType?.name }} · {{ client.documentNumber }}</dd></div>
              <div v-if="client.legalRepresentativeName">
                <dt class="text-theme-xs text-gray-400">Representante legal</dt>
                <dd class="text-gray-800 dark:text-white/90">{{ client.legalRepresentativeName }}<template v-if="client.legalRepresentativePosition"> · {{ client.legalRepresentativePosition }}</template></dd>
              </div>
              <div><dt class="text-theme-xs text-gray-400">Teléfonos</dt><dd class="text-gray-800 dark:text-white/90">{{ [client.primaryPhone, client.secondaryPhone].filter(Boolean).join(' · ') || '—' }}</dd></div>
              <div><dt class="text-theme-xs text-gray-400">Emails</dt><dd class="text-gray-800 dark:text-white/90">{{ [client.primaryEmail, client.secondaryEmail].filter(Boolean).join(' · ') || '—' }}</dd></div>
            </dl>
          </FormSectionCard>
          <FormSectionCard title="Dirección" icon="lucide:map-pin" show-icon>
            <p class="text-sm text-gray-800 dark:text-white/90">{{ client.primaryAddress?.addressLine ?? 'Sin dirección' }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ location }}</p>
            <p v-if="client.primaryAddress?.reference" class="mt-1 text-theme-xs text-gray-400">Ref.: {{ client.primaryAddress.reference }}</p>
          </FormSectionCard>
        </div>
        <FormSectionCard title="Notas" icon="lucide:sticky-note" show-icon>
          <p class="text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400">{{ client.notes || 'Sin notas.' }}</p>
        </FormSectionCard>
      </div>

      <!-- Proyectos -->
      <div v-else-if="activeTab === 'proyectos'" class="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <LoadingState v-if="loadingProjects" class="py-12" />
        <table v-else class="w-full min-w-max border-collapse">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th :class="[th, 'text-left']">Proyecto</th>
              <th :class="[th, 'text-left']">Etapa</th>
              <th :class="[th, 'text-right']">Presupuesto</th>
              <th :class="[th, 'text-left']">Avance</th>
              <th :class="[th, 'text-left']">Fechas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in projects" :key="p.id" class="cursor-pointer hover:bg-gray-50/60 dark:hover:bg-white/[0.02]" @click="goProject(p.id)">
              <td :class="td">
                <p class="font-medium text-gray-800 dark:text-white/90">{{ p.name }}</p>
                <p class="text-theme-xs text-gray-400">{{ p.code }} · {{ PROJECT_TYPE_LABELS[p.projectType] }}</p>
              </td>
              <td :class="td"><Badge variant="info">{{ projectStatusLabel(p.status, stageLabelMap) }}</Badge></td>
              <td :class="[td, 'text-right tabular-nums']">{{ formatMoney(p.estimatedBudget, p.currency) }}</td>
              <td :class="td">{{ Math.round(p.progressPct) }}%</td>
              <td :class="[td, 'whitespace-nowrap text-gray-500']">{{ p.startDate ? formatShortDate(p.startDate) : '—' }} – {{ p.estimatedEndDate ? formatShortDate(p.estimatedEndDate) : '—' }}</td>
            </tr>
            <tr v-if="!projects.length">
              <td colspan="5" class="px-4 py-12 text-center text-sm text-gray-400">
                Este cliente aún no tiene proyectos.
                <BaseButton v-if="canWrite" variant="link" size="sm" @click="goNewProject">Crear proyecto</BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cobros -->
      <div v-else class="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <LoadingState v-if="loadingPayments" class="py-12" />
        <table v-else class="w-full min-w-max border-collapse">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th :class="[th, 'text-left']">Fecha</th>
              <th :class="[th, 'text-left']">Concepto</th>
              <th :class="[th, 'text-left']">Proyecto</th>
              <th :class="[th, 'text-right']">Monto</th>
              <th :class="[th, 'text-left']">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payments ?? []" :key="p.id" class="cursor-pointer hover:bg-gray-50/60 dark:hover:bg-white/[0.02]" @click="goProject(p.project.id, 'liquidacion')">
              <td :class="[td, 'whitespace-nowrap text-gray-500']">{{ formatShortDate(p.paidAt) }}</td>
              <td :class="td">
                <p class="text-gray-800 dark:text-white/90">{{ p.concept }}</p>
                <p class="text-theme-xs text-gray-400">{{ PAYMENT_TYPE_LABELS[p.paymentType] ?? p.paymentType }}</p>
              </td>
              <td :class="[td, 'text-gray-500']">{{ p.project.code }}</td>
              <td :class="[td, 'text-right font-medium tabular-nums', p.status === 'CANCELLED' ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-white/90']">
                {{ formatMoney(p.amount, p.currency) }}
              </td>
              <td :class="td"><Badge :variant="payStatus(p.status).variant">{{ payStatus(p.status).label }}</Badge></td>
            </tr>
            <tr v-if="!(payments ?? []).length">
              <td colspan="5" class="px-4 py-12 text-center text-sm text-gray-400">Sin cobros registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
