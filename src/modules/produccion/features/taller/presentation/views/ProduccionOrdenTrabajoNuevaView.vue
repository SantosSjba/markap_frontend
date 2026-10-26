<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useProduccionClientsList } from '../../../clientes/presentation/composables/useClients'
import { useProduccionCatalogList } from '../../../catalogo/presentation/composables/useProduccionCatalog'
import { useWorkOrderMutations } from '../composables/useProduccionWorkOrders'
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
const priorityOptions = Object.entries(WO_PRIORITY_LABELS).map(([value, label]) => ({
  value,
  label,
}))

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
  <div class="space-y-6">
    <PageHeader
      title="Nueva orden de trabajo"
      back
      @back="router.push({ name: 'produccion-ordenes-trabajo' })"
    />

    <BaseCard padding="sm" class="block space-y-4">
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
            <IconButton v-if="lines.length > 1" @click="removeLine(i)" icon="lucide:trash-2" label="Eliminar" danger />
          </div>
        </div>
      </div>

      <BaseButton variant="primary" :loading="saving" @click="save">Crear OT</BaseButton>
    </BaseCard>
  </div>
</template>
