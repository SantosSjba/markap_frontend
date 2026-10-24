<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, FormInput, FileDropzone, AppIcon } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { ARQUITECTURA_BASE_PATH } from '@modules/arquitectura/config/routes.constants'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import {
  useArquitecturaCatalogMaterialDetail,
  useUpdateArquitecturaCatalogMaterial,
  useDeleteArquitecturaCatalogMaterial,
  useUploadArquitecturaCatalogAsset,
} from '../../application/useArquitecturaCatalogMaterials'
import { formatSol, formatQty } from '../labels'
import { apiClient } from '@core/api/apiClient'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id ?? ''))

const { data: detail, isLoading } = useArquitecturaCatalogMaterialDetail(id)
const updateMut = useUpdateArquitecturaCatalogMaterial(id)
const deleteMut = useDeleteArquitecturaCatalogMaterial()
const uploadMut = useUploadArquitecturaCatalogAsset()

const name = ref('')
const category = ref('')
const brand = ref('')
const unit = ref('')
const price = ref(0)
const stock = ref(0)
const technicalSheetUrl = ref('')
const imageUrls = ref<string[]>([])
const sheetFile = ref<File | null>(null)
const imageFile = ref<File | null>(null)
const sheetError = ref('')
const imageError = ref('')

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
    imageUrls.value = [...d.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((i) => i.url)
  },
  { immediate: true },
)

async function openPath(path: string) {
  try {
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
    void markapAlert.toast.error('No se pudo resolver la URL del archivo')
  } catch (e) {
    void markapAlert.toast.error('No se pudo abrir', getApiErrorMessage(e))
  }
}

async function uploadSheet() {
  if (!sheetFile.value) {
    sheetError.value = 'Seleccione un archivo'
    return
  }
  sheetError.value = ''
  const res = await uploadMut.mutateAsync({
    file: sheetFile.value,
    kind: 'technical-sheet',
    materialId: id.value,
  })
  technicalSheetUrl.value = res.objectKey
  sheetFile.value = null
  if (res.downloadUrl) {
    // keep for immediate Ver
  }
  void markapAlert.toast.success('Ficha técnica lista (guarde para persistir)')
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
    materialId: id.value,
  })
  imageUrls.value = [...imageUrls.value, res.objectKey]
  imageFile.value = null
  void markapAlert.toast.success('Imagen agregada (guarde para persistir)')
}

function removeImage(idx: number) {
  imageUrls.value.splice(idx, 1)
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
    imageUrls: imageUrls.value,
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
  await router.replace(`${ARQUITECTURA_BASE_PATH}/materiales/catalogo`)
}

const goBack = () => router.push(`${ARQUITECTURA_BASE_PATH}/materiales/catalogo`)

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
        <button
          v-for="img in sortedImages"
          :key="img.id"
          type="button"
          class="aspect-square rounded-lg overflow-hidden border text-left"
          :style="{ borderColor: 'var(--color-border)' }"
          @click="openPath(img.url)"
        >
          <img
            v-if="/^https?:\/\//i.test(img.url)"
            :src="img.url"
            alt=""
            class="w-full h-full object-cover"
            loading="lazy"
          />
          <div
            v-else
            class="w-full h-full flex items-center justify-center text-xs px-2 text-center"
            :style="{ color: 'var(--color-text-secondary)' }"
          >
            Ver imagen
          </div>
        </button>
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
              v-if="technicalSheetUrl.trim()"
              variant="outline"
              type="button"
              @click="openPath(technicalSheetUrl.trim())"
            >
              Ver ficha
            </BaseButton>
          </div>
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
              <button type="button" class="truncate underline text-left" @click="openPath(u)">
                {{ u.split('/').pop() }}
              </button>
              <BaseButton type="button" variant="ghost" size="sm" @click="removeImage(idx)">
                Quitar
              </BaseButton>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>
