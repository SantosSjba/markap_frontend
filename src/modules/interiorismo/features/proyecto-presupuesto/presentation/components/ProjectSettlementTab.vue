<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/yup'
import * as yup from 'yup'
import {
  Badge,
  BaseButton,
  BaseModal,
  DataTable,
  FormInput,
  FormSectionCard,
  FormSelect,
  StatsCard,
  AppIcon,
  ActionsDropdown,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import type { InteriorProjectPaymentDto } from '@modules/interiorismo/features/proyectos/domain/project.types'
import {
  useCreateFinancePayment,
  useDeleteFinancePayment,
  useUpdateFinancePayment,
} from '@modules/interiorismo/features/finanzas/application/useInteriorFinance'
import { useProjectBudget, useProjectSettlement } from '../../application/useProjectBudget'
import { formatSol, PAYMENT_TYPE_LABELS, PAYMENT_TYPE_OPTIONS } from '../labels'

const props = defineProps<{
  projectId: string
  payments: InteriorProjectPaymentDto[]
}>()

const projectIdRef = toRef(props, 'projectId')
const { data: settlement, isLoading, isError } = useProjectSettlement(projectIdRef)
const { data: budget } = useProjectBudget(projectIdRef)

const createPay = useCreateFinancePayment(projectIdRef)
const updatePay = useUpdateFinancePayment(projectIdRef)
const deletePay = useDeleteFinancePayment(projectIdRef)

const paymentCols = [
  { key: 'paidAt', label: 'Fecha', align: 'left' as const },
  { key: 'concept', label: 'Concepto', align: 'left' as const },
  { key: 'type', label: 'Tipo', align: 'left' as const },
  { key: 'amount', label: 'Monto', align: 'left' as const },
  { key: 'status', label: 'Estado', align: 'left' as const },
  { key: 'actions', label: '', align: 'right' as const },
]

const paymentRows = computed(() =>
  props.payments.map((p) => ({
    ...p,
    paidAt: new Date(p.paidAt).toLocaleDateString('es-PE'),
    type: p.paymentType ?? 'OTHER',
    amount: formatSol(p.amount),
  })),
)

const STATUS_OPTIONS = [
  { value: 'PAID', label: 'Confirmado' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'CANCELLED', label: 'Anulado' },
]

const payModal = ref(false)
const payEditId = ref<string | null>(null)

const paySchema = yup.object({
  paidAt: yup.string().required('Indique fecha y hora'),
  amount: yup.number().typeError('Monto inválido').min(0.01, 'El monto debe ser mayor a cero'),
  concept: yup.string().required('El concepto es requerido').trim(),
  paymentType: yup.string().required('Seleccione el tipo'),
  status: yup.string().required('Seleccione el estado'),
})

const payForm = useForm({
  validationSchema: toTypedSchema(paySchema),
  initialValues: {
    paidAt: '',
    amount: 0,
    concept: '',
    paymentType: 'ABONO',
    status: 'PAID',
  },
})

const payBinds = {
  paidAt: payForm.defineComponentBinds('paidAt'),
  amount: payForm.defineComponentBinds('amount'),
  concept: payForm.defineComponentBinds('concept'),
  paymentType: payForm.defineComponentBinds('paymentType'),
  status: payForm.defineComponentBinds('status'),
}

watch(payModal, (open) => {
  if (!open) payEditId.value = null
})

function localDatetimeInput(iso: string): string {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function openCreatePayment() {
  payEditId.value = null
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  payForm.resetForm({
    values: {
      paidAt: local,
      amount: 0,
      concept: '',
      paymentType: 'ABONO',
      status: 'PAID',
    },
  })
  payModal.value = true
}

function openEditPayment(row: InteriorProjectPaymentDto) {
  payEditId.value = row.id
  payForm.resetForm({
    values: {
      paidAt: localDatetimeInput(row.paidAt),
      amount: row.amount,
      concept: row.concept,
      paymentType: row.paymentType ?? 'OTHER',
      status: row.status,
    },
  })
  payModal.value = true
}

const onSubmitPayment = payForm.handleSubmit(async (values) => {
  const iso = new Date(values.paidAt).toISOString()
  const payload = {
    paidAt: iso,
    amount: Number(values.amount),
    concept: values.concept.trim(),
    paymentType: values.paymentType,
    status: values.status,
  }
  if (payEditId.value) {
    await updatePay.mutateAsync({ paymentId: payEditId.value, payload })
  } else {
    await createPay.mutateAsync(payload)
  }
  payModal.value = false
})

async function removePayment(id: string) {
  const ok = await markapAlert.confirmDanger({ title: '¿Eliminar pago?', confirmText: 'Eliminar' })
  if (!ok) return
  await deletePay.mutateAsync(id)
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>
    <div v-else-if="isError || !settlement" class="text-center py-12 text-sm" :style="{ color: 'var(--color-text-muted)' }">
      No se pudo cargar la liquidación.
    </div>
    <template v-else>
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatsCard title="Presupuesto total" :value="formatSol(settlement.budgetTotal)">
          <template #icon><AppIcon icon="lucide:file-text" :size="20" color="var(--color-primary)" /></template>
        </StatsCard>
        <StatsCard title="Abonos a cuenta" :value="formatSol(settlement.depositsOnAccount)">
          <template #icon><AppIcon icon="lucide:wallet" :size="20" color="#2563eb" /></template>
        </StatsCard>
        <StatsCard title="Pendiente por cobrar" :value="formatSol(settlement.pendingToCollect)">
          <template #icon><AppIcon icon="lucide:clock" :size="20" color="#d97706" /></template>
        </StatsCard>
        <StatsCard title="Costo real (compras)" :value="formatSol(settlement.totalActualCost)">
          <template #icon><AppIcon icon="lucide:shopping-bag" :size="20" color="#16a34a" /></template>
        </StatsCard>
        <StatsCard title="Utilidad hito" :value="formatSol(settlement.milestoneUtility)">
          <template #icon><AppIcon icon="lucide:trending-up" :size="20" color="#7c3aed" /></template>
        </StatsCard>
        <StatsCard title="IGV total" :value="formatSol(settlement.igvTotal)">
          <template #icon><AppIcon icon="lucide:receipt" :size="20" color="#64748b" /></template>
        </StatsCard>
      </div>

      <FormSectionCard
        title="Resumen financiero"
        subtitle="Equivalente al bloque de liquidación del Excel"
        icon="lucide:pie-chart"
      >
        <dl class="grid sm:grid-cols-2 gap-4 text-sm">
          <div class="flex justify-between gap-4 p-3 rounded-lg" :style="{ background: 'var(--color-hover)' }">
            <dt :style="{ color: 'var(--color-text-secondary)' }">Total cobrado al cliente</dt>
            <dd class="font-semibold" :style="{ color: 'var(--color-text-primary)' }">
              {{ formatSol(settlement.totalClientPaid) }}
            </dd>
          </div>
          <div class="flex justify-between gap-4 p-3 rounded-lg" :style="{ background: 'var(--color-hover)' }">
            <dt :style="{ color: 'var(--color-text-secondary)' }">Abonos a proveedores</dt>
            <dd class="font-semibold" :style="{ color: 'var(--color-text-primary)' }">
              {{ formatSol(settlement.totalSupplierPayments) }}
            </dd>
          </div>
        </dl>
      </FormSectionCard>

      <FormSectionCard
        v-if="budget?.sections.length"
        title="Resumen por sección"
        subtitle="Totales de precio al cliente por zona del proyecto"
        icon="lucide:layers"
      >
        <dl class="divide-y" :style="{ borderColor: 'var(--color-border)' }">
          <div
            v-for="section in budget.sections"
            :key="section.id"
            class="flex justify-between gap-4 py-2.5 text-sm"
          >
            <dt :style="{ color: 'var(--color-text-secondary)' }">{{ section.name }}</dt>
            <dd class="font-medium tabular-nums" :style="{ color: 'var(--color-text-primary)' }">
              {{ formatSol(section.sectionTotal) }}
            </dd>
          </div>
        </dl>
      </FormSectionCard>

      <FormSectionCard
        title="Pagos del cliente"
        subtitle="Abonos a cuenta, saldo y pagos finales — alimentan la liquidación"
        icon="lucide:banknote"
      >
        <template #actions>
          <BaseButton variant="primary" size="sm" type="button" @click="openCreatePayment">
            Registrar pago
          </BaseButton>
        </template>

        <DataTable
          empty-text="Sin pagos registrados. Agrega el abono a cuenta del cliente."
          :columns="paymentCols"
          :data="paymentRows"
          row-key="id"
        >
          <template #row="{ row }">
            <td class="py-2 px-3 text-sm">{{ (row as InteriorProjectPaymentDto & { paidAt: string }).paidAt }}</td>
            <td class="py-2 px-3 text-sm max-w-[240px] truncate">{{ (row as InteriorProjectPaymentDto).concept }}</td>
            <td class="py-2 px-3">
              <Badge variant="neutral">
                {{ PAYMENT_TYPE_LABELS[(row as InteriorProjectPaymentDto).paymentType ?? 'OTHER'] ?? 'Otro' }}
              </Badge>
            </td>
            <td class="py-2 px-3 text-sm font-medium">{{ (row as { amount: string }).amount }}</td>
            <td class="py-2 px-3">
              <Badge :variant="(row as InteriorProjectPaymentDto).status === 'PAID' ? 'success' : 'warning'">
                {{ (row as InteriorProjectPaymentDto).status }}
              </Badge>
            </td>
            <td class="py-2 px-3 text-right">
              <ActionsDropdown
                :items="[
                  {
                    label: 'Editar',
                    icon: 'lucide:pencil',
                    onClick: () => openEditPayment(row as InteriorProjectPaymentDto),
                  },
                  {
                    label: 'Eliminar',
                    icon: 'lucide:trash-2',
                    danger: true,
                    onClick: () => removePayment((row as InteriorProjectPaymentDto).id),
                  },
                ]"
              />
            </td>
          </template>
        </DataTable>
      </FormSectionCard>
    </template>

    <BaseModal v-model="payModal" :title="payEditId ? 'Editar pago' : 'Registrar pago'" size="lg">
      <form class="space-y-3" @submit.prevent="onSubmitPayment">
        <FormInput v-bind="payBinds.paidAt" type="datetime-local" label="Fecha y hora de pago" />
        <div class="grid sm:grid-cols-2 gap-3">
          <FormInput v-bind="payBinds.amount" type="number" step="0.01" min="0.01" label="Monto (S/)" />
          <FormSelect v-bind="payBinds.paymentType" label="Tipo de pago" :options="PAYMENT_TYPE_OPTIONS" />
        </div>
        <FormInput v-bind="payBinds.concept" label="Concepto" placeholder="Ej. Transferencia — abono a cuenta" />
        <FormSelect v-bind="payBinds.status" label="Estado" :options="STATUS_OPTIONS" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="ghost" type="button" @click="payModal = false">Cancelar</BaseButton>
          <BaseButton variant="primary" type="submit" :loading="createPay.isPending.value || updatePay.isPending.value">
            {{ payEditId ? 'Guardar cambios' : 'Registrar' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
