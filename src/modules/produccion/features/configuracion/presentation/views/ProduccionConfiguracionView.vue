<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { BaseButton, AppIcon, BaseTabs } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import {
  useProduccionConfigBootstrap,
  useProduccionSaveSettings,
  useProduccionSaveFurnitureCategories,
  useProduccionSaveProductionStages,
  useProduccionSaveUnits,
  useProduccionPatchNumbering,
} from '../../application/useProduccionConfig'
import type {
  ProduccionFurnitureCategoryDTO,
  ProduccionProductionStageDTO,
  ProduccionUnitDTO,
} from '../../domain/config.types'
import { PRODUCCION_NUMBERING_LABELS } from '../../domain/config.types'

const activeTab = ref('parametros')

const tabs = [
  { id: 'parametros', label: 'Parámetros', icon: 'lucide:sliders-horizontal' },
  { id: 'categorias', label: 'Categorías', icon: 'lucide:tags' },
  { id: 'etapas', label: 'Etapas OT', icon: 'lucide:workflow' },
  { id: 'unidades', label: 'Unidades', icon: 'lucide:ruler' },
  { id: 'numeracion', label: 'Numeración', icon: 'lucide:hash' },
]

const { data: boot, isLoading, isError, error, refetch } = useProduccionConfigBootstrap()
const configLoadError = computed(() => (isError.value ? getApiErrorMessage(error.value) : ''))

const { mutate: saveSettings, isPending: savingSettings } = useProduccionSaveSettings()
const { mutate: saveCategories, isPending: savingCategories } = useProduccionSaveFurnitureCategories()
const { mutate: saveStages, isPending: savingStages } = useProduccionSaveProductionStages()
const { mutate: saveUnits, isPending: savingUnits } = useProduccionSaveUnits()
const { mutate: patchNumbering, isPending: savingNumbering } = useProduccionPatchNumbering()

const settingsDraft = ref({ igvPercent: 18, woodWastePercent: 10, quotationValidDays: 15 })
const categoriesDraft = ref<ProduccionFurnitureCategoryDTO[]>([])
const stagesDraft = ref<ProduccionProductionStageDTO[]>([])
const unitsDraft = ref<ProduccionUnitDTO[]>([])
const numberingDraft = ref<Record<string, { prefix: string; lastNumber: number; padLength: number; includeYear: boolean }>>({})

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

function submitStages() {
  saveStages(
    [...stagesDraft.value].sort((a, b) => a.sortOrder - b.sortOrder).map((s, i) => ({ ...s, sortOrder: i })),
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
  patchNumbering(
    { seriesKey, body: { ...draft } },
    { onSuccess: () => void refetch() },
  )
}

const numberingRows = computed(() => boot.value?.numbering ?? [])
</script>

<template>
  <div class="space-y-6 max-w-5xl">
    <div>
      <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
        Configuración — Producción
      </h1>
      <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
        Parámetros del módulo: categorías de muebles, etapas de taller, unidades de medida y series documentales.
      </p>
    </div>

    <BaseTabs v-model="activeTab" :tabs="tabs" />

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div
      v-else-if="isError"
      class="rounded-xl border p-8 text-center space-y-3"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <p class="text-sm font-medium" :style="{ color: 'var(--color-text-primary)' }">
        No se pudo cargar la configuración
      </p>
      <p class="text-xs max-w-lg mx-auto" :style="{ color: 'var(--color-text-secondary)' }">
        {{ configLoadError }}
      </p>
      <BaseButton type="button" @click="() => refetch()">Reintentar</BaseButton>
    </div>

    <template v-else>
      <div v-if="activeTab === 'parametros'" class="space-y-4">
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Valores por defecto para costeo y cotizaciones.
        </p>
        <div
          class="rounded-xl border p-4 space-y-4 max-w-md"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <label class="block text-sm">
            <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">IGV (%)</span>
            <input
              v-model.number="settingsDraft.igvPercent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="mt-1 w-full px-3 py-2 rounded border text-sm"
              :style="{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
              }"
            />
          </label>
          <label class="block text-sm">
            <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">% desperdicio madera</span>
            <input
              v-model.number="settingsDraft.woodWastePercent"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="mt-1 w-full px-3 py-2 rounded border text-sm"
              :style="{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
              }"
            />
          </label>
          <label class="block text-sm">
            <span class="font-medium" :style="{ color: 'var(--color-text-primary)' }">Vigencia cotización (días)</span>
            <input
              v-model.number="settingsDraft.quotationValidDays"
              type="number"
              min="1"
              class="mt-1 w-full px-3 py-2 rounded border text-sm"
              :style="{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
              }"
            />
          </label>
          <BaseButton variant="primary" :loading="savingSettings" @click="submitSettings">
            Guardar parámetros
          </BaseButton>
        </div>
      </div>

      <div v-else-if="activeTab === 'categorias'" class="space-y-3">
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Categorías del catálogo de muebles (código técnico + etiqueta visible).
        </p>
        <div
          class="rounded-xl border overflow-hidden"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left" :style="{ borderColor: 'var(--color-border)' }">
                <th class="py-2 px-3">Código</th>
                <th class="py-2 px-3">Etiqueta</th>
                <th class="py-2 px-3 w-20">Activa</th>
                <th class="py-2 px-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in categoriesDraft"
                :key="row.id ?? `cat-${idx}`"
                class="border-b"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <td class="py-2 px-3">
                  <input
                    v-model="row.code"
                    type="text"
                    class="w-full px-2 py-1.5 rounded border text-sm font-mono"
                    :style="{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-primary)',
                    }"
                  />
                </td>
                <td class="py-2 px-3">
                  <input
                    v-model="row.label"
                    type="text"
                    class="w-full px-2 py-1.5 rounded border text-sm"
                    :style="{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-primary)',
                    }"
                  />
                </td>
                <td class="py-2 px-3 text-center">
                  <input v-model="row.isActive" type="checkbox" />
                </td>
                <td class="py-2 px-3">
                  <div class="flex gap-1">
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(categoriesDraft, idx, -1)">
                      ↑
                    </BaseButton>
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(categoriesDraft, idx, 1)">
                      ↓
                    </BaseButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="p-3 border-t flex justify-between" :style="{ borderColor: 'var(--color-border)' }">
            <BaseButton type="button" variant="ghost" @click="addCategory">+ Categoría</BaseButton>
            <BaseButton variant="primary" :loading="savingCategories" @click="submitCategories">
              Guardar categorías
            </BaseButton>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'etapas'" class="space-y-3">
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Etapas de las órdenes de trabajo. Los códigos técnicos (planificacion, corte, …) no cambian; solo etiquetas y orden.
        </p>
        <div
          class="rounded-xl border overflow-hidden"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left" :style="{ borderColor: 'var(--color-border)' }">
                <th class="py-2 px-3">Código</th>
                <th class="py-2 px-3">Etiqueta</th>
                <th class="py-2 px-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in stagesDraft"
                :key="row.stageKey"
                class="border-b"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <td class="py-2 px-3 font-mono text-xs">{{ row.stageKey }}</td>
                <td class="py-2 px-3">
                  <input
                    v-model="row.label"
                    type="text"
                    class="w-full px-2 py-1.5 rounded border text-sm"
                    :style="{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-primary)',
                    }"
                  />
                </td>
                <td class="py-2 px-3">
                  <div class="flex gap-1">
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(stagesDraft, idx, -1)">
                      ↑
                    </BaseButton>
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(stagesDraft, idx, 1)">
                      ↓
                    </BaseButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="p-3 border-t flex justify-end" :style="{ borderColor: 'var(--color-border)' }">
            <BaseButton variant="primary" :loading="savingStages" @click="submitStages">Guardar etapas</BaseButton>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'unidades'" class="space-y-3">
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Unidades para materiales e inventario.
        </p>
        <div
          class="rounded-xl border overflow-hidden"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left" :style="{ borderColor: 'var(--color-border)' }">
                <th class="py-2 px-3">Código</th>
                <th class="py-2 px-3">Etiqueta</th>
                <th class="py-2 px-3 w-20">Activa</th>
                <th class="py-2 px-3 w-28"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in unitsDraft"
                :key="row.id ?? `unit-${idx}`"
                class="border-b"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <td class="py-2 px-3">
                  <input
                    v-model="row.code"
                    type="text"
                    class="w-full px-2 py-1.5 rounded border text-sm font-mono"
                    :style="{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-primary)',
                    }"
                  />
                </td>
                <td class="py-2 px-3">
                  <input
                    v-model="row.label"
                    type="text"
                    class="w-full px-2 py-1.5 rounded border text-sm"
                    :style="{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-surface-elevated)',
                      color: 'var(--color-text-primary)',
                    }"
                  />
                </td>
                <td class="py-2 px-3 text-center">
                  <input v-model="row.isActive" type="checkbox" />
                </td>
                <td class="py-2 px-3">
                  <div class="flex gap-1">
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(unitsDraft, idx, -1)">
                      ↑
                    </BaseButton>
                    <BaseButton type="button" variant="ghost" size="sm" @click="reorder(unitsDraft, idx, 1)">
                      ↓
                    </BaseButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="p-3 border-t flex justify-between" :style="{ borderColor: 'var(--color-border)' }">
            <BaseButton type="button" variant="ghost" @click="addUnit">+ Unidad</BaseButton>
            <BaseButton variant="primary" :loading="savingUnits" @click="submitUnits">Guardar unidades</BaseButton>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'numeracion'" class="space-y-4">
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Prefijos y correlativos para códigos automáticos al crear documentos.
        </p>
        <div
          v-for="series in numberingRows"
          :key="series.seriesKey"
          class="rounded-xl border p-4 space-y-3"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="font-semibold text-sm" :style="{ color: 'var(--color-text-primary)' }">
              {{ PRODUCCION_NUMBERING_LABELS[series.seriesKey] ?? series.seriesKey }}
            </h3>
            <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
              Próximo: <strong :style="{ color: 'var(--color-text-primary)' }">{{ series.nextPreview }}</strong>
            </p>
          </div>
          <div v-if="numberingDraft[series.seriesKey]" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label class="text-sm block">
              <span class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Prefijo</span>
              <input
                v-model="numberingDraft[series.seriesKey]!.prefix"
                type="text"
                class="mt-1 w-full px-2 py-1.5 rounded border text-sm"
                :style="{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)',
                }"
              />
            </label>
            <label class="text-sm block">
              <span class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Último número</span>
              <input
                v-model.number="numberingDraft[series.seriesKey]!.lastNumber"
                type="number"
                min="0"
                class="mt-1 w-full px-2 py-1.5 rounded border text-sm"
                :style="{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)',
                }"
              />
            </label>
            <label class="text-sm block">
              <span class="text-xs" :style="{ color: 'var(--color-text-muted)' }">Dígitos</span>
              <input
                v-model.number="numberingDraft[series.seriesKey]!.padLength"
                type="number"
                min="1"
                max="8"
                class="mt-1 w-full px-2 py-1.5 rounded border text-sm"
                :style="{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-surface-elevated)',
                  color: 'var(--color-text-primary)',
                }"
              />
            </label>
            <label class="text-sm flex items-end gap-2 pb-2">
              <input v-model="numberingDraft[series.seriesKey]!.includeYear" type="checkbox" />
              <span :style="{ color: 'var(--color-text-primary)' }">Incluir año</span>
            </label>
          </div>
          <BaseButton
            variant="primary"
            size="sm"
            :loading="savingNumbering"
            @click="saveNumberingSeries(series.seriesKey)"
          >
            Guardar serie
          </BaseButton>
        </div>
      </div>
    </template>
  </div>
</template>
