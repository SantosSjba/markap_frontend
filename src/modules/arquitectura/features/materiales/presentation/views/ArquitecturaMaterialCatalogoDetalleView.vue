<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { useService } from '@shared/presentation/di/services'
import { FILE_ACCESS } from '@shared/application/ports/file-access.port'
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { ARQUITECTURA_BASE_PATH } from '../../../../config/routes.constants'
import {
  useArquitecturaCatalogMaterialDetail,
  useUpdateArquitecturaCatalogMaterial,
  useDeleteArquitecturaCatalogMaterial,
  useUploadArquitecturaCatalogAsset,
} from '../composables/useArquitecturaCatalogMaterials'
import { formatSol, formatQty } from '../labels'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
const fileAccess = useService(FILE_ACCESS)

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
    imageUrls.value = [...d.images].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.url)
  },
  { immediate: true },
)

async function openPath(path: string) {
  try {
    if (/^https?:\/\//i.test(path)) {
      window.open(path, '_blank', 'noopener,noreferrer')
      return
    }
    const data = await fileAccess.resolveDownloadUrl(path, { applicationSlug: 'arquitectura' })
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
  <div class="max-w-[960px] mx-auto space-y-6">
    <PageHeader
      :title="`${detail?.code ?? '…'} · ${detail?.name ?? 'Cargando…'}`"
      :subtitle="`Precio ref. ${formatSol(detail?.price)} · Stock ${formatQty(detail?.stock)}`"
      eyebrow="Catálogo"
    >
      <template #actions>
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
      </template>
    </PageHeader>

    <div v-if="isLoading" class="text-sm text-gray-500 dark:text-gray-400">Cargando…</div>

    <template v-else-if="detail">
      <BaseCard v-if="sortedImages.length" padding="sm" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          v-for="img in sortedImages"
          :key="img.id"
          type="button"
          class="aspect-square rounded-lg overflow-hidden border text-left border-gray-200 dark:border-gray-800"
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
            class="w-full h-full flex items-center justify-center text-xs px-2 text-center text-gray-500 dark:text-gray-400"
          >
            Ver imagen
          </div>
        </button>
      </BaseCard>

      <BaseCard class="block space-y-4">
        <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Edición</p>
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
              <BaseButton @click="openPath(u)" variant="link">{{ u.split('/').pop() }}</BaseButton>
              <BaseButton type="button" variant="ghost" size="sm" @click="removeImage(idx)">
                Quitar
              </BaseButton>
            </li>
          </ul>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
