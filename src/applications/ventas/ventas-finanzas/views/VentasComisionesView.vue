<script setup lang="ts">
import { computed, ref } from 'vue'
import * as yup from 'yup'
import {
  DataTable,
  BaseButton,
  FormSelect,
  FormInput,
  AppIcon,
  BasePagination,
  Badge,
} from '@shared/components'
import BaseModal from '@shared/components/ui/BaseModal.vue'
import { useForm, toTypedSchema } from '@shared/forms'
import { useVentasAgentsList } from '../../agentes/composables/useAgents'
import type { CommissionRow, CommissionProfileRow } from '../services/ventasFinanzas.service'
import {
  useVentasCommissionsList,
  useVentasCommissionProfiles,
  useVentasMarkCommissionPaid,
  useVentasRecalculateCommission,
  useVentasUpsertCommissionProfile,
} from '../composables/useVentasFinanzas'

const ITEMS = 12
const listParams = ref({ page: 1, limit: ITEMS, status: '' as string | undefined, agentId: '' as string | undefined })
const listApi = computed(() => ({
  page: listParams.value.page,
  limit: listParams.value.limit,
  status: listParams.value.status || undefined,
  agentId: listParams.value.agentId || undefined,
}))

const { data: listResult, isLoading } = useVentasCommissionsList(listApi)
const rows = computed(() => listResult.value?.data ?? [])
const total = computed(() => listResult.value?.total ?? 0)

const paginationProps = computed(() => {
  const page = listParams.value.page
  const limit = listParams.value.limit
  const totalPages = Math.max(1, Math.ceil(total.value / limit))
  return {
    currentPage: page,
    totalPages,
    totalItems: total.value,
    pageSize: limit,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
  }
})

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PAID', label: 'Pagado' },
]

const agentParams = ref({ page: 1, limit: 500, isActive: true })
const { data: agentsRes } = useVentasAgentsList(agentParams)
const agentFilterOptions = computed(() => [
  { value: '', label: 'Todos los asesores' },
  ...(agentsRes.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
])

const columns = [
  { key: 'prop', label: 'Inmueble', sortAccessor: (r: unknown) => (r as CommissionRow).closing.property.code },
  { key: 'buyer', label: 'Cliente', sortAccessor: (r: unknown) => (r as CommissionRow).closing.buyer.fullName },
  { key: 'agent', label: 'Asesor', sortAccessor: (r: unknown) => (r as CommissionRow).agent.fullName },
  { key: 'price', label: 'Precio cierre', sortAccessor: (r: unknown) => (r as CommissionRow).closing.finalPrice },
  { key: 'amt', label: 'Comisión', sortAccessor: (r: unknown) => (r as CommissionRow).amount },
  { key: 'pct', label: '%', sortAccessor: (r: unknown) => (r as CommissionRow).percentApplied ?? 0 },
  { key: 'st', label: 'Estado', sortAccessor: (r: unknown) => (r as CommissionRow).status },
  { key: 'act', label: '' },
]

const { data: profiles, isLoading: profilesLoading } = useVentasCommissionProfiles()
const profileRows = computed(() => (profiles.value ?? []) as CommissionProfileRow[])

const showProfileModal = ref(false)
const profileSchema = toTypedSchema(
  yup.object({
    agentId: yup.string().required('Seleccione el asesor'),
    commissionPercent: yup
      .number()
      .min(0, 'Mínimo 0')
      .max(100, 'Máximo 100')
      .required('Indique el porcentaje'),
  }),
)

const {
  handleSubmit: submitProfile,
  errors: profileErrors,
  defineComponentBinds,
  resetForm: resetProfileForm,
} = useForm({
  validationSchema: profileSchema,
  initialValues: { agentId: '', commissionPercent: 3 },
})

const profileBinds = {
  agentId: defineComponentBinds('agentId'),
  commissionPercent: defineComponentBinds('commissionPercent'),
}

const agentOptionsForProfile = computed(() =>
  (agentsRes.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
)

const { mutate: markPaid, isPending: marking } = useVentasMarkCommissionPaid()
const { mutate: recalc, isPending: recalcing } = useVentasRecalculateCommission()
const { mutate: saveProfile, isPending: savingProfile } = useVentasUpsertCommissionProfile()

function openProfileModal() {
  resetProfileForm()
  showProfileModal.value = true
}

const onSubmitProfile = submitProfile((values) => {
  saveProfile(
    { agentId: values.agentId, commissionPercent: values.commissionPercent },
    { onSuccess: () => (showProfileModal.value = false) },
  )
})
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Comisiones</h1>
      <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
        Comisión por cierre; marque pagos y configure el porcentaje por asesor para cálculo automático al cerrar.
      </p>
    </div>

    <section class="space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 class="text-lg font-semibold" :style="{ color: 'var(--color-text-primary)' }">
          Configuración por asesor (%)
        </h2>
        <BaseButton variant="secondary" class="flex items-center gap-2" @click="openProfileModal">
          <AppIcon icon="lucide:percent" :size="18" />
          Añadir o editar %
        </BaseButton>
      </div>
      <div
        class="rounded-xl border overflow-hidden"
        :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
      >
        <div v-if="profilesLoading" class="flex justify-center py-12">
          <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
        </div>
        <table v-else class="w-full text-sm">
          <thead>
            <tr class="border-b text-left" :style="{ borderColor: 'var(--color-border)' }">
              <th class="py-2 px-4">Asesor</th>
              <th class="py-2 px-4">% comisión</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in profileRows" :key="p.id" class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <td class="py-2 px-4">{{ p.agent.fullName }}</td>
              <td class="py-2 px-4">{{ p.commissionPercent }} %</td>
            </tr>
            <tr v-if="profileRows.length === 0">
              <td colspan="2" class="py-6 px-4 text-center opacity-70">Sin perfiles. Agregue un porcentaje para usar cálculo automático en cierres.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold" :style="{ color: 'var(--color-text-primary)' }">Listado de comisiones</h2>
      <div
        class="flex flex-wrap gap-3 items-end rounded-xl border p-4"
        :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
      >
        <div class="min-w-[140px]">
          <FormSelect v-model="listParams.status" label="Estado" :options="statusOptions" />
        </div>
        <div class="min-w-[220px] flex-1">
          <FormSelect v-model="listParams.agentId" label="Asesor" :options="agentFilterOptions" />
        </div>
      </div>

      <div
        class="rounded-xl border overflow-hidden"
        :style="{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
      >
        <div v-if="isLoading" class="flex justify-center py-16">
          <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
        </div>
        <DataTable v-else :columns="columns" :data="rows" row-key="id" empty-text="Sin comisiones.">
          <template #row="{ row }">
            <td class="py-3 px-4 text-sm">{{ (row as CommissionRow).closing.property.code }}</td>
            <td class="py-3 px-4">{{ (row as CommissionRow).closing.buyer.fullName }}</td>
            <td class="py-3 px-4 text-sm">{{ (row as CommissionRow).agent.fullName }}</td>
            <td class="py-3 px-4 text-sm">
              S/ {{ (row as CommissionRow).closing.finalPrice.toLocaleString('es-PE') }}
            </td>
            <td class="py-3 px-4 text-sm">
              S/ {{ (row as CommissionRow).amount.toLocaleString('es-PE') }}
            </td>
            <td class="py-3 px-4 text-sm">
              {{ (row as CommissionRow).percentApplied != null ? `${(row as CommissionRow).percentApplied}%` : '—' }}
            </td>
            <td class="py-3 px-4">
              <Badge :variant="(row as CommissionRow).status === 'PAID' ? 'success' : 'warning'">
                {{ (row as CommissionRow).status === 'PAID' ? 'Pagado' : 'Pendiente' }}
              </Badge>
            </td>
            <td class="py-3 px-4">
              <div class="flex flex-wrap gap-1">
                <BaseButton
                  v-if="(row as CommissionRow).status === 'PENDING'"
                  variant="secondary"
                  size="sm"
                  :disabled="recalcing"
                  @click="recalc((row as CommissionRow).id)"
                >
                  Recalcular
                </BaseButton>
                <BaseButton
                  v-if="(row as CommissionRow).status === 'PENDING'"
                  variant="primary"
                  size="sm"
                  :disabled="marking"
                  @click="markPaid((row as CommissionRow).id)"
                >
                  Pagar
                </BaseButton>
              </div>
            </td>
          </template>
        </DataTable>
        <div class="border-t p-2" :style="{ borderColor: 'var(--color-border)' }">
          <BasePagination
            v-bind="paginationProps"
            :show-page-size="true"
            @update:current-page="(p: number) => (listParams.page = p)"
            @update:page-size="(s: number) => { listParams.limit = s; listParams.page = 1 }"
          />
        </div>
      </div>
    </section>

    <BaseModal v-model="showProfileModal" title="Porcentaje de comisión del asesor" size="sm">
      <form class="space-y-4" @submit.prevent="onSubmitProfile">
        <FormSelect label="Asesor" v-bind="profileBinds.agentId" :options="agentOptionsForProfile" />
        <p v-if="profileErrors.agentId" class="text-sm text-red-600">{{ profileErrors.agentId }}</p>

        <FormInput label="Porcentaje (%)" type="number" step="0.01" v-bind="profileBinds.commissionPercent" />
        <p v-if="profileErrors.commissionPercent" class="text-sm text-red-600">
          {{ profileErrors.commissionPercent }}
        </p>

        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="showProfileModal = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :disabled="savingProfile">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
