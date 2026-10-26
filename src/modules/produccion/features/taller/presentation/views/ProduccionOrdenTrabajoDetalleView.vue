<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canAdmin } = useApplicationAccess('produccion')

import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import {
  useProduccionWorkOrderDetail,
  useWorkOrderMutations,
} from '../composables/useProduccionWorkOrders'
import { useProduccionMaterialsList } from '../../../inventario/presentation/composables/useProduccionInventory'
import { formatDate, WO_STATUS_LABELS, STAGE_STATUS_LABELS } from '../labels'
import { formatQty } from '../../../inventario/presentation/labels'
import type { ProduccionWorkOrderStage } from '../../domain/work-orders.types'
const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { data: order, isLoading, refetch } = useProduccionWorkOrderDetail(id)
const { start, updateStage, complete, cancel, consumeMaterials, remove } = useWorkOrderMutations()

const { data: materialsRes } = useProduccionMaterialsList(ref({ page: 1, limit: 200 }))
const materialOptions = computed(() =>
  (materialsRes.value?.data ?? []).map((m) => ({
    value: m.id,
    label: `${m.code} · ${m.name} (stock ${m.currentStock})`,
  })),
)

const showConsumeModal = ref(false)
const consumeMaterialId = ref('')
const consumeQty = ref(1)
const consuming = ref(false)

const canStart = computed(() => order.value?.status === 'PENDING')
const canComplete = computed(() => order.value?.status === 'IN_PROGRESS')
const canCancel = computed(() => ['PENDING', 'IN_PROGRESS'].includes(order.value?.status ?? ''))
const canDelete = computed(() => order.value?.status === 'PENDING')
const canConsume = computed(() => order.value?.status === 'IN_PROGRESS')

async function doStart() {
  const ok = await markapAlert.confirm({
    title: '¿Iniciar producción?',
    text: 'La primera etapa quedará en curso.',
    confirmText: 'Iniciar',
  })
  if (!ok) return
  await start.mutateAsync(id.value)
  void refetch()
}

async function doComplete() {
  const ok = await markapAlert.confirm({
    title: '¿Marcar OT como terminada?',
    confirmText: 'Completar',
  })
  if (!ok) return
  await complete.mutateAsync(id.value)
  void refetch()
}

async function doCancel() {
  const ok = await markapAlert.confirmDanger({ title: '¿Cancelar OT?', confirmText: 'Cancelar OT' })
  if (!ok) return
  await cancel.mutateAsync(id.value)
  void refetch()
}

async function doDelete() {
  const ok = await markapAlert.confirmDanger({ title: '¿Eliminar OT?', confirmText: 'Eliminar' })
  if (!ok) return
  await remove.mutateAsync(id.value)
  void router.push({ name: 'produccion-ordenes-trabajo' })
}

async function markStageDone(stage: ProduccionWorkOrderStage) {
  await updateStage.mutateAsync({
    id: id.value,
    stageId: stage.id,
    payload: { markDone: true },
  })
  void refetch()
}

async function doConsume() {
  if (!consumeMaterialId.value || consumeQty.value <= 0) return
  consuming.value = true
  try {
    await consumeMaterials.mutateAsync({
      id: id.value,
      items: [{ materialId: consumeMaterialId.value, quantity: Number(consumeQty.value) }],
    })
    showConsumeModal.value = false
    void refetch()
  } finally {
    consuming.value = false
  }
}

function stageIcon(status: string) {
  if (status === 'DONE') return 'lucide:check-circle'
  if (status === 'IN_PROGRESS') return 'lucide:play-circle'
  return 'lucide:circle'
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      :title="order?.code ?? 'Orden de trabajo'"
      :subtitle="order ? `${WO_STATUS_LABELS[order.status]} · ${order.progressPercent}%` : undefined"
      back
      @back="router.back()"
    >
      <template #actions>
        <div class="flex flex-wrap gap-2">
        <BaseButton v-if="canStart" variant="primary" @click="doStart">Iniciar</BaseButton>
        <BaseButton v-if="canConsume" variant="secondary" @click="showConsumeModal = true">Consumir material</BaseButton>
        <BaseButton v-if="canComplete" variant="primary" @click="doComplete">Terminar OT</BaseButton>
        <BaseButton v-if="canCancel" variant="secondary" @click="doCancel">Cancelar</BaseButton>
        <BaseButton v-if="(canDelete) && canAdmin" variant="danger" @click="doDelete">Eliminar</BaseButton>
      </div>
      </template>
    </PageHeader>

    <div v-if="isLoading" class="text-sm text-gray-500 dark:text-gray-400">Cargando…</div>

    <template v-else-if="order">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div class="rounded-lg border p-3 border-gray-200 dark:border-gray-800">
          <div class="text-gray-500 dark:text-gray-400">Cliente</div>
          <div class="font-medium">{{ order.clientName ?? '—' }}</div>
        </div>
        <div class="rounded-lg border p-3 border-gray-200 dark:border-gray-800">
          <div class="text-gray-500 dark:text-gray-400">Responsable</div>
          <div class="font-medium">{{ order.assignedTo ?? '—' }}</div>
        </div>
        <div class="rounded-lg border p-3 border-gray-200 dark:border-gray-800">
          <div class="text-gray-500 dark:text-gray-400">Compromiso</div>
          <div class="font-medium">{{ formatDate(order.scheduledEnd) }}</div>
        </div>
      </div>

      <FormSectionCard
        title="Muebles"
        dense
      >
        <ul class="space-y-2">
          <li v-for="line in order.lines" :key="line.id" class="text-sm">
            <span class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ line.furnitureCode }}</span>
            {{ line.furnitureName }} × {{ line.quantity }}
          </li>
        </ul>
      </FormSectionCard>

      <FormSectionCard
        title="Etapas de producción"
        dense
      >
        <div v-for="stage in order.stages" :key="stage.id" class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
          <AppIcon :icon="stageIcon(stage.status)" :size="22" :class="stage.status === 'DONE' ? 'text-success-600 dark:text-success-500' : stage.status === 'IN_PROGRESS' ? 'text-blue-light-600 dark:text-blue-light-500' : 'text-gray-400'" />
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm">{{ stage.label }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ STAGE_STATUS_LABELS[stage.status] }}
              <span v-if="stage.assignee"> · {{ stage.assignee }}</span>
            </div>
          </div>
          <BaseButton
            v-if="canComplete && stage.status === 'IN_PROGRESS'"
            variant="secondary"
            size="sm"
            @click="markStageDone(stage)"
          >
            Completar etapa
          </BaseButton>
        </div>
      </FormSectionCard>

      <FormSectionCard
        v-if="order.consumptions.length"
        title="Consumo de materiales"
        dense
      >
        <ul class="space-y-1 text-sm">
          <li v-for="c in order.consumptions" :key="c.id">
            {{ c.materialCode }} — {{ formatQty(c.quantity) }} ({{ formatDate(c.consumedAt) }})
          </li>
        </ul>
      </FormSectionCard>
    </template>

    <BaseModal v-model="showConsumeModal" size="md">
      <template #title>Consumir material</template>
      <div class="p-4 space-y-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Registra salida de inventario vinculada a esta OT.
        </p>
        <FormSelect v-model="consumeMaterialId" label="Material" :options="materialOptions" />
        <FormInput v-model.number="consumeQty" label="Cantidad" type="number" min="0.01" step="0.01" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="showConsumeModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="consuming" @click="doConsume">Registrar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
