<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { PRODUCCION_BASE_PATH } from '../../../../config/routes.constants'
import {
  useProduccionCatalogDetail,
  useUpdateProduccionCatalogItem,
  useDeleteProduccionCatalogItem,
} from '../composables/useProduccionCatalog'
import { formatSol, formatDimensions } from '../labels'
import { useProduccionFurnitureCategoryOptions } from '../../../configuracion/presentation/composables/useProduccionConfigOptions'
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
  <div class="space-y-6">
    <PageHeader
      :title="`${detail?.code ?? '…'} · ${detail?.name ?? 'Cargando…'}`"
      eyebrow="Catálogo"
    >
      <template #subtitle>
        Precio ref. {{ formatSol(detail?.referencePrice) }}
          · {{ formatDimensions(detail?.widthCm, detail?.depthCm, detail?.heightCm) }}
          <span v-if="detail"> · {{ detail.bomLines.length }} líneas BOM</span>
      </template>
      <template #actions>
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
      </template>
    </PageHeader>

    <BaseTabs v-model="activeTab" :tabs="tabs" />

    <div v-if="isLoading" class="text-sm text-gray-500 dark:text-gray-400">Cargando…</div>

    <template v-else-if="detail && activeTab === 'ficha'">
      <BaseCard v-if="sortedImages.length" padding="sm" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <a
          v-for="img in sortedImages"
          :key="img.id"
          :href="img.url"
          target="_blank"
          rel="noopener noreferrer"
          class="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800"
        >
          <img :src="img.url" alt="" class="w-full h-full object-cover" loading="lazy" />
        </a>
      </BaseCard>

      <BaseCard class="block space-y-4">
        <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Edición</p>
        <div class="grid sm:grid-cols-2 gap-4">
          <FormInput :model-value="detail.code" label="Código" disabled />
          <FormInput v-model="name" label="Nombre" required />
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <FormSelect
              v-model="category"
              :options="categoryOptions"
              label="Categoría"
            />
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
        <FormCheckbox v-model="isActive" label="Activo en catálogo" />
      </BaseCard>
    </template>

    <ProduccionFurnitureBomEditor v-else-if="detail && activeTab === 'bom'" v-model="bomLines" />

    <BaseCard v-else-if="detail && activeTab === 'costeo'" class="block">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Costeo de muebles</p>
          <p class="text-sm mt-1 text-gray-500 dark:text-gray-400">
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
    </BaseCard>

    <BaseCard v-else-if="detail && activeTab === 'cotizaciones'" class="block text-center">
      <AppIcon icon="lucide:file-text" :size="32" class="mx-auto mb-3" color="var(--color-text-secondary)" />
      <p class="text-sm font-medium text-gray-800 dark:text-white/90">Cotizaciones vinculadas</p>
      <p class="text-sm mt-1 text-gray-500 dark:text-gray-400">
        Disponible en la fase de Ventas. Aquí listará las cotizaciones que incluyan este mueble.
      </p>
    </BaseCard>
  </div>
</template>
