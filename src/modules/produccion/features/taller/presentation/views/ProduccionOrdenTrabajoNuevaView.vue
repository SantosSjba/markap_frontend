<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, FormInput, FormSelect, FormTextarea, AppIcon } from '@shared/components'
import { useProduccionClientsList } from '../../../clientes/application/useClients'
import { useProduccionCatalogList } from '../../../catalogo/application/useProduccionCatalog'
import { useWorkOrderMutations } from '../../application/useProduccionWorkOrders'
import { WO_PRIORITY_LABELS } from '../labels'

const router = useRouter()
const { create } = useWorkOrderMutations()

const { data: clientsRes } = useProduccionClientsList(ref({ page: 1, limit: 100 }))
const { data: catalogRes } = useProduccionCatalogList(ref({ page: 1, limit: 100, isActive: true }))

const clientOptions = computed(() => [
  { value: '', label: 'Sin cliente (producción interna)' },
  ...(clientsRes.value?.data ?? []).map((c) => ({ value: c.id, label: c.fullName })),
])
const furnitureOptions = computed(() =>
  (catalogRes.value?.data ?? []).map((f) => ({ value: f.id, label: `${f.code} · ${f.name}` })),
)
const priorityOptions = Object.entries(WO_PRIORITY_LABELS).map(([value, label]) => ({ value, label }))

const clientId = ref('')
const priority = ref('NORMAL')
const assignedTo = ref('')
const scheduledEnd = ref('')
const notes = ref('')
const lines = ref([{ furnitureId: '', quantity: 1 }])
const saving = ref(false)

function addLine() {
  lines.value.push({ furnitureId: '', quantity: 1 })
}

function removeLine(i: number) {
  if (lines.value.length > 1) lines.value.splice(i, 1)
}

async function save() {
  if (lines.value.some((l) => !l.furnitureId)) return
  saving.value = true
  try {
    const order = await create.mutateAsync({
      clientId: clientId.value || null,
      priority: priority.value as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
      assignedTo: assignedTo.value.trim() || null,
      scheduledEnd: scheduledEnd.value ? new Date(scheduledEnd.value).toISOString() : null,
      notes: notes.value.trim() || null,
      lines: lines.value.map((l) => ({
        furnitureId: l.furnitureId,
        quantity: Number(l.quantity),
      })),
    })
    void router.push({ name: 'produccion-ot-detalle', params: { id: order.id } })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex items-center gap-3">
      <BaseButton variant="ghost" @click="router.push({ name: 'produccion-ordenes-trabajo' })">
        <AppIcon icon="lucide:arrow-left" :size="18" class="mr-1" />
        Volver
      </BaseButton>
      <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Nueva orden de trabajo</h1>
    </div>

    <div class="rounded-xl border p-4 space-y-4" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <FormSelect v-model="clientId" label="Cliente" :options="clientOptions" />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormSelect v-model="priority" label="Prioridad" :options="priorityOptions" />
        <FormInput v-model="assignedTo" label="Responsable" />
      </div>
      <FormInput v-model="scheduledEnd" label="Fecha compromiso" type="date" />
      <FormTextarea v-model="notes" label="Notas" :rows="2" />

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-sm">Muebles a producir</h2>
          <BaseButton variant="secondary" size="sm" @click="addLine">
            <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
            Agregar
          </BaseButton>
        </div>
        <div v-for="(line, i) in lines" :key="i" class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div class="sm:col-span-8">
            <FormSelect v-model="line.furnitureId" label="Mueble del catálogo" :options="furnitureOptions" />
          </div>
          <div class="sm:col-span-3">
            <FormInput v-model.number="line.quantity" label="Cantidad" type="number" min="1" step="1" />
          </div>
          <div class="sm:col-span-1 flex justify-end pb-1">
            <button v-if="lines.length > 1" type="button" @click="removeLine(i)">
              <AppIcon icon="lucide:trash-2" :size="18" :style="{ color: 'var(--color-error)' }" />
            </button>
          </div>
        </div>
      </div>

      <BaseButton variant="primary" :loading="saving" @click="save">Crear OT</BaseButton>
    </div>
  </div>
</template>
