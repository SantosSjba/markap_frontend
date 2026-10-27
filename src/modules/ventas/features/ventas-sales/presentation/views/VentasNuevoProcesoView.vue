<script setup lang="ts">
import { useVentasCurrencyCatalog } from '../../../../presentation/composables/useVentasCurrencyCatalog'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('ventas')

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormCombobox from '@shared/presentation/components/forms/FormCombobox.vue'
import { useService } from '@shared/presentation/di/services'
import { fetchAllPages } from '@shared/utils/fetchAllPages'
import { formatCurrency } from '@shared/utils/formatters'
import { ventasClientsRepositoryKey } from '../../../clientes/application/ports/ventas-clients.port'
import { ventasClientKeys } from '../../../clientes/presentation/composables/useVentasClients'
import { ventasPropertiesRepositoryKey } from '../../../propiedades/application/ports/ventas-properties.port'
import {
  ventasPropertyKeys,
  useVentasPropertyById,
} from '../../../propiedades/presentation/composables/useVentasProperties'
import { useVentasAgentsList } from '../../../agentes/presentation/composables/useAgents'
import { useVentasPipelineStages } from '../../../ventas-configuracion/presentation/composables/useVentasConfig'
import { useVentasCreateProcess, useVentasFinancingChannels } from '../composables/useVentasSales'
import { navigateAfterVentasSave } from '../../../../presentation/navigation/navigateAfterVentasSave'
import {
  buildCommissionsPayload,
  commissionTotalsByCurrency,
  newCommissionDraft,
  type CommissionDraft,
} from '../../domain/commission-draft'
import { financingChannelOptions } from '../../domain/financing-channels'
import PropertyOwnersSection from '@modules/alquileres/features/propiedades/presentation/components/PropertyOwnersSection.vue'
import VentasClienteFormModal from '../../../clientes/presentation/components/VentasClienteFormModal.vue'
import ProcessCommissionsEditor from '../components/ProcessCommissionsEditor.vue'
import VentasPropiedadFormModal from '../../../propiedades/presentation/components/VentasPropiedadFormModal.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import SalePropertySummary from '../components/SalePropertySummary.vue'
import SaleParticipantList from '../components/SaleParticipantList.vue'
/**
 * Nuevo proceso de venta: inmueble (con su precio, moneda y propietarios), compradores,
 * datos del proceso y comisiones de asesores. Las comisiones en % toman la moneda del inmueble.
 */

const route = useRoute()
const router = useRouter()
const ventasClientsRepository = useService(ventasClientsRepositoryKey)
const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)

// ── Catálogos (todas las páginas: el backend topa cada página en 50 filas) ──
const buyersQuery = useQuery({
  queryKey: [...ventasClientKeys.root, 'process-buyer-options'],
  queryFn: () =>
    fetchAllPages((page, limit) => ventasClientsRepository.getList({ clientType: 'BUYER', page, limit })),
})
const propertiesQuery = useQuery({
  queryKey: [...ventasPropertyKeys.root, 'process-property-options'],
  queryFn: () =>
    fetchAllPages((page, limit) =>
      ventasPropertiesRepository.getList({ listingStatus: 'AVAILABLE', page, limit }),
    ),
})
const { data: agentsRes, isLoading: loadingAgents } = useVentasAgentsList(ref({ page: 1, limit: 50, isActive: true }))
const { options: currencyOptions } = useVentasCurrencyCatalog()
const { data: financingChannels, isLoading: loadingFinancing } = useVentasFinancingChannels()
const { stageOptions, labelFor: stageLabel } = useVentasPipelineStages()

const buyerOptions = computed(() =>
  (buyersQuery.data.value ?? []).map((c) => ({
    value: c.id,
    label: c.fullName,
    description: `${c.documentTypeCode} ${c.documentNumber}`,
  })),
)
const propertyOptions = computed(() =>
  (propertiesQuery.data.value ?? []).map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.addressLine}`,
    description: [p.propertyTypeName, p.districtName, p.salePrice != null ? formatCurrency(p.salePrice, p.saleCurrency) : null]
      .filter(Boolean)
      .join(' · '),
  })),
)
const agentOptions = computed(() =>
  (agentsRes.value?.data ?? []).map((a) => ({
    value: a.id,
    label: `${a.fullName} (${a.type === 'INTERNAL' ? 'Interno' : 'Externo'})`,
  })),
)
const financingOptions = computed(() => financingChannelOptions(financingChannels.value ?? []))

// ── Formulario ──
const propertyId = ref(typeof route.query.propertyId === 'string' ? route.query.propertyId : '')
const buyerIds = ref<string[]>([''])
const title = ref('')
const pipelineStage = ref('SEPARATION')
const financingChannelId = ref('')
const commissionRows = ref<CommissionDraft[]>([newCommissionDraft()])
const submitted = ref(false)
const commissionError = ref('')

// «Nuevo inmueble»: se registra en un modal y queda elegido si está disponible para la venta
const propertyModalOpen = ref(false)
async function onPropertyCreated(created: { id: string; code: string }) {
  await propertiesQuery.refetch()
  if (propertyOptions.value.some((o) => o.value === created.id)) {
    propertyId.value = created.id
  } else {
    void markapAlert.toast.warning(
      `${created.code} se registró, pero no está «Disponible», así que no puede iniciar un proceso.`,
    )
  }
}

// Inmueble elegido: precio, moneda y propietarios
const { data: property, isFetching: loadingProperty } = useVentasPropertyById(propertyId)
const propertyListItem = computed(() => (propertiesQuery.data.value ?? []).find((p) => p.id === propertyId.value))
const salePrice = computed(() => (propertyId.value ? (property.value?.salePrice ?? null) : null))
const propertyCurrency = computed(() => property.value?.saleCurrency ?? 'PEN')
const propertyOwners = computed(() =>
  propertyId.value
    ? (property.value?.owners ?? []).map((o) => ({ ...o, isPrimary: o.isPrimary }))
    : [],
)
const propertySummary = computed(() =>
  property.value && propertyId.value
    ? {
        ...property.value,
        propertyTypeName: propertyListItem.value?.propertyTypeName ?? null,
        locationLabel: propertyListItem.value?.districtName ?? null,
      }
    : null,
)

// Los montos fijos nuevos arrancan en la moneda del inmueble
watch(propertyCurrency, (cur) => {
  for (const row of commissionRows.value) if (!row.agentId && !row.value) row.currency = cur
})

const propertyError = computed(() => (submitted.value && !propertyId.value ? 'Seleccione el inmueble' : undefined))
const buyerError = computed(() =>
  submitted.value && !buyerIds.value.some(Boolean) ? 'Seleccione al menos un comprador' : undefined,
)

const selectedBuyers = computed(() =>
  buyerIds.value.filter(Boolean).map((id) => buyerOptions.value.find((b) => b.value === id)?.label ?? '—'),
)
const commissionTotals = computed(() =>
  commissionTotalsByCurrency(commissionRows.value, salePrice.value, propertyCurrency.value),
)

const { mutate: createProcess, isPending } = useVentasCreateProcess()

function goBack() {
  void router.push({ name: 'ventas-procesos' })
}

function submit() {
  submitted.value = true
  commissionError.value = ''
  const buyers = Array.from(new Set(buyerIds.value.filter(Boolean)))
  if (!propertyId.value || !buyers.length) return
  const commissions = buildCommissionsPayload(commissionRows.value, salePrice.value, propertyCurrency.value)
  if (!commissions.ok) {
    commissionError.value = commissions.error
    return
  }
  createProcess(
    {
      propertyId: propertyId.value,
      buyerClientId: buyers[0]!,
      buyerClientIds: buyers,
      agentId: commissions.payload[0]?.agentId ?? null,
      title: title.value.trim() || null,
      pipelineStage: pipelineStage.value,
      financingChannelId: financingChannelId.value || null,
      commissions: commissions.payload,
    },
    {
      onSuccess: async () => {
        await navigateAfterVentasSave(router, { listPath: '/ventas/procesos' })
      },
    },
  )
}
</script>

<template>
  <div>
    <PageHeader
      title="Nuevo Proceso de Venta"
      subtitle="Inmueble, compradores y comisiones de los asesores"
      back
      class="mb-6"
      @back="goBack"
    />

    <LoadingState v-if="propertiesQuery.isPending.value || buyersQuery.isPending.value" text="Cargando inmuebles y compradores..." class="py-24" />

    <form v-else class="grid grid-cols-1 items-start gap-6 xl:grid-cols-3" novalidate @submit.prevent="submit">
      <!-- ── Columna principal ── -->
      <div class="space-y-6 xl:col-span-2">
        <FormSectionCard title="Inmueble" subtitle="Solo inmuebles disponibles; el precio y la moneda vienen de su ficha">
          <div class="flex items-start gap-2">
            <FormCombobox
              v-model="propertyId"
              class="min-w-0 flex-1"
              label="Inmueble"
              placeholder="Buscar por código, dirección o distrito..."
              :options="propertyOptions"
              :error="propertyError"
              empty-text="No hay inmuebles disponibles con ese texto"
              required
            />
            <BaseButton
              v-if="canWrite"
              type="button"
              variant="outline"
              size="lg"
              icon="lucide:plus"
              class="mt-7 shrink-0"
              @click="propertyModalOpen = true"
            >
              Nuevo
            </BaseButton>
          </div>
          <p v-if="!propertyOptions.length" class="mt-2 text-theme-xs text-warning-600 dark:text-orange-400">
            No hay inmuebles disponibles. Registra uno con «Nuevo» o cambia su estado a «Disponible» en Propiedades.
          </p>
          <VentasPropiedadFormModal v-model:open="propertyModalOpen" @created="onPropertyCreated" />

          <template v-if="propertyId">
            <LoadingState v-if="loadingProperty && !propertySummary" class="py-8" />
            <div v-else-if="propertySummary" class="mt-5 space-y-5">
              <SalePropertySummary :property="propertySummary" />
              <div>
                <p class="mb-3 flex items-center gap-2 text-theme-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  <AppIcon icon="lucide:key-round" :size="14" />
                  Propietarios del inmueble
                </p>
                <SaleParticipantList
                  :people="propertyOwners"
                  empty-text="El inmueble no tiene propietarios registrados (edítalo en Propiedades)."
                />
              </div>
            </div>
          </template>
        </FormSectionCard>

        <PropertyOwnersSection
          v-model:owner-ids="buyerIds"
          :owner-options="buyerOptions"
          :error="buyerError"
          title="Compradores"
          subtitle="El primero es el comprador principal; agrega a los demás si compran en conjunto."
          primary-label="Comprador principal"
          secondary-label="Comprador"
          add-label="Agregar comprador"
          placeholder="Buscar comprador por nombre o documento..."
          searchable
        >
          <template #new-owner-modal="{ open, setOpen, onCreated }">
            <VentasClienteFormModal :open="open" client-type="BUYER" @update:open="setOpen" @created="onCreated" />
          </template>
        </PropertyOwnersSection>

        <FormSectionCard title="Datos del proceso" subtitle="Etapa de inicio y forma de pago">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormInput
              v-model="title"
              class="md:col-span-2"
              label="Título"
              placeholder="Ej. Familia Pérez — Torre Vista Mar (opcional)"
            />
            <FormSelect v-model="pipelineStage" label="Etapa inicial" :options="stageOptions" />
            <FormSelect
              v-model="financingChannelId"
              label="Banco o medio de pago"
              :options="financingOptions"
              :loading="loadingFinancing"
            />
          </div>
        </FormSectionCard>

        <FormSectionCard
          title="Comisiones de asesores"
          :subtitle="`En % sobre el precio (${propertyCurrency}) o monto fijo en cualquier moneda`"
        >
          <ProcessCommissionsEditor
            v-model="commissionRows"
            :sale-price="salePrice"
            :property-currency="propertyCurrency"
            :agent-options="agentOptions"
            :currency-options="currencyOptions"
            :can-write="canWrite"
          />
          <p v-if="loadingAgents" class="mt-2 text-theme-xs text-gray-400">Cargando asesores...</p>
          <p v-if="commissionError" role="alert" class="mt-3 text-sm text-error-500 dark:text-error-400">{{ commissionError }}</p>
        </FormSectionCard>
      </div>

      <!-- ── Lateral: resumen + acciones (fijo en escritorio) ── -->
      <aside class="space-y-6 xl:sticky xl:top-24">
        <FormSectionCard title="Resumen">
          <dl class="space-y-3 text-sm">
            <div>
              <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Inmueble</dt>
              <dd class="font-semibold text-gray-800 dark:text-white/90">{{ propertySummary?.code ?? '—' }}</dd>
              <dd v-if="propertySummary" class="text-theme-xs text-gray-500 dark:text-gray-400">{{ propertySummary.addressLine }}</dd>
            </div>
            <div>
              <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Precio de venta</dt>
              <dd class="font-bold text-brand-500 dark:text-brand-400">
                {{ salePrice != null ? formatCurrency(salePrice, propertyCurrency) : '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Compradores</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ selectedBuyers.length ? selectedBuyers.join(', ') : '—' }}</dd>
            </div>
            <div>
              <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Etapa inicial</dt>
              <dd class="text-gray-800 dark:text-white/90">{{ stageLabel(pipelineStage) }}</dd>
            </div>
            <div>
              <dt class="text-theme-xs text-gray-400 dark:text-gray-500">Comisiones (bruto)</dt>
              <dd v-if="!commissionTotals.length" class="text-gray-800 dark:text-white/90">—</dd>
              <dd v-for="t in commissionTotals" :key="t.currency" class="font-semibold tabular-nums text-gray-800 dark:text-white/90">
                {{ formatCurrency(t.amount, t.currency) }}
              </dd>
            </div>
          </dl>
        </FormSectionCard>

        <div class="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
          <BaseButton
            v-if="canWrite"
            type="submit"
            variant="primary"
            icon="lucide:save"
            block
            :loading="isPending"
            loading-text="Creando..."
          >
            Crear Proceso
          </BaseButton>
          <BaseButton variant="outline" type="button" block @click="goBack">Cancelar</BaseButton>
          <p class="text-center text-theme-xs text-gray-400 dark:text-gray-500">
            Los campos con <span class="text-error-500">*</span> son obligatorios
          </p>
        </div>
      </aside>
    </form>
  </div>
</template>
