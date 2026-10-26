<script setup lang="ts">
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { computed, ref, toRef } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useInteriorMaterialSuppliersList } from '../../../materiales/presentation/composables/useInteriorMaterialSuppliers'
import type {
  ProjectBudgetDetailDto,
  ProjectBudgetLineItemDto,
} from '../../domain/project-budget.types'
import {
  useCreateSupplierPayment,
  useDeleteSupplierPayment,
  useSyncBudgetFromExecution,
  useUpdateBudgetLineItem,
} from '../composables/useProjectBudget'
import { formatSol } from '../labels'
import { toCalendarDateString } from '@shared/utils/formatters'
const props = defineProps<{
  projectId: string
  budget: ProjectBudgetDetailDto
}>()

const projectIdRef = toRef(props, 'projectId')

const showPaymentModal = ref(false)
const paymentLine = ref<ProjectBudgetLineItemDto | null>(null)
const paymentDraft = ref({ paymentNumber: 1, amount: 0, paidAt: toCalendarDateString() })

const listParams = ref({ page: 1, limit: 200, search: '' })
const { data: suppliersData } = useInteriorMaterialSuppliersList(listParams)

const supplierOptions = computed(() => [
  { value: '', label: '— Sin vincular —' },
  ...(suppliersData.value?.data ?? []).map((s) => ({
    value: s.id,
    label: s.companyName,
  })),
])

const updateLine = useUpdateBudgetLineItem(projectIdRef)
const createPayment = useCreateSupplierPayment(projectIdRef)
const deletePayment = useDeleteSupplierPayment(projectIdRef)
const syncFromExecution = useSyncBudgetFromExecution(projectIdRef)

function openPaymentModal(item: ProjectBudgetLineItemDto) {
  paymentLine.value = item
  const nextNum = (item.supplierPayments?.length ?? 0) + 1
  paymentDraft.value = {
    paymentNumber: Math.min(nextNum, 3),
    amount: 0,
    paidAt: toCalendarDateString(),
  }
  showPaymentModal.value = true
}

async function submitPayment() {
  if (!paymentLine.value) return
  await createPayment.mutateAsync({
    lineItemId: paymentLine.value.id,
    paymentNumber: paymentDraft.value.paymentNumber,
    amount: Number(paymentDraft.value.amount) || 0,
    paidAt: paymentDraft.value.paidAt,
  })
  showPaymentModal.value = false
}

async function savePurchaseField(
  lineItemId: string,
  field: 'actualPurchaseCost' | 'supplierName' | 'supplierId',
  value: string | number | null,
) {
  await updateLine.mutateAsync({
    lineItemId,
    payload: { [field]: value },
  })
}

async function onSupplierChange(lineItemId: string, supplierId: string | null) {
  await updateLine.mutateAsync({
    lineItemId,
    payload: {
      supplierId: supplierId || null,
      ...(supplierId ? {} : { supplierName: null }),
    },
  })
}

async function onSyncFromExecution() {
  const ok = await markapAlert.confirm({
    title: 'Sincronizar desde ejecución',
    text: 'Se actualizará el costo real de las partidas cuya descripción coincida con conceptos de costos en Ejecución (material, gasto, transporte). ¿Continuar?',
    confirmText: 'Sincronizar',
  })
  if (!ok) return
  await syncFromExecution.mutateAsync()
}

async function onDeletePayment(paymentId: string) {
  const ok = await markapAlert.confirmDanger({
    title: 'Eliminar abono',
    text: '¿Eliminar este abono al proveedor?',
  })
  if (!ok) return
  await deletePayment.mutateAsync(paymentId)
}

const purchaseCols = [
  { key: 'description', label: 'Partida', align: 'left' as const },
  { key: 'budgetedCost', label: 'Costo presup.', align: 'left' as const },
  { key: 'actual', label: 'Costo real', align: 'left' as const },
  { key: 'emergency', label: 'Util. emerg.', align: 'left' as const },
  { key: 'supplier', label: 'Proveedor', align: 'left' as const },
  { key: 'abonos', label: 'Abonos', align: 'left' as const },
  { key: 'saldo', label: 'Saldo prov.', align: 'left' as const },
  { key: '_a', label: '', align: 'right' as const },
]

const allItems = () => props.budget.sections.flatMap((s) => s.lineItems)
const totalAbonos = () => allItems().reduce((s, i) => s + i.totalSupplierPayments, 0)
const totalSaldo = () => allItems().reduce((s, i) => s + (i.supplierBalance ?? 0), 0)
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard title="Costo real total" :value="formatSol(budget.totals.actualPurchaseCostTotal)">
        <template #icon><AppIcon icon="lucide:shopping-cart" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard title="Abonos a proveedores" :value="formatSol(totalAbonos())">
        <template #icon><AppIcon icon="lucide:hand-coins" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard title="Saldo proveedores" :value="formatSol(totalSaldo())">
        <template #icon><AppIcon icon="lucide:scale" :size="20" color="#d97706" /></template>
      </StatsCard>
      <StatsCard title="Partidas" :value="String(allItems().length)">
        <template #icon><AppIcon icon="lucide:list" :size="20" color="#16a34a" /></template>
      </StatsCard>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Gestión interna de compras: costo real, proveedor del catálogo y abonos (hasta 3 por partida).
      </p>
      <BaseButton
        size="sm"
        variant="outline"
        :loading="syncFromExecution.isPending.value"
        @click="onSyncFromExecution"
      >
        <AppIcon icon="lucide:refresh-cw" :size="16" class="mr-1" />
        Sync desde ejecución
      </BaseButton>
    </div>

    <FormSectionCard
      v-for="section in budget.sections"
      :key="section.id"
      :title="section.name"
      :subtitle="`${section.lineItems.length} partidas`"
      icon="lucide:package"
      dense
    >
      <DataTable
        empty-text="Sin partidas."
        :columns="purchaseCols"
        :data="section.lineItems"
        row-key="id"
      >
        <template #row="{ row }">
          <td class="py-2 px-3 text-sm max-w-[220px] truncate">{{ (row as any).description }}</td>
          <td class="py-2 px-3 text-sm">{{ formatSol((row as any).budgetedCost) }}</td>
          <td class="py-2 px-3 text-sm w-28">
            <FormInput type="number" min="0" step="0.01" :model-value="(row as any).actualPurchaseCost ?? ''" placeholder="0.00" @change="savePurchaseField((row as any).id, 'actualPurchaseCost', ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : null)" size="sm" />
          </td>
          <td class="py-2 px-3 text-sm">
            <Badge
              v-if="(row as any).emergencyUtilityAmount != null"
              :variant="(row as any).emergencyUtilityAmount >= 0 ? 'success' : 'warning'"
            >
              {{ formatSol((row as any).emergencyUtilityAmount) }}
            </Badge>
            <span v-else>—</span>
          </td>
          <td class="py-2 px-3 text-sm min-w-[160px]">
            <div class="space-y-1">
              <FormSelect
                :model-value="(row as any).supplierId ?? ''"
                :options="supplierOptions"
                size="sm"
                placeholder="Proveedor"
                @update:model-value="onSupplierChange((row as any).id, ($event as string | null) || null)"
              />
              <FormInput v-if="!(row as any).supplierId" :model-value="(row as any).supplierName ?? ''" placeholder="Nombre libre" @change="savePurchaseField((row as any).id, 'supplierName', ($event.target as HTMLInputElement).value || null)" size="sm" />
              <span
                v-else
                class="text-xs truncate block text-gray-400 dark:text-gray-500"
                :title="(row as any).supplierName ?? ''"
              >
                {{ (row as any).supplierName }}
              </span>
            </div>
          </td>
          <td class="py-2 px-3 text-sm">
            <div class="space-y-0.5">
              <div
                v-for="p in (row as any).supplierPayments"
                :key="p.id"
                class="flex items-center gap-2 text-xs"
              >
                <span>#{{ p.paymentNumber }}: {{ formatSol(p.amount) }}</span>
                <IconButton @click="onDeletePayment(p.id)" icon="lucide:x" label="Quitar" size="xs" />
              </div>
              <span class="text-gray-400 dark:text-gray-500" v-if="!(row as any).supplierPayments?.length">—</span>
            </div>
          </td>
          <td class="py-2 px-3 text-sm font-medium">
            <span
              :class="(row as any).supplierBalance > 0.01 ? 'text-warning-600 dark:text-orange-400' : ''"
            >
              {{ formatSol((row as any).supplierBalance) }}
            </span>
          </td>
          <td class="py-2 px-3 text-right">
            <BaseButton
              size="sm"
              variant="outline"
              :disabled="((row as any).supplierPayments?.length ?? 0) >= 3"
              @click="openPaymentModal(row as ProjectBudgetLineItemDto)"
            >
              Abono
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </FormSectionCard>

    <BaseModal v-model="showPaymentModal" title="Registrar abono al proveedor">
      <div v-if="paymentLine" class="space-y-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ paymentLine.description }}
        </p>
        <FormInput
          v-model.number="paymentDraft.paymentNumber"
          label="Número de abono (1–3)"
          type="number"
          min="1"
          max="3"
        />
        <FormInput v-model.number="paymentDraft.amount" label="Importe (S/)" type="number" min="0" step="0.01" />
        <FormInput v-model="paymentDraft.paidAt" label="Fecha" type="date" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" type="button" @click="showPaymentModal = false">Cancelar</BaseButton>
          <BaseButton variant="primary" type="button" :loading="createPayment.isPending.value" @click="submitPayment">
            Registrar
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
