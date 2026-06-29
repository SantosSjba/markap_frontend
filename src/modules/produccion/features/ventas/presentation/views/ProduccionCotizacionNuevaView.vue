<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, FormInput, FormSelect, FormTextarea, AppIcon } from '@shared/components'
import { useProduccionClientsList } from '../../../clientes/application/useClients'
import { useProduccionCatalogList } from '../../../catalogo/application/useProduccionCatalog'
import { useQuotationMutations } from '../../application/useProduccionSales'
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
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex items-center gap-3">
      <BaseButton variant="ghost" @click="router.push({ name: 'produccion-ventas-cotizaciones' })">
        <AppIcon icon="lucide:arrow-left" :size="18" class="mr-1" />
        Volver
      </BaseButton>
      <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Nueva cotización</h1>
    </div>

    <div class="rounded-xl border p-4 space-y-4" :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }">
      <FormSelect v-model="clientId" label="Cliente" :options="clientOptions" />
      <FormInput v-model="validUntil" label="Vigente hasta" type="date" />
      <FormTextarea v-model="notes" label="Notas" :rows="2" />

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-sm">Muebles cotizados</h2>
          <BaseButton variant="secondary" size="sm" @click="addLine">
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
            <button v-if="lines.length > 1" type="button" @click="removeLine(i)">
              <AppIcon icon="lucide:trash-2" :size="18" :style="{ color: 'var(--color-error)' }" />
            </button>
          </div>
        </div>
        <p class="text-sm font-medium text-right">Total: {{ formatSol(lineTotal) }}</p>
      </div>

      <BaseButton variant="primary" :loading="saving" @click="save">Guardar borrador</BaseButton>
    </div>
  </div>
</template>
