<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
import { formatCurrency } from '@shared/utils/formatters'
import { useVentasAgentsList } from '../../../agentes/presentation/composables/useAgents'
import {
  useVentasClosingReadiness,
  useVentasCreateClosing,
  useVentasUploadClosingContract,
} from '../composables/useVentasSales'
import { PAYMENT_TYPE_OPTIONS } from '../../domain/pipeline.constants'
import type { SaleProcessDetail } from '../../domain/sales.types'
/**
 * ClosingFormModal — registra el cierre (venta ganada) de un proceso: el inmueble queda vendido,
 * el proceso pasa a «Ganado», su separación activa se cierra y las comisiones en % se recalculan
 * con el precio final. Exige el checklist legal completo (lo valida también el backend).
 */

const props = defineProps<{ process: SaleProcessDetail }>()

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ created: [] }>()

const router = useRouter()
const { canWrite } = useApplicationAccess('ventas')

const currency = computed(() => props.process.property.saleCurrency ?? 'PEN')
const hasProcessCommissions = computed(() => (props.process.commissions?.length ?? 0) > 0)

// Checklist legal / tributario: el cierre no procede sin él
const readinessParams = computed(() => ({
  propertyId: props.process.property.id,
  buyerClientId: props.process.buyer.id,
}))
const { data: readiness, isFetching: checkingReadiness, refetch: refetchReadiness } =
  useVentasClosingReadiness(readinessParams)
watch(open, (v) => v && void refetchReadiness())

const { data: agentsRes } = useVentasAgentsList(ref({ page: 1, limit: 50, isActive: true }))
const agentOptions = computed(() =>
  (agentsRes.value?.data ?? []).map((a) => ({ value: a.id, label: a.fullName })),
)

const finalPrice = ref<string | number>('')
const paymentType = ref('CASH')
const notes = ref('')
const commissionAgentId = ref('')
const commissionAmount = ref<string | number>('')
const contractFile = ref<File | null>(null)
const contractError = ref('')
const submitted = ref(false)

watch(
  open,
  (v) => {
    if (!v) return
    finalPrice.value = props.process.property.salePrice ?? ''
    paymentType.value = 'CASH'
    notes.value = ''
    commissionAgentId.value = props.process.agent?.id ?? ''
    commissionAmount.value = ''
    contractFile.value = null
    contractError.value = ''
    submitted.value = false
  },
  { immediate: true },
)

const priceNumber = computed(() => Number(finalPrice.value) || 0)
const priceDiff = computed(() => {
  const list = props.process.property.salePrice
  if (!list || priceNumber.value <= 0) return null
  return Math.round(((priceNumber.value - list) / list) * 1000) / 10
})

const errors = computed(() => {
  if (!submitted.value) return {} as Record<string, string>
  const e: Record<string, string> = {}
  if (priceNumber.value <= 0) e.price = 'Indique el precio final'
  if (!hasProcessCommissions.value) {
    if (!commissionAgentId.value) e.agent = 'Seleccione el asesor de la comisión'
    if (!(Number(commissionAmount.value) >= 0) || commissionAmount.value === '') e.commission = 'Indique el monto de la comisión'
  }
  return e
})

const { mutateAsync: createClosing, isPending } = useVentasCreateClosing()
const { mutateAsync: uploadContract, isPending: uploading } = useVentasUploadClosingContract()

async function submit() {
  submitted.value = true
  if (!contractFile.value) contractError.value = 'Adjunte el contrato de compraventa'
  if (Object.keys(errors.value).length || !contractFile.value || !readiness.value?.ok) return
  try {
    const created = await createClosing({
      propertyId: props.process.property.id,
      buyerClientId: props.process.buyer.id,
      saleProcessId: props.process.id,
      agentId: props.process.agent?.id ?? null,
      finalPrice: priceNumber.value,
      paymentType: paymentType.value,
      notes: notes.value.trim() || null,
      ...(hasProcessCommissions.value
        ? {}
        : { commissionAgentId: commissionAgentId.value, commissionAmount: Number(commissionAmount.value) }),
    })
    await uploadContract({ id: created.closingId, file: contractFile.value })
    emit('created')
    open.value = false
  } catch {
    // avisos en las mutaciones
  }
}

function goCompliance() {
  open.value = false
  void router.push({
    name: 'ventas-proceso-cumplimiento',
    params: { id: props.process.id },
    query: {
      propertyId: props.process.property.id,
      buyerClientId: props.process.buyer.id,
      propertyCode: props.process.property.code,
      buyerName: props.process.buyer.fullName,
      finalPrice: String(priceNumber.value || props.process.property.salePrice || 0),
      currency: currency.value,
    },
  })
}
</script>

<template>
  <BaseModal v-model="open" title="Registrar cierre de venta" size="lg" persistent>
    <form id="closing-form" class="space-y-5" novalidate @submit.prevent="submit">
      <!-- Operación -->
      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-white/3">
        <p class="flex items-center gap-2 font-medium text-gray-800 dark:text-white/90">
          <AppIcon icon="lucide:building-2" :size="16" color="var(--color-primary)" />
          {{ process.property.code }} · {{ process.property.addressLine }}
        </p>
        <p class="mt-1 flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <AppIcon icon="lucide:user" :size="16" color="var(--color-text-muted)" />
          {{ process.buyer.fullName }}<span v-if="(process.buyers?.length ?? 1) > 1" class="text-gray-400"> y {{ process.buyers!.length - 1 }} más</span>
        </p>
      </div>

      <!-- Cumplimiento legal -->
      <div
        v-if="!checkingReadiness && readiness && !readiness.ok"
        class="rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm dark:border-warning-500/30 dark:bg-warning-500/10"
      >
        <p class="flex items-center gap-2 font-semibold text-warning-700 dark:text-orange-400">
          <AppIcon icon="lucide:triangle-alert" :size="16" />Falta completar el checklist legal para cerrar
        </p>
        <ul class="mt-2 space-y-1 text-gray-700 dark:text-gray-300">
          <li v-for="m in readiness.missing" :key="m" class="flex items-start gap-2">
            <AppIcon icon="lucide:circle-dashed" :size="13" class="mt-0.5 shrink-0" />{{ m }}
          </li>
        </ul>
        <BaseButton type="button" variant="outline" size="sm" icon="lucide:clipboard-check" class="mt-3" @click="goCompliance">
          Completar cumplimiento
        </BaseButton>
      </div>
      <p v-else-if="readiness?.ok" class="flex items-center gap-2 text-sm text-success-600 dark:text-success-500">
        <AppIcon icon="lucide:circle-check" :size="16" />Checklist legal completo
      </p>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          v-model="finalPrice"
          type="number"
          min="0"
          step="0.01"
          :label="`Precio final (${currency})`"
          :error="errors.price"
          :hint="priceDiff !== null && priceDiff !== 0 ? `${priceDiff > 0 ? '+' : ''}${priceDiff} % sobre el precio de lista` : `Precio de lista: ${process.property.salePrice != null ? formatCurrency(process.property.salePrice, currency) : '—'}`"
          required
        />
        <FormSelect v-model="paymentType" label="Forma de pago" :options="[...PAYMENT_TYPE_OPTIONS]" required />
      </div>

      <!-- Comisiones -->
      <p v-if="hasProcessCommissions" class="flex items-start gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
        <AppIcon icon="lucide:percent" :size="14" class="mt-0.5 shrink-0" />
        Las comisiones del proceso se mantienen; las que son en % se recalculan con el precio final.
      </p>
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormSelect
          v-model="commissionAgentId"
          label="Asesor de la comisión"
          placeholder="Seleccionar"
          :options="agentOptions"
          :error="errors.agent"
          required
        />
        <FormInput
          v-model="commissionAmount"
          type="number"
          min="0"
          step="0.01"
          :label="`Comisión (${currency})`"
          :error="errors.commission"
          hint="El proceso no tiene comisiones definidas"
          required
        />
      </div>

      <FormTextarea v-model="notes" :rows="2" label="Notas" placeholder="Condiciones del cierre, fecha de firma..." />

      <FileDropzone
        v-model="contractFile"
        label="Contrato de compraventa"
        :multiple="false"
        required
        :error="contractError"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        hint="PDF o imagen del contrato firmado"
        @error="(m: string) => (contractError = m)"
      />
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <BaseButton variant="outline" type="button" @click="open = false">Cancelar</BaseButton>
        <BaseButton
          v-if="canWrite"
          type="submit"
          form="closing-form"
          variant="primary"
          icon="lucide:circle-check"
          :disabled="!readiness?.ok"
          :loading="isPending || uploading"
          loading-text="Registrando..."
        >
          Registrar cierre
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
