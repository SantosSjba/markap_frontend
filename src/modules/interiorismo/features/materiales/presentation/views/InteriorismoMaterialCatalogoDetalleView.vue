<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, FormInput, FormTextarea, AppIcon } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'
import {
  useInteriorCatalogMaterialDetail,
  useUpdateInteriorCatalogMaterial,
  useDeleteInteriorCatalogMaterial,
} from '../../application/useInteriorCatalogMaterials'
import { formatSol, formatQty } from '../labels'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { data: detail, isLoading } = useInteriorCatalogMaterialDetail(id)
const updateMut = useUpdateInteriorCatalogMaterial(id)
const deleteMut = useDeleteInteriorCatalogMaterial()

const name = ref('')
const category = ref('')
const brand = ref('')
const unit = ref('')
const price = ref(0)
const stock = ref(0)
const technicalSheetUrl = ref('')
const imageUrlsRaw = ref('')

watch(
  detail,
  (d) => {
    if (!d) return
    name.value = d.name
    category.value = d.category
    brand.value = d.brand
    unit.value = d.unit
    price.value = d.price
    stock.value = d.stock
    technicalSheetUrl.value = d.technicalSheetUrl ?? ''
    imageUrlsRaw.value = [...d.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => i.url)
      .join('\n')
  },
  { immediate: true },
)

function parseUrls(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

async function save() {
  await updateMut.mutateAsync({
    name: name.value.trim(),
    category: category.value.trim(),
    brand: brand.value.trim(),
    unit: unit.value.trim(),
    price: Number(price.value),
    stock: Number(stock.value),
    technicalSheetUrl: technicalSheetUrl.value.trim() || null,
    imageUrls: parseUrls(imageUrlsRaw.value),
  })
}

async function remove() {
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar material?',
    text: 'Se quitará del catálogo y de vínculos con proveedores.',
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await deleteMut.mutateAsync(id.value)
  await router.replace(`${INTERIORISMO_BASE_PATH}/materiales/catalogo`)
}

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/materiales/catalogo`)

const sortedImages = computed(() =>
  detail.value ? [...detail.value.images].sort((a, b) => a.sortOrder - b.sortOrder) : [],
)
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[960px] mx-auto space-y-6">
    <div class="flex flex-wrap items-start gap-3 justify-between">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide" :style="{ color: 'var(--color-text-secondary)' }">
          Catálogo
        </p>
        <h1 class="text-xl font-bold mt-0.5" :style="{ color: 'var(--color-text-primary)' }">
          {{ detail?.code ?? '…' }} · {{ detail?.name ?? 'Cargando…' }}
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Precio ref. {{ formatSol(detail?.price) }} · Stock {{ formatQty(detail?.stock) }}
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
        <BaseButton variant="primary" type="button" :loading="updateMut.isPending.value" @click="save">
          Guardar cambios
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">Cargando…</div>

    <template v-else-if="detail">
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
          <FormInput v-model="category" label="Categoría" required />
          <FormInput v-model="brand" label="Marca" required />
        </div>
        <div class="grid sm:grid-cols-3 gap-4">
          <FormInput v-model="unit" label="Unidad" required />
          <FormInput v-model="price" type="number" label="Precio ref." required />
          <FormInput v-model="stock" type="number" label="Stock" />
        </div>
        <FormInput v-model="technicalSheetUrl" type="url" label="Ficha técnica (URL)" />
        <div v-if="technicalSheetUrl.trim()" class="text-sm">
          <a
            :href="technicalSheetUrl.trim()"
            target="_blank"
            rel="noopener noreferrer"
            class="underline"
            :style="{ color: 'var(--color-primary)' }"
          >
            Abrir ficha técnica
          </a>
        </div>
        <FormTextarea
          v-model="imageUrlsRaw"
          label="Imágenes (una URL por línea — reemplaza el orden actual)"
          :rows="5"
        />
      </div>
    </template>
  </div>
</template>
