<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('produccion')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { ref, watch, computed } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import {
  useProduccionConfigBootstrap,
  useProduccionSaveSettings,
  useProduccionSaveFurnitureCategories,
  useProduccionSaveMaterialCategories,
  useProduccionSaveProductionStages,
  useProduccionSaveUnits,
  useProduccionPatchNumbering,
} from '../composables/useProduccionConfig'
import type {
  ProduccionFurnitureCategoryDTO,
  ProduccionMaterialCategoryDTO,
  ProduccionProductionStageDTO,
  ProduccionUnitDTO,
} from '../../domain/config.types'
import { PRODUCCION_NUMBERING_LABELS } from '../../domain/config.types'
const activeTab = ref('parametros')

const tabs = [
  { id: 'parametros', label: 'Parámetros', icon: 'lucide:sliders-horizontal' },
  { id: 'categorias', label: 'Cat. muebles', icon: 'lucide:tags' },
  { id: 'categorias-materiales', label: 'Cat. materiales', icon: 'lucide:boxes' },
  { id: 'etapas', label: 'Etapas OT', icon: 'lucide:workflow' },
  { id: 'unidades', label: 'Unidades', icon: 'lucide:ruler' },
  { id: 'numeracion', label: 'Numeración', icon: 'lucide:hash' },
]

const { data: boot, isLoading, isError, error, refetch } = useProduccionConfigBootstrap()
const configLoadError = computed(() => (isError.value ? getApiErrorMessage(error.value) : ''))

const { mutate: saveSettings, isPending: savingSettings } = useProduccionSaveSettings()
const { mutate: saveCategories, isPending: savingCategories } =
  useProduccionSaveFurnitureCategories()
const { mutate: saveMaterialCategories, isPending: savingMaterialCategories } =
  useProduccionSaveMaterialCategories()
const { mutate: saveStages, isPending: savingStages } = useProduccionSaveProductionStages()
const { mutate: saveUnits, isPending: savingUnits } = useProduccionSaveUnits()
const { mutate: patchNumbering, isPending: savingNumbering } = useProduccionPatchNumbering()

const settingsDraft = ref({ igvPercent: 18, woodWastePercent: 10, quotationValidDays: 15 })
const categoriesDraft = ref<ProduccionFurnitureCategoryDTO[]>([])
const materialCategoriesDraft = ref<ProduccionMaterialCategoryDTO[]>([])
const stagesDraft = ref<ProduccionProductionStageDTO[]>([])
const unitsDraft = ref<ProduccionUnitDTO[]>([])
const numberingDraft = ref<
  Record<string, { prefix: string; lastNumber: number; padLength: number; includeYear: boolean }>
>({})

watch(
  () => boot.value?.settings,
  (s) => {
    if (s) settingsDraft.value = { ...s }
  },
  { immediate: true },
)

watch(
  () => boot.value?.furnitureCategories,
  (rows) => {
    if (rows?.length) categoriesDraft.value = rows.map((r) => ({ ...r }))
  },
  { immediate: true },
)

watch(
  () => boot.value?.materialCategories,
  (rows) => {
    if (rows?.length) materialCategoriesDraft.value = rows.map((r) => ({ ...r }))
  },
  { immediate: true },
)

watch(
  () => boot.value?.productionStages,
  (rows) => {
    if (rows?.length) stagesDraft.value = rows.map((r) => ({ ...r }))
  },
  { immediate: true },
)

watch(
  () => boot.value?.units,
  (rows) => {
    if (rows?.length) unitsDraft.value = rows.map((r) => ({ ...r }))
  },
  { immediate: true },
)

watch(
  () => boot.value?.numbering,
  (rows) => {
    if (!rows?.length) return
    const map: typeof numberingDraft.value = {}
    for (const n of rows) {
      map[n.seriesKey] = {
        prefix: n.prefix,
        lastNumber: n.lastNumber,
        padLength: n.padLength,
        includeYear: n.includeYear,
      }
    }
    numberingDraft.value = map
  },
  { immediate: true },
)

function reorder<T extends { sortOrder: number }>(arr: T[], idx: number, dir: -1 | 1) {
  const j = idx + dir
  if (j < 0 || j >= arr.length) return
  const t = arr[idx]!
  arr[idx] = arr[j]!
  arr[j] = t
  arr.forEach((row, i) => {
    row.sortOrder = i
  })
}

function submitSettings() {
  saveSettings(settingsDraft.value, { onSuccess: () => void refetch() })
}

function submitCategories() {
  if (!categoriesDraft.value.length) {
    void markapAlert.toast.warning('Debe incluir al menos una categoría')
    return
  }
  saveCategories(
    categoriesDraft.value.map((c, i) => ({ ...c, sortOrder: i })),
    { onSuccess: () => void refetch() },
  )
}

function submitMaterialCategories() {
  if (!materialCategoriesDraft.value.length) {
    void markapAlert.toast.warning('Debe incluir al menos una categoría')
    return
  }
  saveMaterialCategories(
    materialCategoriesDraft.value.map((c, i) => ({ ...c, sortOrder: i })),
    { onSuccess: () => void refetch() },
  )
}

function submitStages() {
  saveStages(
    [...stagesDraft.value]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s, i) => ({ ...s, sortOrder: i })),
    { onSuccess: () => void refetch() },
  )
}

function submitUnits() {
  if (!unitsDraft.value.length) {
    void markapAlert.toast.warning('Debe incluir al menos una unidad')
    return
  }
  saveUnits(
    unitsDraft.value.map((u, i) => ({ ...u, sortOrder: i })),
    { onSuccess: () => void refetch() },
  )
}

function addCategory() {
  categoriesDraft.value.push({
    code: '',
    label: '',
    sortOrder: categoriesDraft.value.length,
    isActive: true,
  })
}

function addMaterialCategory() {
  materialCategoriesDraft.value.push({
    code: '',
    label: '',
    sortOrder: materialCategoriesDraft.value.length,
    isActive: true,
  })
}

function addUnit() {
  unitsDraft.value.push({
    code: '',
    label: '',
    sortOrder: unitsDraft.value.length,
    isActive: true,
  })
}

function saveNumberingSeries(seriesKey: string) {
  const draft = numberingDraft.value[seriesKey]
  if (!draft) return
  patchNumbering({ seriesKey, body: { ...draft } }, { onSuccess: () => void refetch() })
}

const numberingRows = computed(() => boot.value?.numbering ?? [])
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Configuración — Producción"
    >
      <template #actions>
        <p class="text-sm mt-1 text-gray-500 dark:text-gray-400">
        Parámetros del módulo: categorías de muebles y materiales, etapas de taller, unidades y series documentales.
      </p>
      </template>
    </PageHeader>

    <BaseTabs v-model="activeTab" :tabs="tabs" />

    <LoadingState v-if="isLoading" />

    <BaseCard v-else-if="isError" padding="lg" class="block text-center space-y-3">
      <p class="text-sm font-medium text-gray-800 dark:text-white/90">
        No se pudo cargar la configuración
      </p>
      <p class="text-xs max-w-lg mx-auto text-gray-500 dark:text-gray-400">
        {{ configLoadError }}
      </p>
      <BaseButton type="button" @click="() => refetch()">Reintentar</BaseButton>
    </BaseCard>

    <template v-else>
      <div v-if="activeTab === 'parametros'" class="space-y-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Valores por defecto para costeo y cotizaciones.
        </p>
        <BaseCard padding="sm" class="block space-y-4 max-w-md">
          <FormInput v-model="settingsDraft.igvPercent" type="number" min="0" max="100" step="0.01" label="IGV (%)" />
          <FormInput v-model="settingsDraft.woodWastePercent" type="number" min="0" max="100" step="0.1" label="% desperdicio madera" />
          <FormInput v-model="settingsDraft.quotationValidDays" type="number" min="1" label="Vigencia cotización (días)" />
          <BaseButton v-if="canWrite" variant="primary" :loading="savingSettings" @click="submitSettings">
            Guardar parámetros
          </BaseButton>
        </BaseCard>
      </div>

      <div v-else-if="activeTab === 'categorias'" class="space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Categorías del catálogo de muebles (código técnico + etiqueta visible).
        </p>
        <BaseCard padding="none" class="block overflow-hidden">
          <Table class="w-full text-sm">
            <TableHeader>
              <TableRow class="border-b text-left border-gray-200 dark:border-gray-800">
                <TableCell is-header class="py-2 px-3">Código</TableCell>
                <TableCell is-header class="py-2 px-3">Etiqueta</TableCell>
                <TableCell is-header class="py-2 px-3 w-20">Activa</TableCell>
                <TableCell is-header class="py-2 px-3 w-28"></TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(row, idx) in categoriesDraft"
                :key="row.id ?? `cat-${idx}`"
                class="border-b border-gray-200 dark:border-gray-800"
              >
                <TableCell class="py-2 px-3">
                  <FormInput v-model="row.code" type="text" size="sm" input-class="font-mono" />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <FormInput v-model="row.label" type="text" size="sm" />
                </TableCell>
                <TableCell class="py-2 px-3 text-center">
                  <FormCheckbox v-model="row.isActive" class="justify-center" />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <div class="flex gap-1">
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(categoriesDraft, idx, -1)">
                      ↑
                    </BaseButton>
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(categoriesDraft, idx, 1)">
                      ↓
                    </BaseButton>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div class="p-3 border-t flex justify-between border-gray-200 dark:border-gray-800">
            <BaseButton type="button" variant="ghost" @click="addCategory">+ Categoría</BaseButton>
            <BaseButton v-if="canWrite" variant="primary" :loading="savingCategories" @click="submitCategories">
              Guardar categorías
            </BaseButton>
          </div>
        </BaseCard>
      </div>

      <div v-else-if="activeTab === 'categorias-materiales'" class="space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Categorías del inventario de materiales (tableros, herrajes, etc.). La etiqueta se guarda en cada material.
        </p>
        <BaseCard padding="none" class="block overflow-hidden">
          <Table class="w-full text-sm">
            <TableHeader>
              <TableRow class="border-b text-left border-gray-200 dark:border-gray-800">
                <TableCell is-header class="py-2 px-3">Código</TableCell>
                <TableCell is-header class="py-2 px-3">Etiqueta</TableCell>
                <TableCell is-header class="py-2 px-3 w-20">Activa</TableCell>
                <TableCell is-header class="py-2 px-3 w-28"></TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(row, idx) in materialCategoriesDraft"
                :key="row.id ?? `mat-cat-${idx}`"
                class="border-b border-gray-200 dark:border-gray-800"
              >
                <TableCell class="py-2 px-3">
                  <FormInput v-model="row.code" type="text" size="sm" input-class="font-mono" />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <FormInput v-model="row.label" type="text" size="sm" />
                </TableCell>
                <TableCell class="py-2 px-3 text-center">
                  <FormCheckbox v-model="row.isActive" class="justify-center" />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <div class="flex gap-1">
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(materialCategoriesDraft, idx, -1)">
                      ↑
                    </BaseButton>
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(materialCategoriesDraft, idx, 1)">
                      ↓
                    </BaseButton>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div class="p-3 border-t flex justify-between border-gray-200 dark:border-gray-800">
            <BaseButton type="button" variant="ghost" @click="addMaterialCategory">+ Categoría</BaseButton>
            <BaseButton v-if="canWrite" variant="primary" :loading="savingMaterialCategories" @click="submitMaterialCategories">
              Guardar categorías
            </BaseButton>
          </div>
        </BaseCard>
      </div>

      <div v-else-if="activeTab === 'etapas'" class="space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Etapas de las órdenes de trabajo. Los códigos técnicos (planificacion, corte, …) no cambian; solo etiquetas y orden.
        </p>
        <BaseCard padding="none" class="block overflow-hidden">
          <Table class="w-full text-sm">
            <TableHeader>
              <TableRow class="border-b text-left border-gray-200 dark:border-gray-800">
                <TableCell is-header class="py-2 px-3">Código</TableCell>
                <TableCell is-header class="py-2 px-3">Etiqueta</TableCell>
                <TableCell is-header class="py-2 px-3 w-28"></TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(row, idx) in stagesDraft"
                :key="row.stageKey"
                class="border-b border-gray-200 dark:border-gray-800"
              >
                <TableCell class="py-2 px-3 font-mono text-xs">{{ row.stageKey }}</TableCell>
                <TableCell class="py-2 px-3">
                  <FormInput v-model="row.label" type="text" size="sm" />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <div class="flex gap-1">
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(stagesDraft, idx, -1)">
                      ↑
                    </BaseButton>
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(stagesDraft, idx, 1)">
                      ↓
                    </BaseButton>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div class="p-3 border-t flex justify-end border-gray-200 dark:border-gray-800">
            <BaseButton v-if="canWrite" variant="primary" :loading="savingStages" @click="submitStages">Guardar etapas</BaseButton>
          </div>
        </BaseCard>
      </div>

      <div v-else-if="activeTab === 'unidades'" class="space-y-3">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Unidades para materiales e inventario.
        </p>
        <BaseCard padding="none" class="block overflow-hidden">
          <Table class="w-full text-sm">
            <TableHeader>
              <TableRow class="border-b text-left border-gray-200 dark:border-gray-800">
                <TableCell is-header class="py-2 px-3">Código</TableCell>
                <TableCell is-header class="py-2 px-3">Etiqueta</TableCell>
                <TableCell is-header class="py-2 px-3 w-20">Activa</TableCell>
                <TableCell is-header class="py-2 px-3 w-28"></TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(row, idx) in unitsDraft"
                :key="row.id ?? `unit-${idx}`"
                class="border-b border-gray-200 dark:border-gray-800"
              >
                <TableCell class="py-2 px-3">
                  <FormInput v-model="row.code" type="text" size="sm" input-class="font-mono" />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <FormInput v-model="row.label" type="text" size="sm" />
                </TableCell>
                <TableCell class="py-2 px-3 text-center">
                  <FormCheckbox v-model="row.isActive" class="justify-center" />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <div class="flex gap-1">
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(unitsDraft, idx, -1)">
                      ↑
                    </BaseButton>
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(unitsDraft, idx, 1)">
                      ↓
                    </BaseButton>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <div class="p-3 border-t flex justify-between border-gray-200 dark:border-gray-800">
            <BaseButton type="button" variant="ghost" @click="addUnit">+ Unidad</BaseButton>
            <BaseButton v-if="canWrite" variant="primary" :loading="savingUnits" @click="submitUnits">Guardar unidades</BaseButton>
          </div>
        </BaseCard>
      </div>

      <div v-else-if="activeTab === 'numeracion'" class="space-y-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Prefijos y correlativos para códigos automáticos al crear documentos.
        </p>
        <BaseCard v-for="series in numberingRows" :key="series.seriesKey" padding="sm" class="block space-y-3">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="font-semibold text-sm text-gray-800 dark:text-white/90">
              {{ PRODUCCION_NUMBERING_LABELS[series.seriesKey] ?? series.seriesKey }}
            </h3>
            <p class="text-xs text-gray-400 dark:text-gray-500">
              Próximo: <strong class="text-gray-800 dark:text-white/90">{{ series.nextPreview }}</strong>
            </p>
          </div>
          <div v-if="numberingDraft[series.seriesKey]" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FormInput v-model="numberingDraft[series.seriesKey]!.prefix" type="text" label="Prefijo" />
            <FormInput v-model="numberingDraft[series.seriesKey]!.lastNumber" type="number" min="0" label="Último número" />
            <FormInput v-model="numberingDraft[series.seriesKey]!.padLength" type="number" min="1" max="8" label="Dígitos" />
            <FormCheckbox v-model="numberingDraft[series.seriesKey]!.includeYear" label="Incluir año" />
          </div>
          <BaseButton v-if="canWrite"
            variant="primary"
            size="sm"
            :loading="savingNumbering"
            @click="saveNumberingSeries(series.seriesKey)"
          >
            Guardar serie
          </BaseButton>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
