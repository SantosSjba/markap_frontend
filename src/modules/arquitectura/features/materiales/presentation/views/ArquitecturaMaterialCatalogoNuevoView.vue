<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BaseButton, FormInput, FileDropzone, AppIcon } from '@shared/components'
import { ARQUITECTURA_BASE_PATH } from '@modules/arquitectura/config/routes.constants'
import {
  useCreateArquitecturaCatalogMaterial,
  useUploadArquitecturaCatalogAsset,
} from '../../application/useArquitecturaCatalogMaterials'
import { apiClient } from '@core/api/apiClient'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'

const router = useRouter()
const createMut = useCreateArquitecturaCatalogMaterial()
const uploadMut = useUploadArquitecturaCatalogAsset()

const code = ref('')
const name = ref('')
const category = ref('')
const brand = ref('')
const unit = ref('und')
const price = ref<number>(0)
const stock = ref<number>(0)
const technicalSheetUrl = ref('')
const technicalSheetArchivoId = ref<string | null>(null)
const imageUrls = ref<string[]>([])
const sheetFile = ref<File | null>(null)
const imageFile = ref<File | null>(null)
const sheetError = ref('')
const imageError = ref('')

const saving = ref(false)

async function uploadSheet() {
  if (!sheetFile.value) {
    sheetError.value = 'Seleccione un archivo'
    return
  }
  sheetError.value = ''
  const res = await uploadMut.mutateAsync({
    file: sheetFile.value,
    kind: 'technical-sheet',
  })
  technicalSheetUrl.value = res.objectKey
  technicalSheetArchivoId.value = res.archivoId
  sheetFile.value = null
  void markapAlert.toast.success('Ficha técnica lista')
}

async function uploadImage() {
  if (!imageFile.value) {
    imageError.value = 'Seleccione un archivo'
    return
  }
  imageError.value = ''
  const res = await uploadMut.mutateAsync({
    file: imageFile.value,
    kind: 'image',
  })
  imageUrls.value = [...imageUrls.value, res.objectKey]
  imageFile.value = null
  void markapAlert.toast.success('Imagen agregada')
}

function removeImage(idx: number) {
  imageUrls.value.splice(idx, 1)
}

async function openStored(path: string, archivoId?: string | null) {
  try {
    if (archivoId) {
      const { data } = await apiClient.get<{ url: string }>(
        `/gen-archivos/${encodeURIComponent(archivoId)}/url`,
        { params: { applicationSlug: ARQUITECTURA_APP_SLUG } },
      )
      if (data?.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer')
        return
      }
    }
    if (/^https?:\/\//i.test(path)) {
      window.open(path, '_blank', 'noopener,noreferrer')
      return
    }
    const { data } = await apiClient.get<{ url: string }>('/gen-archivos/resolve-url', {
      params: { objectKey: path, applicationSlug: ARQUITECTURA_APP_SLUG },
    })
    if (data?.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer')
      return
    }
    void markapAlert.toast.error('No se pudo abrir el archivo')
  } catch (e) {
    void markapAlert.toast.error('No se pudo abrir', getApiErrorMessage(e))
  }
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
      imageUrls: imageUrls.value,
    })
    await router.replace(`${ARQUITECTURA_BASE_PATH}/materiales/catalogo/${created.id}`)
  } finally {
    saving.value = false
  }
}

const goBack = () => router.push(`${ARQUITECTURA_BASE_PATH}/materiales/catalogo`)
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
          Defina datos base; suba ficha técnica e imágenes a MinIO.
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

      <div class="space-y-2">
        <p class="text-sm font-medium">Ficha técnica</p>
        <FileDropzone
          v-model="sheetFile"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
          :max-size="25 * 1024 * 1024"
          :multiple="false"
          :error="sheetError"
          @error="(m: string) => (sheetError = m)"
        />
        <div class="flex flex-wrap gap-2">
          <BaseButton
            variant="secondary"
            type="button"
            :loading="uploadMut.isPending.value"
            @click="uploadSheet"
          >
            Subir ficha
          </BaseButton>
          <BaseButton
            v-if="technicalSheetUrl"
            variant="outline"
            type="button"
            @click="openStored(technicalSheetUrl, technicalSheetArchivoId)"
          >
            Ver ficha
          </BaseButton>
        </div>
        <p v-if="technicalSheetUrl" class="text-xs opacity-70 truncate">{{ technicalSheetUrl }}</p>
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium">Imágenes</p>
        <FileDropzone
          v-model="imageFile"
          accept=".png,.jpg,.jpeg,.webp"
          :max-size="25 * 1024 * 1024"
          :multiple="false"
          :error="imageError"
          @error="(m: string) => (imageError = m)"
        />
        <BaseButton
          variant="secondary"
          type="button"
          :loading="uploadMut.isPending.value"
          @click="uploadImage"
        >
          Agregar imagen
        </BaseButton>
        <ul v-if="imageUrls.length" class="space-y-1 text-sm">
          <li
            v-for="(u, idx) in imageUrls"
            :key="`${u}-${idx}`"
            class="flex items-center justify-between gap-2"
          >
            <span class="truncate">{{ u.split('/').pop() }}</span>
            <BaseButton type="button" variant="ghost" size="sm" @click="removeImage(idx)">
              Quitar
            </BaseButton>
          </li>
        </ul>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <BaseButton variant="secondary" type="button" @click="goBack">Cancelar</BaseButton>
        <BaseButton variant="primary" type="button" :loading="saving" @click="submit">
          Crear material
        </BaseButton>
      </div>
    </div>
  </div>
</template>
