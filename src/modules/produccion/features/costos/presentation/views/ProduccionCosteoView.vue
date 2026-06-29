<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, FormInput, AppIcon, StatsCard } from '@shared/components'
import { PRODUCCION_BASE_PATH } from '@modules/produccion/config/routes.constants'
import { produccionCatalogRepository } from '@modules/produccion/features/catalogo'
import {
  useProduccionFurnitureCosting,
  useUpdateProduccionFurnitureCosting,
  useCreateCostingSnapshot,
  useProduccionLaborRatesList,
  useProduccionExtraCostsList,
} from '../../application/useProduccionCosts'
import { formatSol, formatPercent } from '../labels'

const route = useRoute()
const router = useRouter()

const furnitureOptions = ref<{ id: string; label: string }[]>([])
const selectedId = ref(String(route.query.mueble ?? ''))

const furnitureId = computed(() => selectedId.value)

const { data: costing, isLoading, refetch } = useProduccionFurnitureCosting(furnitureId)
const updateMut = useUpdateProduccionFurnitureCosting(furnitureId)
const snapshotMut = useCreateCostingSnapshot(furnitureId)

const { data: laborRates } = useProduccionLaborRatesList(ref({ page: 1, limit: 100, isActive: true }))
const { data: extraCatalog } = useProduccionExtraCostsList(ref({ page: 1, limit: 100, isActive: true }))

type MaterialDraft = { id: string; unitCost: number | '' }
type LaborDraft = { key: string; laborRateId: string; description: string; hours: number; hourlyRate: number }
type ExtraDraft = { key: string; catalogItemId: string; description: string; amount: number }

const materialDrafts = ref<MaterialDraft[]>([])
const laborLines = ref<LaborDraft[]>([])
const extraLines = ref<ExtraDraft[]>([])

watch(selectedId, (id) => {
  if (id) {
    void router.replace({ query: { ...route.query, mueble: id } })
  }
})

watch(
  costing,
  (c) => {
    if (!c) return
    materialDrafts.value = c.materials.map((m) => ({
      id: m.id,
      unitCost: m.unitCost ?? '',
    }))
    laborLines.value = c.laborEntries.map((l, i) => ({
      key: l.id || `l-${i}`,
      laborRateId: l.laborRateId ?? '',
      description: l.description,
      hours: l.hours,
      hourlyRate: l.hourlyRate,
    }))
    extraLines.value = c.extraExpenses.map((e, i) => ({
      key: e.id || `e-${i}`,
      catalogItemId: e.catalogItemId ?? '',
      description: e.description,
      amount: e.amount,
    }))
  },
  { immediate: true },
)

async function loadFurnitureOptions() {
  const res = await produccionCatalogRepository.getList({ page: 1, limit: 200, isActive: true })
  furnitureOptions.value = res.data.map((f) => ({
    id: f.id,
    label: `${f.code} — ${f.name}`,
  }))
  if (!selectedId.value && furnitureOptions.value.length) {
    selectedId.value = furnitureOptions.value[0]!.id
  }
}
void loadFurnitureOptions()

function addLabor() {
  const first = laborRates.value?.data?.[0]
  laborLines.value.push({
    key: `new-l-${Date.now()}`,
    laborRateId: first?.id ?? '',
    description: first?.name ?? '',
    hours: 1,
    hourlyRate: first?.hourlyRate ?? 0,
  })
}

function onLaborRateChange(line: LaborDraft) {
  const rate = laborRates.value?.data?.find((r) => r.id === line.laborRateId)
  if (rate) {
    line.description = rate.name
    line.hourlyRate = rate.hourlyRate
  }
}

function addExtra() {
  const first = extraCatalog.value?.data?.[0]
  extraLines.value.push({
    key: `new-e-${Date.now()}`,
    catalogItemId: first?.id ?? '',
    description: first?.name ?? '',
    amount: first?.defaultAmount ?? 0,
  })
}

function onExtraCatalogChange(line: ExtraDraft) {
  const item = extraCatalog.value?.data?.find((e) => e.id === line.catalogItemId)
  if (item) {
    line.description = item.name
    line.amount = item.defaultAmount
  }
}

const previewTotals = computed(() => {
  const c = costing.value
  if (!c) return null
  let materialsTotal = 0
  for (const m of materialDrafts.value) {
    const bom = c.materials.find((x) => x.id === m.id)
    if (!bom) continue
    const uc = m.unitCost === '' ? 0 : Number(m.unitCost)
    materialsTotal += bom.quantity * uc
  }
  let labor = 0
  for (const l of laborLines.value) {
    labor += Number(l.hours) * Number(l.hourlyRate)
  }
  let extras = 0
  for (const e of extraLines.value) {
    extras += Number(e.amount)
  }
  const totalCost = materialsTotal + labor + extras
  const ref = c.referencePrice
  const margin = ref - totalCost
  return {
    materials: materialsTotal,
    labor,
    extras,
    totalCost,
    referencePrice: ref,
    marginAmount: margin,
    marginPercent: ref > 0 ? (margin / ref) * 100 : null,
  }
})

async function save() {
  if (!furnitureId.value) return
  await updateMut.mutateAsync({
    bomUnitCosts: materialDrafts.value.map((m) => ({
      id: m.id,
      unitCost: m.unitCost === '' ? null : Number(m.unitCost),
    })),
    laborEntries: laborLines.value
      .filter((l) => l.description.trim())
      .map((l) => ({
        laborRateId: l.laborRateId || null,
        description: l.description.trim(),
        hours: Number(l.hours),
        hourlyRate: Number(l.hourlyRate),
      })),
    extraExpenses: extraLines.value
      .filter((e) => e.description.trim())
      .map((e) => ({
        catalogItemId: e.catalogItemId || null,
        description: e.description.trim(),
        amount: Number(e.amount),
      })),
  })
  await refetch()
}

async function saveSnapshot() {
  if (!furnitureId.value) return
  await snapshotMut.mutateAsync(undefined)
  await refetch()
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">Costeo de muebles</h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          BOM × precio unitario + mano de obra + gastos adicionales.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="outline" :disabled="!furnitureId" :loading="snapshotMut.isPending.value" @click="saveSnapshot">
          Guardar snapshot
        </BaseButton>
        <BaseButton variant="primary" :disabled="!furnitureId" :loading="updateMut.isPending.value" @click="save">
          Guardar costeo
        </BaseButton>
      </div>
    </div>

    <div class="max-w-md">
      <label class="block text-sm font-medium mb-1.5">Mueble</label>
      <select
        v-model="selectedId"
        class="w-full px-3 py-2 rounded-lg border text-sm"
        :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
      >
        <option value="">Seleccione un mueble…</option>
        <option v-for="opt in furnitureOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
      </select>
    </div>

    <div v-if="!furnitureId" class="text-sm py-8 text-center" :style="{ color: 'var(--color-text-secondary)' }">
      Seleccione un mueble para ver y editar su costeo.
    </div>

    <div v-else-if="isLoading" class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">Cargando costeo…</div>

    <template v-else-if="costing">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Materiales" :value="formatSol(previewTotals?.materials ?? costing.totals.materials)" />
        <StatsCard title="Mano de obra" :value="formatSol(previewTotals?.labor ?? costing.totals.labor)" />
        <StatsCard title="Gastos" :value="formatSol(previewTotals?.extras ?? costing.totals.extras)" />
        <StatsCard title="Costo total" :value="formatSol(previewTotals?.totalCost ?? costing.totals.totalCost)" />
      </div>

      <div
        class="p-4 rounded-xl border flex flex-wrap gap-4 justify-between items-center"
        :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
      >
        <div>
          <p class="text-sm font-semibold">{{ costing.furnitureCode }} · {{ costing.furnitureName }}</p>
          <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
            Precio ref. {{ formatSol(costing.referencePrice) }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-sm">Margen estimado</p>
          <p class="text-lg font-bold" :style="{ color: (previewTotals?.marginAmount ?? 0) >= 0 ? 'var(--color-success)' : 'var(--color-error)' }">
            {{ formatSol(previewTotals?.marginAmount ?? costing.totals.marginAmount) }}
            ({{ formatPercent(previewTotals?.marginPercent ?? costing.totals.marginPercent) }})
          </p>
        </div>
        <BaseButton
          variant="ghost"
          size="sm"
          @click="router.push(`${PRODUCCION_BASE_PATH}/catalogo/${costing.furnitureId}`)"
        >
          Ver ficha del mueble
        </BaseButton>
      </div>

      <!-- Materiales -->
      <section class="rounded-xl border p-4 space-y-3" :style="{ borderColor: 'var(--color-border)' }">
        <p class="text-sm font-semibold">Materiales (BOM)</p>
        <div v-if="!costing.materials.length" class="text-sm text-center py-4" :style="{ color: 'var(--color-text-secondary)' }">
          Sin líneas BOM. Defínalas en la ficha del mueble.
        </div>
        <div v-for="(m, idx) in costing.materials" :key="m.id" class="grid sm:grid-cols-12 gap-2 items-end text-sm border-b pb-3" :style="{ borderColor: 'var(--color-border)' }">
          <div class="sm:col-span-5">
            <span class="font-medium">{{ m.materialName }}</span>
            <span class="ml-2" :style="{ color: 'var(--color-text-secondary)' }">{{ m.quantity }} {{ m.unit }}</span>
          </div>
          <div v-if="materialDrafts[idx]" class="sm:col-span-3">
            <FormInput v-model="materialDrafts[idx]!.unitCost" type="number" label="Costo unit. (S/)" />
          </div>
          <div class="sm:col-span-4 text-right font-medium pt-5">
            {{
              formatSol(
                (materialDrafts[idx]?.unitCost === '' || materialDrafts[idx]?.unitCost == null
                  ? 0
                  : Number(materialDrafts[idx]!.unitCost)) * m.quantity,
              )
            }}
          </div>
        </div>
      </section>

      <!-- Mano de obra -->
      <section class="rounded-xl border p-4 space-y-3" :style="{ borderColor: 'var(--color-border)' }">
        <div class="flex justify-between items-center">
          <p class="text-sm font-semibold">Mano de obra</p>
          <BaseButton variant="outline" size="sm" @click="addLabor">
            <AppIcon icon="lucide:plus" :size="16" class="mr-1" /> Agregar
          </BaseButton>
        </div>
        <div v-for="line in laborLines" :key="line.key" class="grid sm:grid-cols-12 gap-2 items-end">
          <div class="sm:col-span-3">
            <label class="text-xs font-medium">Tarifa</label>
            <select
              v-model="line.laborRateId"
              class="w-full px-2 py-2 rounded-lg border text-sm mt-1"
              :style="{ borderColor: 'var(--color-border)' }"
              @change="onLaborRateChange(line)"
            >
              <option value="">Manual</option>
              <option v-for="r in laborRates?.data ?? []" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div class="sm:col-span-3"><FormInput v-model="line.description" label="Descripción" /></div>
          <div class="sm:col-span-2"><FormInput v-model="line.hours" type="number" label="Horas" /></div>
          <div class="sm:col-span-2"><FormInput v-model="line.hourlyRate" type="number" label="S/ hora" /></div>
          <div class="sm:col-span-2 text-right text-sm font-medium pt-5">
            {{ formatSol(Number(line.hours) * Number(line.hourlyRate)) }}
          </div>
        </div>
      </section>

      <!-- Gastos -->
      <section class="rounded-xl border p-4 space-y-3" :style="{ borderColor: 'var(--color-border)' }">
        <div class="flex justify-between items-center">
          <p class="text-sm font-semibold">Gastos adicionales</p>
          <BaseButton variant="outline" size="sm" @click="addExtra">
            <AppIcon icon="lucide:plus" :size="16" class="mr-1" /> Agregar
          </BaseButton>
        </div>
        <div v-for="line in extraLines" :key="line.key" class="grid sm:grid-cols-12 gap-2 items-end">
          <div class="sm:col-span-4">
            <label class="text-xs font-medium">Del catálogo</label>
            <select
              v-model="line.catalogItemId"
              class="w-full px-2 py-2 rounded-lg border text-sm mt-1"
              :style="{ borderColor: 'var(--color-border)' }"
              @change="onExtraCatalogChange(line)"
            >
              <option value="">Manual</option>
              <option v-for="e in extraCatalog?.data ?? []" :key="e.id" :value="e.id">{{ e.name }}</option>
            </select>
          </div>
          <div class="sm:col-span-5"><FormInput v-model="line.description" label="Descripción" /></div>
          <div class="sm:col-span-3"><FormInput v-model="line.amount" type="number" label="Monto (S/)" /></div>
        </div>
      </section>

      <section v-if="costing.recentSnapshots.length" class="rounded-xl border p-4" :style="{ borderColor: 'var(--color-border)' }">
        <p class="text-sm font-semibold mb-3">Snapshots recientes</p>
        <div class="space-y-2">
          <div
            v-for="sn in costing.recentSnapshots"
            :key="sn.id"
            class="flex justify-between text-sm py-2 border-b"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <span>{{ sn.label || new Date(sn.createdAt).toLocaleString('es-PE') }}</span>
            <span class="font-medium">{{ formatSol(sn.totalCost) }} · margen {{ formatPercent(sn.marginPercent) }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
