<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, FormInput, FormTextarea, AppIcon } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { PRODUCCION_BASE_PATH } from '@modules/produccion/config/routes.constants'
import {
  useProduccionCatalogDetail,
  useUpdateProduccionCatalogItem,
  useDeleteProduccionCatalogItem,
} from '../../application/useProduccionCatalog'
import { formatSol, formatDimensions } from '../labels'
import { useProduccionFurnitureCategoryOptions } from '@modules/produccion/features/configuracion'
import ProduccionFurnitureBomEditor, {
  type BomLineDraft,
} from '../components/ProduccionFurnitureBomEditor.vue'
import type { ProduccionFurnitureBomLineInput } from '../../domain/catalog.types'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const activeTab = ref<'ficha' | 'bom' | 'costeo' | 'cotizaciones'>('ficha')

const { data: detail, isLoading } = useProduccionCatalogDetail(id)
const updateMut = useUpdateProduccionCatalogItem(id)
const deleteMut = useDeleteProduccionCatalogItem()
const { options: categoryOptions } = useProduccionFurnitureCategoryOptions()

const name = ref('')
const category = ref('')
const description = ref('')
const widthCm = ref<number | ''>('')
const depthCm = ref<number | ''>('')
const heightCm = ref<number | ''>('')
const referencePrice = ref(0)
const technicalSheetUrl = ref('')
const notes = ref('')
const imageUrlsRaw = ref('')
const isActive = ref(true)
const bomLines = ref<BomLineDraft[]>([])

watch(
  detail,
  (d) => {
    if (!d) return
    name.value = d.name
    category.value = d.category
    description.value = d.description ?? ''
    widthCm.value = d.widthCm ?? ''
    depthCm.value = d.depthCm ?? ''
    heightCm.value = d.heightCm ?? ''
    referencePrice.value = d.referencePrice
    technicalSheetUrl.value = d.technicalSheetUrl ?? ''
    notes.value = d.notes ?? ''
    isActive.value = d.isActive
    imageUrlsRaw.value = [...d.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => i.url)
      .join('\n')
    bomLines.value = [...d.bomLines]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((bl) => ({
        key: bl.id,
        materialName: bl.materialName,
        unit: bl.unit,
        quantity: bl.quantity,
        unitCost: bl.unitCost ?? '',
        notes: bl.notes ?? '',
      }))
  },
  { immediate: true },
)

function parseUrls(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function numOrNull(v: number | ''): number | null {
  if (v === '' || Number.isNaN(Number(v))) return null
  return Number(v)
}

function bomPayload(): ProduccionFurnitureBomLineInput[] {
  return bomLines.value
    .filter((l) => l.materialName.trim() && l.unit.trim())
    .map((l) => ({
      materialName: l.materialName.trim(),
      unit: l.unit.trim(),
      quantity: Number(l.quantity),
      unitCost:
        l.unitCost === '' || l.unitCost == null || Number.isNaN(Number(l.unitCost))
          ? null
          : Number(l.unitCost),
      notes: l.notes?.trim() || null,
    }))
}

async function save() {
  await updateMut.mutateAsync({
    name: name.value.trim(),
    category: category.value.trim(),
    description: description.value.trim() || null,
    widthCm: numOrNull(widthCm.value),
    depthCm: numOrNull(depthCm.value),
    heightCm: numOrNull(heightCm.value),
    referencePrice: Number(referencePrice.value),
    technicalSheetUrl: technicalSheetUrl.value.trim() || null,
    notes: notes.value.trim() || null,
    isActive: isActive.value,
    imageUrls: parseUrls(imageUrlsRaw.value),
  })
}

async function saveBom() {
  await updateMut.mutateAsync({ bomLines: bomPayload() })
}

async function remove() {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar mueble?',
    text: 'Se quitará del catálogo. Las cotizaciones existentes no se modifican.',
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await deleteMut.mutateAsync(id.value)
  await router.replace(`${PRODUCCION_BASE_PATH}/catalogo`)
}

const goBack = () => router.push(`${PRODUCCION_BASE_PATH}/catalogo`)

const sortedImages = computed(() =>
  detail.value ? [...detail.value.images].sort((a, b) => a.sortOrder - b.sortOrder) : [],
)

const tabs = [
  { id: 'ficha' as const, label: 'Ficha' },
  { id: 'bom' as const, label: 'BOM' },
  { id: 'costeo' as const, label: 'Costeo' },
  { id: 'cotizaciones' as const, label: 'Cotizaciones' },
]

const showSave = computed(() => activeTab.value === 'ficha' || activeTab.value === 'bom')
const onSave = () => (activeTab.value === 'bom' ? saveBom() : save())
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start gap-3 justify-between">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide" :style="{ color: 'var(--color-text-secondary)' }">
          Catálogo
        </p>
        <h1 class="text-xl font-bold mt-0.5" :style="{ color: 'var(--color-text-primary)' }">
          {{ detail?.code ?? '…' }} · {{ detail?.name ?? 'Cargando…' }}
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Precio ref. {{ formatSol(detail?.referencePrice) }}
          · {{ formatDimensions(detail?.widthCm, detail?.depthCm, detail?.heightCm) }}
          <span v-if="detail"> · {{ detail.bomLines.length }} líneas BOM</span>
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="ghost" type="button" @click="goBack">
          <AppIcon icon="lucide:arrow-left" :size="18" class="mr-1.5" />
          Listado
        </BaseButton>
        <BaseButton variant="danger" type="button" :loading="deleteMut.isPending.value" @click="remove">
          Eliminar
        </BaseButton>
        <BaseButton
          v-if="showSave"
          variant="primary"
          type="button"
          :loading="updateMut.isPending.value"
          @click="onSave"
        >
          Guardar cambios
        </BaseButton>
      </div>
    </div>

    <div class="flex gap-1 border-b overflow-x-auto" :style="{ borderColor: 'var(--color-border)' }">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap"
        :style="{
          borderColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
          color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="isLoading" class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">Cargando…</div>

    <template v-else-if="detail && activeTab === 'ficha'">
      <div
        v-if="sortedImages.length"
        class="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border p-4"
        :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
      >
        <a
          v-for="img in sortedImages"
          :key="img.id"
          :href="img.url"
          target="_blank"
          rel="noopener noreferrer"
          class="aspect-square rounded-lg overflow-hidden border"
          :style="{ borderColor: 'var(--color-border)' }"
        >
          <img :src="img.url" alt="" class="w-full h-full object-cover" loading="lazy" />
        </a>
      </div>

      <div
        class="space-y-4 p-4 sm:p-6 rounded-xl border"
        :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
      >
        <p class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Edición</p>
        <div class="grid sm:grid-cols-2 gap-4">
          <FormInput :model-value="detail.code" label="Código" disabled />
          <FormInput v-model="name" label="Nombre" required />
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1.5" :style="{ color: 'var(--color-text-primary)' }">
              Categoría
            </label>
            <select
              v-model="category"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              :style="{
                borderColor: 'var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
              }"
            >
              <option v-for="c in categoryOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
          <FormInput v-model="referencePrice" type="number" label="Precio referencia (S/)" required />
        </div>
        <FormTextarea v-model="description" label="Descripción" :rows="3" />
        <div class="grid sm:grid-cols-3 gap-4">
          <FormInput v-model="widthCm" type="number" label="Ancho (cm)" />
          <FormInput v-model="depthCm" type="number" label="Profundidad (cm)" />
          <FormInput v-model="heightCm" type="number" label="Alto (cm)" />
        </div>
        <FormInput v-model="technicalSheetUrl" type="url" label="Ficha técnica (URL)" />
        <FormTextarea v-model="notes" label="Notas internas" :rows="2" />
        <FormTextarea v-model="imageUrlsRaw" label="Imágenes (una URL por línea)" :rows="4" />
        <label class="flex items-center gap-2 text-sm cursor-pointer" :style="{ color: 'var(--color-text-primary)' }">
          <input v-model="isActive" type="checkbox" class="rounded" />
          Activo en catálogo
        </label>
      </div>
    </template>

    <ProduccionFurnitureBomEditor v-else-if="detail && activeTab === 'bom'" v-model="bomLines" />

    <div
      v-else-if="detail && activeTab === 'costeo'"
      class="p-6 rounded-xl border"
      :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
    >
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">Costeo de muebles</p>
          <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
            Calcule materiales, mano de obra y gastos para este mueble.
          </p>
        </div>
        <BaseButton
          variant="primary"
          type="button"
          @click="router.push(`${PRODUCCION_BASE_PATH}/costos/costeo?mueble=${id}`)"
        >
          <AppIcon icon="lucide:calculator" :size="18" class="mr-1.5" />
          Ver costeo
        </BaseButton>
      </div>
    </div>

    <div
      v-else-if="detail && activeTab === 'cotizaciones'"
      class="p-6 rounded-xl border text-center"
      :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
    >
      <AppIcon icon="lucide:file-text" :size="32" class="mx-auto mb-3" color="var(--color-text-secondary)" />
      <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">Cotizaciones vinculadas</p>
      <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
        Disponible en la fase de Ventas. Aquí listará las cotizaciones que incluyan este mueble.
      </p>
    </div>
  </div>
</template>
