<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, FormInput, FormTextarea, AppIcon } from '@shared/components'
import { INTERIORISMO_BASE_PATH } from '@modules/interiorismo/config/routes.constants'
import { useCreateInteriorCatalogMaterial } from '../../application/useInteriorCatalogMaterials'

const router = useRouter()
const createMut = useCreateInteriorCatalogMaterial()

const code = ref('')
const name = ref('')
const category = ref('')
const brand = ref('')
const unit = ref('und')
const price = ref<number>(0)
const stock = ref<number>(0)
const technicalSheetUrl = ref('')
const imageUrlsRaw = ref('')

const saving = ref(false)

function parseUrls(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

async function submit() {
  if (!code.value.trim() || !name.value.trim() || !category.value.trim() || !brand.value.trim()) {
    return
  }
  saving.value = true
  try {
    const created = await createMut.mutateAsync({
      code: code.value.trim(),
      name: name.value.trim(),
      category: category.value.trim(),
      brand: brand.value.trim(),
      unit: unit.value.trim() || 'und',
      price: Number(price.value),
      stock: Number(stock.value),
      technicalSheetUrl: technicalSheetUrl.value.trim() || null,
      imageUrls: parseUrls(imageUrlsRaw.value),
    })
    await router.replace(`${INTERIORISMO_BASE_PATH}/materiales/catalogo/${created.id}`)
  } finally {
    saving.value = false
  }
}

const goBack = () => router.push(`${INTERIORISMO_BASE_PATH}/materiales/catalogo`)
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 max-w-[1600px] mx-auto space-y-6">
    <div class="flex items-center gap-4 mb-6">
      <button
        type="button"
        class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
        :style="{ color: 'var(--color-text-secondary)' }"
        @click="goBack"
      >
        <AppIcon icon="lucide:arrow-left" :size="20" color="currentColor" />
      </button>
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Nuevo material
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Defina datos base e imágenes (URLs). La ficha técnica puede ser un PDF o enlace externo.
        </p>
      </div>
    </div>

    <div
      class="space-y-4 p-4 sm:p-6 rounded-xl border"
      :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
    >
      <div class="grid sm:grid-cols-2 gap-4">
        <FormInput v-model="code" label="Código" required placeholder="MAT-..." />
        <FormInput v-model="name" label="Nombre" required placeholder="Descripción corta" />
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        <FormInput v-model="category" label="Categoría" required />
        <FormInput v-model="brand" label="Marca" required />
      </div>
      <div class="grid sm:grid-cols-3 gap-4">
        <FormInput v-model="unit" label="Unidad" required placeholder="m², gal, und…" />
        <FormInput v-model="price" type="number" label="Precio ref." required />
        <FormInput v-model="stock" type="number" label="Stock" />
      </div>
      <FormInput v-model="technicalSheetUrl" type="url" label="Ficha técnica (URL)" placeholder="https://…" />
      <FormTextarea
        v-model="imageUrlsRaw"
        label="Imágenes (una URL por línea)"
        :rows="4"
        placeholder="https://…"
      />

      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="secondary" type="button" @click="goBack">Cancelar</BaseButton>
        <BaseButton variant="primary" type="button" :loading="saving" @click="submit">
          Crear material
        </BaseButton>
      </div>
    </div>
  </div>
</template>
