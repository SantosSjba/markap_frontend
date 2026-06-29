<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, BaseModal, DataTable, FormInput, FormTextarea, AppIcon } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import {
  useProduccionPurchaseOrderDetail,
  usePurchaseOrderMutations,
} from '../../application/useProduccionPurchases'
import { formatSol, formatDate, PO_STATUS_LABELS, poStatusClass } from '../labels'
import { formatQty } from '../../../inventario/presentation/labels'
import type { ProduccionPurchaseOrderLine } from '../../domain/purchases.types'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { data: order, isLoading, refetch } = useProduccionPurchaseOrderDetail(id)
const { send, receive, cancel, remove } = usePurchaseOrderMutations()

const showReceiveModal = ref(false)
const receiveQtys = ref<Record<string, number>>({})
const receiveNotes = ref('')
const receiving = ref(false)

watch(order, (o) => {
  if (!o) return
  const map: Record<string, number> = {}
  for (const l of o.lines) {
    if (l.quantityPending > 0) map[l.id] = l.quantityPending
  }
  receiveQtys.value = map
}, { immediate: true })

const lineColumns = [
  { key: 'material', label: 'Material', align: 'left' as const },
  { key: 'ordered', label: 'Ordenado', align: 'left' as const },
  { key: 'received', label: 'Recibido', align: 'left' as const },
  { key: 'pending', label: 'Pendiente', align: 'left' as const },
  { key: 'unitPrice', label: 'P. unit.', align: 'left' as const },
  { key: 'total', label: 'Total', align: 'left' as const },
]

const canSend = computed(() => order.value?.status === 'DRAFT')
const canReceive = computed(() => ['SENT', 'PARTIAL'].includes(order.value?.status ?? ''))
const canCancel = computed(() => ['DRAFT', 'SENT'].includes(order.value?.status ?? ''))
const canDelete = computed(() => order.value?.status === 'DRAFT')

const pendingLines = computed(() =>
  (order.value?.lines ?? []).filter((l) => l.quantityPending > 0),
)

async function doSend() {
  const ok = await markapAlert.confirm({
    title: '¿Enviar orden al proveedor?',
    text: 'La orden pasará a estado Enviada y no podrá editarse.',
    confirmText: 'Enviar',
  })
  if (!ok) return
  await send.mutateAsync(id.value)
  void refetch()
}

async function doCancel() {
  const ok = await markapAlert.confirmDanger({
    title: '¿Cancelar orden?',
    confirmText: 'Cancelar orden',
  })
  if (!ok) return
  await cancel.mutateAsync(id.value)
  void refetch()
}

async function doDelete() {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar borrador?',
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await remove.mutateAsync(id.value)
  void router.push({ name: 'produccion-compras-ordenes-compra' })
}

async function doReceive() {
  const lines = pendingLines.value
    .filter((l) => (receiveQtys.value[l.id] ?? 0) > 0)
    .map((l) => ({ lineId: l.id, quantity: Number(receiveQtys.value[l.id]) }))
  if (!lines.length) return

  receiving.value = true
  try {
    await receive.mutateAsync({
      id: id.value,
      payload: { lines, notes: receiveNotes.value.trim() || null },
    })
    showReceiveModal.value = false
    void refetch()
  } finally {
    receiving.value = false
  }
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <BaseButton variant="ghost" @click="router.push({ name: 'produccion-compras-ordenes-compra' })">
        <AppIcon icon="lucide:arrow-left" :size="18" class="mr-1" />
        Volver
      </BaseButton>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-bold font-mono" :style="{ color: 'var(--color-text-primary)' }">
          {{ order?.code ?? 'Orden de compra' }}
        </h1>
        <p v-if="order" class="text-sm mt-0.5" :class="poStatusClass(order.status)">
          {{ PO_STATUS_LABELS[order.status] }} · {{ order.supplierName }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton v-if="canSend" variant="primary" @click="doSend">Enviar</BaseButton>
        <BaseButton v-if="canReceive" variant="primary" @click="showReceiveModal = true">Registrar recepción</BaseButton>
        <BaseButton v-if="canCancel" variant="secondary" @click="doCancel">Cancelar</BaseButton>
        <BaseButton v-if="canDelete" variant="danger" @click="doDelete">Eliminar</BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">Cargando…</div>

    <template v-else-if="order">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div class="rounded-lg border p-3" :style="{ borderColor: 'var(--color-border)' }">
          <div :style="{ color: 'var(--color-text-secondary)' }">Proveedor</div>
          <div class="font-medium">{{ order.supplierName }}</div>
          <div class="text-xs font-mono">{{ order.supplierRuc }}</div>
        </div>
        <div class="rounded-lg border p-3" :style="{ borderColor: 'var(--color-border)' }">
          <div :style="{ color: 'var(--color-text-secondary)' }">Fecha orden</div>
          <div class="font-medium">{{ formatDate(order.orderedAt) }}</div>
        </div>
        <div class="rounded-lg border p-3" :style="{ borderColor: 'var(--color-border)' }">
          <div :style="{ color: 'var(--color-text-secondary)' }">Entrega esperada</div>
          <div class="font-medium">{{ formatDate(order.expectedAt) }}</div>
        </div>
        <div class="rounded-lg border p-3" :style="{ borderColor: 'var(--color-border)' }">
          <div :style="{ color: 'var(--color-text-secondary)' }">Total</div>
          <div class="font-bold text-lg">{{ formatSol(order.totalAmount) }}</div>
        </div>
      </div>

      <p v-if="order.notes" class="text-sm rounded-lg border p-3" :style="{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }">
        {{ order.notes }}
      </p>

      <div class="rounded-xl border overflow-hidden" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
        <DataTable :columns="lineColumns" :data="order.lines" empty-text="Sin líneas." row-key="id">
          <template #row="{ row }">
            <td class="py-3 px-4">
              <div class="font-medium text-sm">{{ (row as ProduccionPurchaseOrderLine).materialName }}</div>
              <div class="text-xs font-mono" :style="{ color: 'var(--color-text-secondary)' }">{{ (row as ProduccionPurchaseOrderLine).materialCode }}</div>
            </td>
            <td class="py-3 px-4 text-sm">{{ formatQty((row as ProduccionPurchaseOrderLine).quantityOrdered, (row as ProduccionPurchaseOrderLine).unit) }}</td>
            <td class="py-3 px-4 text-sm">{{ formatQty((row as ProduccionPurchaseOrderLine).quantityReceived, (row as ProduccionPurchaseOrderLine).unit) }}</td>
            <td class="py-3 px-4 text-sm font-medium">{{ formatQty((row as ProduccionPurchaseOrderLine).quantityPending, (row as ProduccionPurchaseOrderLine).unit) }}</td>
            <td class="py-3 px-4 text-sm">{{ formatSol((row as ProduccionPurchaseOrderLine).unitPrice) }}</td>
            <td class="py-3 px-4 text-sm font-medium">{{ formatSol((row as ProduccionPurchaseOrderLine).lineTotal) }}</td>
          </template>
        </DataTable>
      </div>
    </template>

    <BaseModal v-model="showReceiveModal" size="md">
      <template #title>Registrar recepción</template>
      <div class="p-4 space-y-4">
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Indique la cantidad recibida por línea. Se registrará un ingreso en inventario.
        </p>
        <div v-for="line in pendingLines" :key="line.id" class="flex items-end gap-3">
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">{{ line.materialName }}</div>
            <div class="text-xs">Pendiente: {{ formatQty(line.quantityPending, line.unit) }}</div>
          </div>
          <FormInput
            v-model.number="receiveQtys[line.id]"
            label="Recibir"
            type="number"
            min="0"
            :max="line.quantityPending"
            step="0.01"
            class="w-28"
          />
        </div>
        <FormTextarea v-model="receiveNotes" label="Notas de recepción" :rows="2" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="showReceiveModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="receiving" @click="doReceive">Confirmar recepción</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
