<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import * as yup from 'yup'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import FileDropzone from '@shared/presentation/components/forms/FileDropzone.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import StoredImageThumb from '@shared/presentation/components/ui/StoredImageThumb.vue'
import { useCurrencyCatalog } from '@shared/presentation/composables/useCurrencyCatalog'
import { useOpenStoredFile } from '@shared/presentation/composables/useOpenStoredFile'
import { formatMoney } from '@shared/utils/money'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import { unitOptions } from '../../domain/units'
import type {
  CreateInteriorCatalogMaterialPayload,
  InteriorCatalogMaterialDetail,
} from '../../domain/catalog.types'
import { useInteriorCatalogMaterialStats, useUploadInteriorCatalogAsset } from '../composables/useInteriorCatalogMaterials'
/**
 * InteriorMaterialForm — alta y edición de materiales del catálogo: datos, precio de referencia
 * en su moneda, stock, ficha técnica e imágenes. En modal (alta rápida) se omiten los archivos.
 */

const props = withDefaults(
  defineProps<{
    initial?: InteriorCatalogMaterialDetail | null
    submitLabel: string
    submitting?: boolean
    canWrite?: boolean
    variant?: 'page' | 'modal'
    formId?: string
  }>(),
  { initial: null, submitting: false, canWrite: true, variant: 'page', formId: undefined },
)
const emit = defineEmits<{ submit: [payload: CreateInteriorCatalogMaterialPayload]; cancel: [] }>()

const isModal = computed(() => props.variant === 'modal')
const isEditing = computed(() => !!props.initial)
const { options: currencyOptions } = useCurrencyCatalog()
const { data: stats } = useInteriorCatalogMaterialStats()
const categoryListId = `material-categories-${Math.random().toString(36).slice(2)}`

const schema = yup.object({
  code: yup.string().trim().required('Ingrese el código').max(60),
  name: yup.string().trim().required('Ingrese el nombre').max(200),
  category: yup.string().trim().required('Ingrese la categoría').max(80),
  brand: yup.string().trim().required('Ingrese la marca (o «Genérico»)').max(80),
  unit: yup.string().required('Seleccione la unidad'),
  currency: yup.string().required(),
  price: yup.number().typeError('Ingrese el precio').min(0, 'No puede ser negativo').required('Ingrese el precio'),
  stock: yup
    .number()
    .transform((v, raw) => (raw === '' || raw == null || Number.isNaN(v) ? undefined : v))
    .nullable(),
  description: yup.string().trim().max(2000),
})

const { handleSubmit, errors, values, resetForm, defineComponentBinds } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: { code: '', name: '', category: '', brand: '', unit: 'und', currency: 'PEN', price: undefined as unknown as number, stock: 0, description: '' },
})
const b = defineComponentBinds
const codeB = b('code')
const nameB = b('name')
const categoryB = b('category')
const brandB = b('brand')
const unitB = b('unit')
const currencyB = b('currency')
const priceB = b('price')
const stockB = b('stock')
const descriptionB = b('description')

// ── Archivos (ficha técnica e imágenes) ──
const technicalSheetUrl = ref<string | null>(null)
const imageUrls = ref<string[]>([])
const sheetFile = ref<File | null>(null)
const imageFile = ref<File | null>(null)
const uploadMut = useUploadInteriorCatalogAsset()
const { openStoredFile } = useOpenStoredFile(INTERIORISMO_APP_SLUG)

watch(sheetFile, async (file) => {
  if (!file) return
  const res = await uploadMut.mutateAsync({ file, kind: 'technical-sheet', materialId: props.initial?.id })
  technicalSheetUrl.value = res.objectKey
  sheetFile.value = null
})
watch(imageFile, async (file) => {
  if (!file) return
  const res = await uploadMut.mutateAsync({ file, kind: 'image', materialId: props.initial?.id })
  imageUrls.value = [...imageUrls.value, res.objectKey]
  imageFile.value = null
})

watch(
  () => props.initial,
  (m) => {
    if (!m) return
    resetForm({
      values: {
        code: m.code,
        name: m.name,
        category: m.category,
        brand: m.brand,
        unit: m.unit,
        currency: m.currency || 'PEN',
        price: m.price,
        stock: m.stock,
        description: m.description ?? '',
      },
    })
    technicalSheetUrl.value = m.technicalSheetUrl
    imageUrls.value = [...m.images].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.url)
  },
  { immediate: true },
)

const pricePreview = computed(() =>
  values.price != null && `${values.price}` !== '' ? `${formatMoney(Number(values.price), values.currency)} / ${values.unit}` : '—',
)

const onSubmit = handleSubmit((v) => {
  emit('submit', {
    code: v.code.trim(),
    name: v.name.trim(),
    category: v.category.trim(),
    brand: v.brand.trim(),
    unit: v.unit,
    currency: v.currency,
    price: Number(v.price),
    stock: v.stock != null ? Number(v.stock) : 0,
    description: v.description?.trim() || null,
    ...(isModal.value ? {} : { technicalSheetUrl: technicalSheetUrl.value, imageUrls: imageUrls.value }),
  })
})
</script>

<template>
  <form
    :id="formId"
    :class="isModal ? 'space-y-5' : 'grid grid-cols-1 items-start gap-6 xl:grid-cols-3'"
    novalidate
    @submit.prevent="onSubmit"
  >
    <div :class="isModal ? 'space-y-5' : 'space-y-6 xl:col-span-2'">
      <FormSectionCard title="Datos del material o producto" subtitle="Cómo se identifica en el catálogo">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput v-bind="codeB" label="Código" placeholder="MAT-PIN-001" :disabled="isEditing" :error="errors.code" required />
          <FormInput v-bind="nameB" label="Nombre" placeholder="Pintura látex lavable blanco" :error="errors.name" required />
          <div>
            <FormInput v-bind="categoryB" label="Categoría" placeholder="Pinturas" :list="categoryListId" :error="errors.category" required />
            <datalist :id="categoryListId">
              <option v-for="c in stats?.categories ?? []" :key="c" :value="c" />
            </datalist>
          </div>
          <FormInput v-bind="brandB" label="Marca" placeholder="CPP, Vencedor, Genérico…" :error="errors.brand" required />
          <FormTextarea v-bind="descriptionB" class="md:col-span-2" label="Descripción" placeholder="Acabado, medidas, color, uso recomendado…" :rows="2" />
        </div>
      </FormSectionCard>

      <FormSectionCard title="Precio y stock" subtitle="Precio de referencia para presupuestos">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
          <FormSelect v-bind="unitB" label="Unidad" :options="unitOptions(values.unit)" :error="errors.unit" required />
          <FormSelect v-bind="currencyB" label="Moneda" :options="currencyOptions" required />
          <FormInput v-bind="priceB" type="number" inputmode="decimal" label="Precio ref." placeholder="0.00" :error="errors.price" required />
          <FormInput v-bind="stockB" type="number" inputmode="decimal" label="Stock" placeholder="0" :error="errors.stock" />
        </div>
      </FormSectionCard>

      <FormSectionCard v-if="!isModal" title="Ficha técnica e imágenes" subtitle="PDF o imágenes del producto">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Ficha técnica</p>
            <div v-if="technicalSheetUrl" class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
              <span class="min-w-0 flex-1 truncate text-gray-600 dark:text-gray-400">{{ technicalSheetUrl.split('/').pop() }}</span>
              <IconButton icon="lucide:external-link" label="Ver ficha" @click="openStoredFile({ url: technicalSheetUrl, filePath: technicalSheetUrl })" />
              <IconButton v-if="canWrite" icon="lucide:x" label="Quitar ficha" @click="technicalSheetUrl = null" />
            </div>
            <FileDropzone v-if="canWrite" v-model="sheetFile" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" :max-size="25 * 1024 * 1024" :multiple="false" />
          </div>
          <div class="space-y-2">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Imágenes</p>
            <div v-if="imageUrls.length" class="grid grid-cols-4 gap-2">
              <div v-for="(u, i) in imageUrls" :key="`${u}-${i}`" class="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                <StoredImageThumb :path="u" :application-slug="INTERIORISMO_APP_SLUG" />
                <button
                  v-if="canWrite"
                  type="button"
                  class="absolute top-1 right-1 hidden rounded-full bg-black/60 p-1 text-white group-hover:block"
                  aria-label="Quitar imagen"
                  @click="imageUrls.splice(i, 1)"
                >
                  ✕
                </button>
              </div>
            </div>
            <FileDropzone v-if="canWrite" v-model="imageFile" accept=".png,.jpg,.jpeg,.webp" :max-size="25 * 1024 * 1024" :multiple="false" />
          </div>
        </div>
        <p v-if="uploadMut.isPending.value" class="mt-2 text-theme-xs text-brand-500">Subiendo archivo…</p>
      </FormSectionCard>
    </div>

    <aside v-if="!isModal" class="space-y-6 xl:sticky xl:top-24">
      <FormSectionCard title="Resumen">
        <dl class="space-y-3 text-sm">
          <div><dt class="text-theme-xs text-gray-400">Material</dt><dd class="font-semibold text-gray-800 dark:text-white/90">{{ values.code || '—' }} · {{ values.name || '—' }}</dd></div>
          <div><dt class="text-theme-xs text-gray-400">Categoría · Marca</dt><dd class="text-gray-800 dark:text-white/90">{{ values.category || '—' }} · {{ values.brand || '—' }}</dd></div>
          <div><dt class="text-theme-xs text-gray-400">Precio de referencia</dt><dd class="font-bold text-brand-500 dark:text-brand-400">{{ pricePreview }}</dd></div>
        </dl>
      </FormSectionCard>
      <div class="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3">
        <BaseButton v-if="canWrite" type="submit" variant="primary" icon="lucide:save" block :loading="submitting" :disabled="uploadMut.isPending.value" loading-text="Guardando...">
          {{ submitLabel }}
        </BaseButton>
        <BaseButton variant="outline" type="button" block @click="emit('cancel')">Cancelar</BaseButton>
      </div>
    </aside>
  </form>
</template>
