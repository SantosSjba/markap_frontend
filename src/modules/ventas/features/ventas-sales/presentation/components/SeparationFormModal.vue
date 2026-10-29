<script setup lang="ts">
import { useCurrencyCatalog } from '@shared/presentation/composables/useCurrencyCatalog'
import { computed, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import FormCombobox from '@shared/presentation/components/forms/FormCombobox.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import OptionCardGroup from '@shared/presentation/components/forms/OptionCardGroup.vue'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import { useService } from '@shared/presentation/di/services'
import { fetchAllPages } from '@shared/utils/fetchAllPages'
import { formatCurrency, toCalendarDateString } from '@shared/utils/formatters'
import { ventasClientsRepositoryKey } from '../../../clientes/application/ports/ventas-clients.port'
import { ventasClientKeys } from '../../../clientes/presentation/composables/useVentasClients'
import { ventasPropertiesRepositoryKey } from '../../../propiedades/application/ports/ventas-properties.port'
import {
  ventasPropertyKeys,
} from '../../../propiedades/presentation/composables/useVentasProperties'
import { ventasSalesRepositoryKey } from '../../application/ports/ventas-sales.port'
import {
  ventasSalesKeys,
  useVentasCreateSeparation,
  useVentasUploadSeparationReceipt,
} from '../composables/useVentasSales'
/**
 * SeparationFormModal — registro de una separación (reserva con dinero). Desde un proceso de venta
 * el inmueble y el comprador salen del proceso; sin proceso se eligen a mano y el backend enlaza
 * el proceso activo de ese inmueble y comprador si existe. Al registrarse el inmueble pasa a «Separada».
 */

const props = withDefaults(
  defineProps<{
    /** Proceso desde el que se registra: queda fijo y no se muestra el modo «Sin proceso» */
    presetProcessId?: string
  }>(),
  { presetProcessId: undefined },
)
const lockedToProcess = computed(() => !!props.presetProcessId)

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ created: [id: string] }>()

const { canWrite } = useApplicationAccess('ventas')
const salesRepository = useService(ventasSalesRepositoryKey)
const clientsRepository = useService(ventasClientsRepositoryKey)
const propertiesRepository = useService(ventasPropertiesRepositoryKey)

// ── Catálogos (solo mientras el modal está abierto) ──
const processesQuery = useQuery({
  queryKey: [...ventasSalesKeys.root, 'separation-process-options'],
  queryFn: () =>
    fetchAllPages((page, limit) => salesRepository.listProcesses({ page, limit, status: 'ACTIVE' }), 100),
  enabled: open,
})
const propertiesQuery = useQuery({
  queryKey: [...ventasPropertyKeys.root, 'process-property-options'],
  queryFn: () =>
    fetchAllPages((page, limit) => propertiesRepository.getList({ listingStatus: 'AVAILABLE', page, limit })),
  enabled: open,
})
const buyersQuery = useQuery({
  queryKey: [...ventasClientKeys.root, 'process-buyer-options'],
  queryFn: () => fetchAllPages((page, limit) => clientsRepository.getList({ clientType: 'BUYER', page, limit })),
  enabled: open,
})
const { options: currencyOptions } = useCurrencyCatalog()

// ── Formulario ──
type Mode = 'process' | 'manual'
const mode = ref<Mode>('process')
const processId = ref('')
const propertyId = ref('')
const buyerId = ref('')
const amount = ref<string | number>('')
const currency = ref('PEN')
const separationDate = ref(toCalendarDateString())
const expiresAt = ref('')
const notes = ref('')
const receiptFile = ref<File | null>(null)
const receiptError = ref('')
const submitted = ref(false)

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + days)
  return toCalendarDateString(d)
}

function reset() {
  mode.value = 'process'
  processId.value = props.presetProcessId ?? ''
  propertyId.value = ''
  buyerId.value = ''
  amount.value = ''
  separationDate.value = toCalendarDateString()
  expiresAt.value = addDays(separationDate.value, 15)
  notes.value = ''
  receiptFile.value = null
  receiptError.value = ''
  submitted.value = false
}
watch(open, (v) => v && reset(), { immediate: true })

/** Procesos activos cuyo inmueble sigue disponible (si está separado, ya tiene una separación) */
const availableProcesses = computed(() =>
  (processesQuery.data.value ?? []).filter((p) => (p.property.listingStatus ?? 'AVAILABLE') === 'AVAILABLE'),
)
const processOptions = computed(() =>
  availableProcesses.value.map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.buyer.fullName}`,
    description: `${p.property.code} · ${p.property.addressLine}`,
  })),
)
const selectedProcess = computed(() => availableProcesses.value.find((p) => p.id === processId.value))
const processBuyerOptions = computed(() => {
  const p = selectedProcess.value
  if (!p) return []
  const list = p.buyers?.length ? p.buyers : [p.buyer]
  return list.map((b) => ({ value: b.id, label: b.fullName }))
})

const propertyOptions = computed(() =>
  (propertiesQuery.data.value ?? []).map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.addressLine}`,
    description: [p.propertyTypeName, p.salePrice != null ? formatCurrency(p.salePrice, p.saleCurrency) : null]
      .filter(Boolean)
      .join(' · '),
  })),
)
const buyerOptions = computed(() =>
  (buyersQuery.data.value ?? []).map((c) => ({
    value: c.id,
    label: c.fullName,
    description: `${c.documentTypeCode} ${c.documentNumber}`,
  })),
)

// Inmueble efectivo según el modo (precio y moneda para sugerir la moneda y mostrar el %)
const effectiveProperty = computed(() => {
  if (mode.value === 'process') {
    const p = selectedProcess.value?.property
    return p ? { id: p.id, code: p.code, salePrice: p.salePrice ?? null, saleCurrency: p.saleCurrency ?? 'PEN' } : null
  }
  const p = (propertiesQuery.data.value ?? []).find((x) => x.id === propertyId.value)
  return p ? { id: p.id, code: p.code, salePrice: p.salePrice, saleCurrency: p.saleCurrency ?? 'PEN' } : null
})

// Al elegir el proceso: comprador principal y moneda del inmueble
watch(selectedProcess, (p) => {
  buyerId.value = p ? (processBuyerOptions.value[0]?.value ?? '') : ''
})
watch(effectiveProperty, (p) => {
  if (p) currency.value = p.saleCurrency
})
/** Cambio de modo hecho por el usuario: se empieza de cero (no en `reset`, que precarga el proceso) */
function setMode(next: Mode) {
  if (next === mode.value) return
  mode.value = next
  processId.value = ''
  propertyId.value = ''
  buyerId.value = ''
}

const amountNumber = computed(() => {
  const n = Number(amount.value)
  return Number.isFinite(n) ? n : 0
})
/** % del precio, solo si la separación va en la moneda del inmueble */
const percentOfPrice = computed(() => {
  const p = effectiveProperty.value
  if (!p?.salePrice || currency.value !== p.saleCurrency || amountNumber.value <= 0) return null
  return Math.round((amountNumber.value / p.salePrice) * 1000) / 10
})

const errors = computed(() => {
  if (!submitted.value) return {} as Record<string, string>
  const e: Record<string, string> = {}
  if (mode.value === 'process' && !processId.value) e.process = 'Seleccione el proceso de venta'
  if (mode.value === 'manual' && !propertyId.value) e.property = 'Seleccione el inmueble'
  if (!buyerId.value) e.buyer = 'Seleccione el comprador'
  if (amountNumber.value <= 0) e.amount = 'Indique un monto mayor que cero'
  if (!separationDate.value) e.date = 'Indique la fecha'
  if (expiresAt.value && separationDate.value && expiresAt.value < separationDate.value) {
    e.expires = 'Debe ser posterior a la fecha de separación'
  }
  return e
})

const { mutateAsync: createSeparation, isPending } = useVentasCreateSeparation()
const { mutateAsync: uploadReceipt, isPending: uploading } = useVentasUploadSeparationReceipt()

async function submit() {
  submitted.value = true
  if (!receiptFile.value) receiptError.value = 'Adjunte el comprobante de la separación'
  if (Object.keys(errors.value).length || !receiptFile.value || !effectiveProperty.value) return
  try {
    const created = await createSeparation({
      propertyId: effectiveProperty.value.id,
      buyerClientId: buyerId.value,
      saleProcessId: mode.value === 'process' ? processId.value : null,
      amount: amountNumber.value,
      currency: currency.value,
      separationDate: separationDate.value,
      expiresAt: expiresAt.value || null,
      notes: notes.value.trim() || null,
    })
    await uploadReceipt({ id: created.id, file: receiptFile.value })
    emit('created', created.id)
    open.value = false
  } catch {
    // los avisos los muestran las mutaciones
  }
}

const loadingCatalogs = computed(
  () => processesQuery.isPending.value || propertiesQuery.isPending.value || buyersQuery.isPending.value,
)
</script>

<template>
  <BaseModal v-model="open" title="Nueva separación" size="xl" persistent>
    <form id="separation-form" class="space-y-5" novalidate @submit.prevent="submit">
      <OptionCardGroup
        v-if="!lockedToProcess"
        :model-value="mode"
        :options="[
          { value: 'process', label: 'Desde un proceso de venta', description: 'Inmueble y comprador del proceso', icon: 'lucide:git-branch' },
          { value: 'manual', label: 'Sin proceso', description: 'Elegir inmueble y comprador', icon: 'lucide:bookmark-plus' },
        ]"
        @update:model-value="setMode($event as Mode)"
      />

      <!-- Origen -->
      <div v-if="mode === 'process'" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormCombobox
          v-if="!lockedToProcess"
          v-model="processId"
          class="sm:col-span-2"
          label="Proceso de venta"
          placeholder="Buscar por código, comprador o inmueble..."
          :options="processOptions"
          :loading="loadingCatalogs"
          :error="errors.process"
          empty-text="No hay procesos activos con el inmueble disponible"
          required
        />
        <template v-if="selectedProcess">
          <div class="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:col-span-2 dark:border-gray-800 dark:bg-white/3">
            <AppIcon icon="lucide:building-2" :size="18" class="mt-0.5 shrink-0" color="var(--color-primary)" />
            <div class="min-w-0 flex-1 text-sm">
              <p v-if="lockedToProcess" class="text-theme-xs font-medium text-brand-500 dark:text-brand-400">{{ selectedProcess.code }}</p>
              <p class="font-medium text-gray-800 dark:text-white/90">{{ selectedProcess.property.code }}</p>
              <p class="text-theme-xs text-gray-500 dark:text-gray-400">{{ selectedProcess.property.addressLine }}</p>
            </div>
            <p class="shrink-0 text-sm font-semibold tabular-nums text-brand-500 dark:text-brand-400">
              {{ selectedProcess.property.salePrice != null ? formatCurrency(selectedProcess.property.salePrice, selectedProcess.property.saleCurrency ?? 'PEN') : 'Sin precio' }}
            </p>
          </div>
          <FormSelect
            v-model="buyerId"
            class="sm:col-span-2"
            label="Comprador que separa"
            :options="processBuyerOptions"
            :error="errors.buyer"
            required
          />
        </template>
      </div>
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormCombobox
          v-model="propertyId"
          label="Inmueble disponible"
          placeholder="Buscar por código o dirección..."
          :options="propertyOptions"
          :loading="loadingCatalogs"
          :error="errors.property"
          required
        />
        <FormCombobox
          v-model="buyerId"
          label="Comprador"
          placeholder="Buscar por nombre o documento..."
          :options="buyerOptions"
          :loading="loadingCatalogs"
          :error="errors.buyer"
          required
        />
        <p class="flex items-start gap-1.5 text-theme-xs text-gray-500 sm:col-span-2 dark:text-gray-400">
          <AppIcon icon="lucide:link" :size="13" class="mt-0.5 shrink-0" />
          Si existe un proceso activo de ese comprador sobre el inmueble, la separación se vincula automáticamente.
        </p>
      </div>

      <!-- Monto y fechas -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-6">
        <FormInput
          v-model="amount"
          class="sm:col-span-3"
          type="number"
          min="0"
          step="0.01"
          label="Monto de la separación"
          placeholder="5000"
          :error="errors.amount"
          :hint="percentOfPrice !== null ? `${percentOfPrice} % del precio de venta` : undefined"
          required
        />
        <FormSelect v-model="currency" class="sm:col-span-3" label="Moneda" :options="currencyOptions" required />
        <FormInput v-model="separationDate" class="sm:col-span-3" type="date" label="Fecha de separación" :error="errors.date" required />
        <FormInput
          v-model="expiresAt"
          class="sm:col-span-3"
          type="date"
          label="Vence el"
          :error="errors.expires"
          hint="Fecha límite para formalizar la compra (opcional)"
        />
        <FormTextarea v-model="notes" class="sm:col-span-6" :rows="2" label="Notas" placeholder="Condiciones acordadas, medio de pago..." />
      </div>

      <FileDropzone
        v-model="receiptFile"
        label="Comprobante de la separación"
        :multiple="false"
        required
        :error="receiptError"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        hint="PDF o imagen del voucher / transferencia"
        @error="(m: string) => (receiptError = m)"
      />

      <p class="flex items-start gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
        <AppIcon icon="lucide:info" :size="13" class="mt-0.5 shrink-0" />
        Al registrarla, el inmueble pasa a «Separada» y deja de estar disponible para otros procesos.
      </p>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="open = false">Cancelar</BaseButton>
        <BaseButton
          v-if="canWrite"
          type="submit"
          form="separation-form"
          variant="primary"
          icon="lucide:save"
          :loading="isPending || uploading"
          loading-text="Guardando..."
        >
          Registrar separación
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
