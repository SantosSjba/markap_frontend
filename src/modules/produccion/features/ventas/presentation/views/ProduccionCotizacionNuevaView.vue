<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin } = useApplicationAccess('produccion')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useProduccionClientsList } from '../../../clientes/presentation/composables/useClients'
import { useProduccionCatalogList } from '../../../catalogo/presentation/composables/useProduccionCatalog'
import { useQuotationMutations } from '../composables/useProduccionSales'
import { formatSol } from '../labels'
const route = useRoute()
const router = useRouter()
const { create } = useQuotationMutations()

const { data: clientsRes } = useProduccionClientsList(ref({ page: 1, limit: 100 }))
const { data: catalogRes } = useProduccionCatalogList(ref({ page: 1, limit: 100, isActive: true }))

const clientOptions = computed(() =>
  (clientsRes.value?.data ?? []).map((c) => ({ value: c.id, label: c.fullName })),
)
const furnitureOptions = computed(() =>
  (catalogRes.value?.data ?? []).map((f) => ({ value: f.id, label: `${f.code} · ${f.name}` })),
)

const clientId = ref(typeof route.query.clientId === 'string' ? route.query.clientId : '')
const validUntil = ref('')
const notes = ref('')
const lines = ref([{ furnitureId: '', quantity: 1, unitPrice: 0 }])
const saving = ref(false)

const lineTotal = computed(() =>
  lines.value.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.unitPrice || 0), 0),
)

function addLine() {
  lines.value.push({ furnitureId: '', quantity: 1, unitPrice: 0 })
}

function removeLine(i: number) {
  if (lines.value.length > 1) lines.value.splice(i, 1)
}

async function save() {
  if (!clientId.value || lines.value.some((l) => !l.furnitureId)) return
  saving.value = true
  try {
    const q = await create.mutateAsync({
      clientId: clientId.value,
      validUntil: validUntil.value ? new Date(validUntil.value).toISOString() : null,
      notes: notes.value.trim() || null,
      lines: lines.value.map((l) => ({
        furnitureId: l.furnitureId,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
      })),
    })
    void router.push({ name: 'produccion-ventas-cotizacion-detalle', params: { id: q.id } })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Nueva cotización"
      back
      @back="router.push({ name: 'produccion-ventas-cotizaciones' })"
    />

    <BaseCard padding="sm" class="block space-y-4">
      <FormSelect v-model="clientId" label="Cliente" :options="clientOptions" />
      <FormInput v-model="validUntil" label="Vigente hasta" type="date" />
      <FormTextarea v-model="notes" label="Notas" :rows="2" />

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-sm">Muebles cotizados</h2>
          <BaseButton v-if="canWrite" variant="secondary" size="sm" @click="addLine">
            <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
            Agregar
          </BaseButton>
        </div>
        <div v-for="(line, i) in lines" :key="i" class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div class="sm:col-span-5">
            <FormSelect v-model="line.furnitureId" label="Mueble" :options="furnitureOptions" />
          </div>
          <div class="sm:col-span-2">
            <FormInput v-model.number="line.quantity" label="Cant." type="number" min="1" step="1" />
          </div>
          <div class="sm:col-span-4">
            <FormInput v-model.number="line.unitPrice" label="Precio unit. (S/)" type="number" min="0" step="0.01" />
          </div>
          <div class="sm:col-span-1 flex justify-end pb-1">
            <IconButton v-if="(lines.length > 1) && canAdmin" @click="removeLine(i)" icon="lucide:trash-2" label="Eliminar" danger />
          </div>
        </div>
        <p class="text-sm font-medium text-right">Total: {{ formatSol(lineTotal) }}</p>
      </div>

      <BaseButton v-if="canWrite" variant="primary" :loading="saving" @click="save">Guardar borrador</BaseButton>
    </BaseCard>
  </div>
</template>
