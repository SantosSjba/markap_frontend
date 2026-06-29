<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, FormInput, FormTextarea, AppIcon } from '@shared/components'
import { PRODUCCION_BASE_PATH } from '@modules/produccion/config/routes.constants'
import { useProduccionFurnitureCategoryOptions } from '@modules/produccion/features/configuracion'
import { useCreateProduccionCatalogItem } from '../../application/useProduccionCatalog'

const router = useRouter()
const createMut = useCreateProduccionCatalogItem()
const { options: categoryOptions, defaultCategory } = useProduccionFurnitureCategoryOptions()

const code = ref('')
const name = ref('')
const category = ref('')
const description = ref('')
const widthCm = ref<number | ''>('')
const depthCm = ref<number | ''>('')
const heightCm = ref<number | ''>('')
const referencePrice = ref<number>(0)
const technicalSheetUrl = ref('')
const notes = ref('')
const imageUrlsRaw = ref('')
const isActive = ref(true)

const saving = ref(false)

watch(
  defaultCategory,
  (value) => {
    if (!category.value && value) category.value = value
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

async function submit() {
  if (!code.value.trim() || !name.value.trim() || !category.value.trim()) {
    return
  }
  saving.value = true
  try {
    const created = await createMut.mutateAsync({
      code: code.value.trim(),
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
    await router.replace(`${PRODUCCION_BASE_PATH}/catalogo/${created.id}`)
  } finally {
    saving.value = false
  }
}

const goBack = () => router.push(`${PRODUCCION_BASE_PATH}/catalogo`)
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
          Nuevo mueble
        </h1>
        <p class="text-sm mt-0.5" :style="{ color: 'var(--color-text-secondary)' }">
          Defina la ficha base del producto para costeo y cotizaciones.
        </p>
      </div>
    </div>

    <div
      class="space-y-4 p-4 sm:p-6 rounded-xl border"
      :style="{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }"
    >
      <div class="grid sm:grid-cols-2 gap-4">
        <FormInput v-model="code" label="Código" required placeholder="MUE-..." />
        <FormInput v-model="name" label="Nombre" required placeholder="Descripción corta" />
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1.5" :style="{ color: 'var(--color-text-primary)' }">
            Categoría <span class="text-[var(--color-error)]">*</span>
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
      <FormInput v-model="technicalSheetUrl" type="url" label="Ficha técnica (URL)" placeholder="https://…" />
      <FormTextarea v-model="notes" label="Notas internas" :rows="2" />
      <FormTextarea
        v-model="imageUrlsRaw"
        label="Imágenes (una URL por línea)"
        :rows="4"
        placeholder="https://…"
      />
      <label class="flex items-center gap-2 text-sm cursor-pointer" :style="{ color: 'var(--color-text-primary)' }">
        <input v-model="isActive" type="checkbox" class="rounded" />
        Activo en catálogo
      </label>

      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="secondary" type="button" @click="goBack">Cancelar</BaseButton>
        <BaseButton variant="primary" type="button" :loading="saving" @click="submit">
          Crear mueble
        </BaseButton>
      </div>
    </div>
  </div>
</template>
