<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import { PRODUCCION_BASE_PATH } from '../../../../config/routes.constants'
import { useProduccionFurnitureCategoryOptions } from '../../../configuracion/presentation/composables/useProduccionConfigOptions'
import { useCreateProduccionCatalogItem } from '../composables/useProduccionCatalog'
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
  <div class="space-y-6">
    <PageHeader
      title="Nuevo mueble"
      subtitle="Defina la ficha base del producto para costeo y cotizaciones."
      back
      @back="goBack"
      class="mb-6"
    />

    <BaseCard class="block space-y-4">
      <div class="grid sm:grid-cols-2 gap-4">
        <FormInput v-model="code" label="Código" required placeholder="MUE-..." />
        <FormInput v-model="name" label="Nombre" required placeholder="Descripción corta" />
      </div>
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1.5 text-gray-800 dark:text-white/90">
            Categoría <span class="text-error-500 dark:text-error-400">*</span>
          </label>
          <FormSelect
            v-model="category"
            :options="categoryOptions"
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
      <FormInput v-model="technicalSheetUrl" type="url" label="Ficha técnica (URL)" placeholder="https://…" />
      <FormTextarea v-model="notes" label="Notas internas" :rows="2" />
      <FormTextarea
        v-model="imageUrlsRaw"
        label="Imágenes (una URL por línea)"
        :rows="4"
        placeholder="https://…"
      />
      <FormCheckbox v-model="isActive" label="Activo en catálogo" />

      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="secondary" type="button" @click="goBack">Cancelar</BaseButton>
        <BaseButton variant="primary" type="button" :loading="saving" @click="submit">
          Crear mueble
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>
