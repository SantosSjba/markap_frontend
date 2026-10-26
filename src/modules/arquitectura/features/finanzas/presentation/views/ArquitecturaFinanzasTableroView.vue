<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('arquitectura')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { toCalendarDateString, formatDateTime } from '@shared/utils/formatters'
import { ARQUITECTURA_BASE_PATH } from '../../../../config/routes.constants'
import type { ArquitecturaFinanceScheduleDto } from '../../domain/finance.types'
import {
  useArquitecturaFinanceOverview,
  useCreateFinanceSchedule,
  useUpdateFinanceSchedule,
  useDeleteFinanceSchedule,
  useCreateFinancePayment,
  useUpdateFinancePayment,
  useDeleteFinancePayment,
} from '../composables/useArquitecturaFinance'
import {
  SCHEDULE_KIND_LABELS,
  SCHEDULE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  COST_CATEGORY_FIN_LABELS,
  formatSol,
} from '../labels'
const props = withDefaults(
  defineProps<{
    /** Cuando se incrusta en el detalle de proyecto */
    projectId?: string
    embedded?: boolean
  }>(),
  { embedded: false },
)

const route = useRoute()
const router = useRouter()
const projectId = computed(
  () => props.projectId ?? String(route.params.id ?? route.params.projectId ?? ''),
)

const activeTab = ref('resumen')
const tabs = [
  { id: 'resumen', label: 'Resumen', icon: 'lucide:gauge' },
  { id: 'programacion', label: 'Adelantos y cuotas', icon: 'lucide:calendar-clock' },
  { id: 'pagos', label: 'Pagos', icon: 'lucide:banknote' },
  { id: 'egresos', label: 'Egresos', icon: 'lucide:arrow-down-circle' },
  { id: 'flujo', label: 'Flujo de caja', icon: 'lucide:waves' },
  { id: 'rentabilidad', label: 'Rentabilidad y utilidad', icon: 'lucide:percent' },
  { id: 'reportes', label: 'Reportes', icon: 'lucide:file-spreadsheet' },
]

const {
  data: ov,
  isLoading,
  isError,
  error: overviewError,
  refetch: refetchOverview,
} = useArquitecturaFinanceOverview(projectId)
const createSch = useCreateFinanceSchedule(projectId)
const updateSch = useUpdateFinanceSchedule(projectId)
const deleteSch = useDeleteFinanceSchedule(projectId)
const createPay = useCreateFinancePayment(projectId)
const updatePay = useUpdateFinancePayment(projectId)
const deletePay = useDeleteFinancePayment(projectId)

const goHub = () => router.push(`${ARQUITECTURA_BASE_PATH}/proyectos`)
const goProject = () => {
  const id = projectId.value
  if (id) router.push(`${ARQUITECTURA_BASE_PATH}/proyectos/${id}`)
}

const scheduleCols = [
  { key: 'kindLabel', label: 'Tipo', align: 'left' as const },
  { key: 'dueDate', label: 'Vencimiento', align: 'left' as const },
  { key: 'amount', label: 'Programado', align: 'left' as const },
  { key: 'paidToward', label: 'Pagado a cuenta', align: 'left' as const },
  { key: 'statusLabel', label: 'Estado', align: 'left' as const },
  { key: 'concept', label: 'Concepto', align: 'left' as const },
  { key: '_a', label: '', align: 'right' as const },
]

const paymentCols = [
  { key: 'paidAtLabel', label: 'Fecha', align: 'left' as const },
  { key: 'concept', label: 'Concepto', align: 'left' as const },
  { key: 'amount', label: 'Monto', align: 'left' as const },
  { key: 'statusLabel', label: 'Estado', align: 'left' as const },
  { key: 'cuota', label: 'Cuota', align: 'left' as const },
  { key: '_a', label: '', align: 'right' as const },
]

const expenseCols = [
  { key: 'occurredAt', label: 'Fecha', align: 'left' as const },
  { key: 'catLabel', label: 'Rubro', align: 'left' as const },
  { key: 'concept', label: 'Concepto', align: 'left' as const },
  { key: 'amount', label: 'Monto', align: 'left' as const },
]

const flowCols = [
  { key: 'month', label: 'Mes', align: 'left' as const },
  { key: 'inflow', label: 'Ingresos', align: 'left' as const },
  { key: 'outflow', label: 'Egresos', align: 'left' as const },
  { key: 'net', label: 'Neto', align: 'left' as const },
]

const movementCols = [
  { key: 'occurredLabel', label: 'Fecha', align: 'left' as const },
  { key: 'directionLabel', label: 'Tipo', align: 'left' as const },
  { key: 'concept', label: 'Detalle', align: 'left' as const },
  { key: 'amount', label: 'Monto', align: 'left' as const },
]

const kindOptions = Object.entries(SCHEDULE_KIND_LABELS).map(([value, label]) => ({ value, label }))
const payStatusOptions = Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))
const scheduleLinkOptions = computed(() => [
  { value: '', label: 'Sin vínculo a cuota' },
  ...(ov.value?.schedules ?? []).map((s) => ({
    value: s.id,
    label: `${SCHEDULE_KIND_LABELS[s.kind] ?? s.kind} · ${s.dueDate} · ${formatSol(s.amount)}`,
  })),
])

/** --- Modal programación (vee-validate) --- */
const schModal = ref(false)
const schEditId = ref<string | null>(null)

const schSchema = yup.object({
  kind: yup.string().required('Seleccione el tipo'),
  dueDate: yup.string().required('Indique la fecha'),
  amount: yup.number().typeError('Monto inválido').min(0.01, 'El monto debe ser mayor a cero'),
  concept: yup.string().required('El concepto es requerido').trim(),
  sortOrder: yup.number().typeError('Orden inválido').integer().min(0).optional(),
})

const schForm = useForm({
  validationSchema: toTypedSchema(schSchema),
  initialValues: {
    kind: 'INSTALLMENT',
    dueDate: '',
    amount: 0,
    concept: '',
    sortOrder: 0,
  },
})
const schBinds = {
  kind: schForm.defineComponentBinds('kind'),
  dueDate: schForm.defineComponentBinds('dueDate'),
  amount: schForm.defineComponentBinds('amount'),
  concept: schForm.defineComponentBinds('concept'),
  sortOrder: schForm.defineComponentBinds('sortOrder'),
}

function openCreateSchedule() {
  schEditId.value = null
  schForm.resetForm({
    values: {
      kind: 'INSTALLMENT',
      dueDate: toCalendarDateString(),
      amount: 0,
      concept: '',
      sortOrder: (ov.value?.schedules.length ?? 0) + 1,
    },
  })
  schModal.value = true
}

function openEditSchedule(row: ArquitecturaFinanceScheduleDto) {
  schEditId.value = row.id
  schForm.resetForm({
    values: {
      kind: row.kind,
      dueDate: row.dueDate,
      amount: row.amount,
      concept: row.concept,
      sortOrder: row.sortOrder,
    },
  })
  schModal.value = true
}

const onSubmitSchedule = schForm.handleSubmit(async (values) => {
  const amt = Number(values.amount)
  if (schEditId.value) {
    await updateSch.mutateAsync({
      scheduleId: schEditId.value,
      payload: {
        kind: values.kind,
        dueDate: values.dueDate,
        amount: amt,
        concept: values.concept,
        sortOrder: values.sortOrder ?? 0,
      },
    })
  } else {
    await createSch.mutateAsync({
      kind: values.kind,
      dueDate: values.dueDate,
      amount: amt,
      concept: values.concept,
      sortOrder: values.sortOrder ?? 0,
    })
  }
  schModal.value = false
})

/** --- Modal pago --- */
const payModal = ref(false)
const payEditId = ref<string | null>(null)

const paySchema = yup.object({
  paidAt: yup.string().required('Indique fecha y hora'),
  amount: yup.number().typeError('Monto inválido').min(0.01, 'El monto debe ser mayor a cero'),
  concept: yup.string().required('El concepto es requerido').trim(),
  status: yup.string().required('Seleccione el estado'),
  scheduleItemId: yup.string().trim(),
})

const payForm = useForm({
  validationSchema: toTypedSchema(paySchema),
  initialValues: {
    paidAt: '',
    amount: 0,
    concept: '',
    status: 'PAID',
    scheduleItemId: '',
  },
})
const payBinds = {
  paidAt: payForm.defineComponentBinds('paidAt'),
  amount: payForm.defineComponentBinds('amount'),
  concept: payForm.defineComponentBinds('concept'),
  status: payForm.defineComponentBinds('status'),
  scheduleItemId: payForm.defineComponentBinds('scheduleItemId'),
}

watch(payModal, (open) => {
  if (!open) payEditId.value = null
})

function openCreatePayment() {
  payEditId.value = null
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  payForm.resetForm({
    values: {
      paidAt: local,
      amount: 0,
      concept: '',
      status: 'PAID',
      scheduleItemId: '',
    },
  })
  payModal.value = true
}

function openEditPayment(row: {
  id: string
  paidAt: string
  amount: number
  concept: string
  status: string
  scheduleItemId: string | null
}) {
  payEditId.value = row.id
  const d = new Date(row.paidAt)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  payForm.resetForm({
    values: {
      paidAt: local,
      amount: row.amount,
      concept: row.concept,
      status: row.status,
      scheduleItemId: row.scheduleItemId ?? '',
    },
  })
  payModal.value = true
}

const onSubmitPayment = payForm.handleSubmit(async (values) => {
  const sid = values.scheduleItemId?.trim() ? values.scheduleItemId.trim() : null
  const iso = new Date(values.paidAt).toISOString()
  const amt = Number(values.amount)
  if (payEditId.value) {
    await updatePay.mutateAsync({
      paymentId: payEditId.value,
      payload: {
        paidAt: iso,
        amount: amt,
        concept: values.concept,
        status: values.status,
        scheduleItemId: sid,
      },
    })
  } else {
    await createPay.mutateAsync({
      paidAt: iso,
      amount: amt,
      concept: values.concept,
      status: values.status,
      scheduleItemId: sid,
    })
  }
  payModal.value = false
})

async function removeSchedule(row: ArquitecturaFinanceScheduleDto) {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar programación?',
    text: 'No elimina pagos ya registrados; solo la línea de cobranza programada.',
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await deleteSch.mutateAsync(row.id)
}

async function removePayment(id: string) {
  const ok = await markapAlert.confirmDanger({ title: '¿Eliminar pago?', confirmText: 'Eliminar' })
  if (!ok) return
  await deletePay.mutateAsync(id)
}

/** --- Modal estado cuota (WAIVED) --- */
const waiveModal = ref(false)
const waiveTarget = ref<ArquitecturaFinanceScheduleDto | null>(null)
const waiveSubmitting = ref(false)

async function openWaive(row: ArquitecturaFinanceScheduleDto) {
  waiveTarget.value = row
  waiveModal.value = true
}

async function confirmWaive() {
  const row = waiveTarget.value
  if (!row) return
  waiveSubmitting.value = true
  try {
    await updateSch.mutateAsync({
      scheduleId: row.id,
      payload: { status: 'WAIVED' },
    })
    waiveModal.value = false
    waiveTarget.value = null
  } finally {
    waiveSubmitting.value = false
  }
}

function cuotaLabel(scheduleId: string | null): string {
  if (!scheduleId || !ov.value) return '—'
  const s = ov.value.schedules.find((x) => x.id === scheduleId)
  return s ? `${SCHEDULE_KIND_LABELS[s.kind] ?? s.kind} · ${s.dueDate}` : '—'
}
</script>

<template>
  <div
    :class="embedded ? 'space-y-6' : 'px-3 space-y-6'"
  >
    <PageHeader
      v-if="!embedded"
      :title="ov?.projectName ?? '…'"
      eyebrow="Finanzas"
      back
      @back="goHub"
    >
      <template #subtitle>
        {{ ov?.projectCode }}
          <BaseButton @click="goProject" variant="link" class="ml-2">Ficha proyecto</BaseButton>
      </template>
    </PageHeader>

    <LoadingState v-if="isLoading" class="py-20" />

    <div v-else-if="isError || !ov" class="text-center py-16 space-y-3 text-sm text-gray-500 dark:text-gray-400">
      <p class="text-error-500 dark:text-error-400">{{ isError ? getApiErrorMessage(overviewError) : 'No se pudo cargar el panel financiero.' }}</p>
      <div class="flex flex-wrap justify-center gap-2">
        <BaseButton variant="outline" @click="() => refetchOverview()">Reintentar</BaseButton>
        <BaseButton variant="outline" @click="goHub">Volver</BaseButton>
      </div>
    </div>

    <template v-else-if="ov">
      <BaseCard padding="none" class="block overflow-hidden">
        <BaseTabs v-model="activeTab" :tabs="tabs" />
        <div class="p-5 space-y-6">
          <div v-show="activeTab === 'resumen'" class="space-y-6">
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatsCard title="Valor contrato (presup.)" :value="formatSol(ov.budgetReference?.grandTotal ?? null)">
                <template #icon><AppIcon icon="lucide:file-badge" :size="20" color="var(--color-primary)" /></template>
              </StatsCard>
              <StatsCard title="Cobrado confirmado" :value="formatSol(ov.incomeSummary.collectedConfirmed)">
                <template #icon><AppIcon icon="lucide:trending-up" :size="20" color="#16a34a" /></template>
              </StatsCard>
              <StatsCard title="Por cobrar (vs programado)" :value="formatSol(ov.incomeSummary.pendingFromClient)">
                <template #icon><AppIcon icon="lucide:clock" :size="20" color="#d97706" /></template>
              </StatsCard>
              <StatsCard title="Egresos ejecutados" :value="formatSol(ov.expenseSummary.totalOut)">
                <template #icon><AppIcon icon="lucide:trending-down" :size="20" color="#dc2626" /></template>
              </StatsCard>
            </div>
            <p class="text-sm text-gray-400 dark:text-gray-500">
              Presupuesto referencia:
              <template v-if="ov.budgetReference">
                {{ ov.budgetReference.code }} · v{{ ov.budgetReference.version }} · {{ ov.budgetReference.status }}
              </template>
              <template v-else>Sin presupuesto aprobado en sistema — los KPI usan cero como contrato.</template>
            </p>
            <div class="rounded-lg border p-4 text-sm space-y-2 border-gray-200 dark:border-gray-800">
              <p class="font-semibold text-gray-800 dark:text-white/90">Ingresos programados</p>
              <p class="text-gray-500 dark:text-gray-400">
                Adelantos: {{ formatSol(ov.incomeSummary.advancesScheduled) }} · Cuotas:
                {{ formatSol(ov.incomeSummary.installmentsScheduled) }} · Total programado:
                {{ formatSol(ov.incomeSummary.scheduledTotal) }}
              </p>
            </div>
          </div>

          <div v-show="activeTab === 'programacion'" class="space-y-4">
            <div class="flex justify-end">
              <BaseButton v-if="canWrite" variant="primary" size="sm" type="button" @click="openCreateSchedule">
                Nueva línea de cobro
              </BaseButton>
            </div>
            <DataTable
              empty-text="Sin adelantos ni cuotas programadas."
              :columns="scheduleCols"
              :data="
                ov.schedules.map((s) => ({
                  ...s,
                  kindLabel: SCHEDULE_KIND_LABELS[s.kind] ?? s.kind,
                  statusLabel: SCHEDULE_STATUS_LABELS[s.status] ?? s.status,
                  amount: formatSol(s.amount),
                  paidToward: formatSol(s.paidTowardSchedule),
                  concept: s.concept.length > 48 ? `${s.concept.slice(0, 48)}…` : s.concept,
                  _a: '',
                }))
              "
              row-key="id"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm">{{ (row as any).kindLabel }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).dueDate }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).amount }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).paidToward }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).statusLabel }}</td>
                <td class="py-2 px-3 text-sm max-w-[200px] truncate" :title="(row as any).concept">{{ (row as any).concept }}</td>
                <td class="py-2 px-3 text-right space-x-2 whitespace-nowrap">
                  <BaseButton v-if="canWrite" @click="openEditSchedule(row as ArquitecturaFinanceScheduleDto)" variant="link" class="text-xs">Editar</BaseButton>
                  <BaseButton v-if="(row as ArquitecturaFinanceScheduleDto).status !== 'WAIVED'" @click="openWaive(row as ArquitecturaFinanceScheduleDto)" variant="link" class="text-warning-600 dark:text-orange-400 text-xs">Condonar</BaseButton>
                  <BaseButton @click="removeSchedule(row as ArquitecturaFinanceScheduleDto)" variant="link" class="text-error-500 dark:text-error-400 text-xs">Quitar</BaseButton>
                </td>
              </template>
            </DataTable>
          </div>

          <div v-show="activeTab === 'pagos'" class="space-y-4">
            <div class="flex justify-end">
              <BaseButton v-if="canWrite" variant="primary" size="sm" type="button" @click="openCreatePayment">Registrar pago</BaseButton>
            </div>
            <DataTable
              empty-text="Sin pagos registrados."
              :columns="paymentCols"
              :data="
                ov.payments.map((p) => ({
                  ...p,
                  paidAtLabel: formatDateTime(p.paidAt),
                  amount: formatSol(p.amount),
                  statusLabel: PAYMENT_STATUS_LABELS[p.status] ?? p.status,
                  cuota: cuotaLabel(p.scheduleItemId),
                  _a: '',
                }))
              "
              row-key="id"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm">{{ (row as any).paidAtLabel }}</td>
                <td class="py-2 px-3 text-sm max-w-[220px] truncate">{{ (row as any).concept }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).amount }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).statusLabel }}</td>
                <td class="py-2 px-3 text-xs">{{ (row as any).cuota }}</td>
                <td class="py-2 px-3 text-right space-x-2">
                  <BaseButton v-if="canWrite" @click="openEditPayment(row as any)" variant="link" class="text-xs">Editar</BaseButton>
                  <BaseButton @click="removePayment((row as { id: string }).id)" variant="link" class="text-error-500 dark:text-error-400 text-xs">Quitar</BaseButton>
                </td>
              </template>
            </DataTable>
          </div>

          <div v-show="activeTab === 'egresos'" class="space-y-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Los montos provienen de <strong>costos reales</strong> registrados en la ejecución del proyecto (compras, mano de obra, transporte y gastos).
              Para alta y baja de ítems use el tablero de ejecución.
            </p>
            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                Compras / materiales: <strong>{{ formatSol(ov.expenseSummary.purchases) }}</strong>
              </div>
              <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                Mano de obra: <strong>{{ formatSol(ov.expenseSummary.labor) }}</strong>
              </div>
              <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                Transporte: <strong>{{ formatSol(ov.expenseSummary.transport) }}</strong>
              </div>
              <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                Otros gastos: <strong>{{ formatSol(ov.expenseSummary.otherExpenses) }}</strong>
              </div>
            </div>
            <DataTable
              empty-text="Sin egresos ejecutados registrados."
              :columns="expenseCols"
              :data="
                ov.expenseLines.map((e) => ({
                  ...e,
                  catLabel: COST_CATEGORY_FIN_LABELS[e.costCategory] ?? e.costCategory,
                  amount: formatSol(e.amount),
                }))
              "
              row-key="id"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm">{{ (row as any).occurredAt }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).catLabel }}</td>
                <td class="py-2 px-3 text-sm max-w-[280px] truncate">{{ (row as any).concept }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).amount }}</td>
              </template>
            </DataTable>
          </div>

          <div v-show="activeTab === 'flujo'" class="space-y-3">
            <DataTable
              empty-text="Sin movimientos aún."
              :columns="flowCols"
              :data="
                ov.cashFlowByMonth.map((r) => ({
                  ...r,
                  inflow: formatSol(r.inflow),
                  outflow: formatSol(r.outflow),
                  net: formatSol(r.net),
                }))
              "
              row-key="month"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm font-mono">{{ (row as any).month }}</td>
                <td class="py-2 px-3 text-sm text-success-700 dark:text-success-500">{{ (row as any).inflow }}</td>
                <td class="py-2 px-3 text-sm text-error-700 dark:text-error-400">{{ (row as any).outflow }}</td>
                <td class="py-2 px-3 text-sm font-medium">{{ (row as any).net }}</td>
              </template>
            </DataTable>
          </div>

          <div v-show="activeTab === 'rentabilidad'" class="space-y-6">
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <StatsCard title="Presupuesto − costos ejecutados" :value="formatSol(ov.profitability.budgetVsCosts)">
                <template #icon><AppIcon icon="lucide:scale" :size="20" color="var(--color-primary)" /></template>
              </StatsCard>
              <StatsCard title="Cobrado − costos ejecutados (utilidad operativa caja)" :value="formatSol(ov.profitability.collectedVsCosts)">
                <template #icon><AppIcon icon="lucide:piggy-bank" :size="20" color="#16a34a" /></template>
              </StatsCard>
              <StatsCard
                title="Margen sobre cobrado"
                :value="ov.profitability.marginOnCollectedPct != null ? `${ov.profitability.marginOnCollectedPct.toFixed(1)}%` : '—'"
              >
                <template #icon><AppIcon icon="lucide:percent" :size="20" color="#d97706" /></template>
              </StatsCard>
            </div>
            <ul class="text-sm space-y-2 list-disc pl-5 text-gray-500 dark:text-gray-400">
              <li>
                <strong>Rentabilidad vs contrato:</strong> compara el total del presupuesto de referencia con la suma de egresos reales.
              </li>
              <li>
                <strong>Utilidad con caja cobrada:</strong> ingresos efectivamente pagados por el cliente menos costos ya ejecutados (no incluye cuentas por cobrar pendientes).
              </li>
            </ul>
          </div>

          <div v-show="activeTab === 'reportes'" class="space-y-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Movimientos recientes consolidados (pagos confirmados y costos de obra). Use exportación desde su herramienta de BI o contabilidad si necesita CSV formal.
            </p>
            <DataTable
              empty-text="Sin movimientos."
              :columns="movementCols"
              :data="
                ov.recentMovements.map((m, i) => ({
                  ...m,
                  _rk: `${i}-${m.occurredAt}-${m.direction}-${m.amount}`,
                  occurredLabel: formatDateTime(m.occurredAt),
                  directionLabel: m.direction === 'IN' ? 'Ingreso' : 'Egreso',
                  amount: formatSol(m.amount),
                }))
              "
              row-key="_rk"
            >
              <template #row="{ row }">
                <td class="py-2 px-3 text-sm">{{ (row as any).occurredLabel }}</td>
                <td class="py-2 px-3">
                  <Badge :variant="(row as { direction: string }).direction === 'IN' ? 'success' : 'neutral'">{{
                    (row as any).directionLabel
                  }}</Badge>
                </td>
                <td class="py-2 px-3 text-sm max-w-[320px] truncate">{{ (row as any).concept }}</td>
                <td class="py-2 px-3 text-sm">{{ (row as any).amount }}</td>
              </template>
            </DataTable>
          </div>
        </div>
      </BaseCard>
    </template>

    <BaseModal v-model="schModal" :title="schEditId ? 'Editar programación' : 'Nueva programación de cobro'" size="lg">
      <form class="space-y-3" @submit.prevent="onSubmitSchedule">
        <FormSelect v-bind="schBinds.kind" label="Tipo" :options="kindOptions" />
        <FormInput v-bind="schBinds.dueDate" type="date" label="Fecha de vencimiento" />
        <FormInput v-bind="schBinds.amount" type="number" step="0.01" label="Monto programado (PEN)" />
        <FormTextarea v-bind="schBinds.concept" label="Concepto" :rows="2" />
        <FormInput v-bind="schBinds.sortOrder" type="number" label="Orden (opcional)" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" type="button" @click="schModal = false">Cancelar</BaseButton>
          <BaseButton v-if="canWrite" variant="primary" type="submit" :loading="createSch.isPending.value || updateSch.isPending.value">
            Guardar
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <BaseModal v-model="payModal" :title="payEditId ? 'Editar pago' : 'Registrar pago'" size="lg">
      <form class="space-y-3" @submit.prevent="onSubmitPayment">
        <FormInput v-bind="payBinds.paidAt" type="datetime-local" label="Fecha y hora de pago" />
        <FormInput v-bind="payBinds.amount" type="number" step="0.01" label="Monto (PEN)" />
        <FormInput v-bind="payBinds.concept" label="Concepto" />
        <FormSelect v-bind="payBinds.status" label="Estado" :options="payStatusOptions" />
        <FormSelect v-bind="payBinds.scheduleItemId" label="Vincular a cuota (opcional)" :options="scheduleLinkOptions" />
        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="outline" type="button" @click="payModal = false">Cancelar</BaseButton>
          <BaseButton v-if="canWrite" variant="primary" type="submit" :loading="createPay.isPending.value || updatePay.isPending.value">
            Guardar
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <BaseModal v-model="waiveModal" title="Condonar cuota" size="md">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Marcar como <strong>WAIVED</strong> detiene el seguimiento cobranza de esta línea. ¿Continuar?
      </p>
      <div class="flex justify-end gap-2 mt-6">
        <BaseButton variant="outline" type="button" @click="waiveModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" type="button" :loading="waiveSubmitting" @click="confirmWaive">Confirmar</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
