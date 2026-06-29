<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { BaseButton, AppIcon, BaseTabs, FormInput, FormCheckbox } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import {
  useContabilidadConfigBootstrap,
  useContabilidadSaveCompany,
  useContabilidadSaveSettings,
  useContabilidadPatchDocumentSeries,
} from '../../application/useContabilidadConfig'
import {
  CONTABILIDAD_DOCUMENT_SERIES_LABELS,
  CONTABILIDAD_FISCAL_MONTH_OPTIONS,
  CONTABILIDAD_TAX_REGIME_OPTIONS,
} from '../../domain/config.types'
import { isValidPeruvianRuc, normalizeRuc } from '../../domain/ruc-validator'
import type { ContabilidadDocumentSeriesDTO } from '../../domain/config.types'

const activeTab = ref('empresa')

const tabs = [
  { id: 'empresa', label: 'Empresa', icon: 'lucide:building-2' },
  { id: 'tributario', label: 'Tributario', icon: 'lucide:landmark' },
  { id: 'series', label: 'Series documentales', icon: 'lucide:file-text' },
  { id: 'numeracion', label: 'Numeración', icon: 'lucide:hash' },
]

const { data: boot, isLoading, isError, error, refetch } = useContabilidadConfigBootstrap()
const configLoadError = computed(() => (isError.value ? getApiErrorMessage(error.value) : ''))

const { mutate: saveCompany, isPending: savingCompany } = useContabilidadSaveCompany()
const { mutate: saveSettings, isPending: savingSettings } = useContabilidadSaveSettings()
const { mutate: patchSeries, isPending: savingSeries } = useContabilidadPatchDocumentSeries()

const companyDraft = ref({
  ruc: '',
  legalName: '',
  tradeName: '',
  fiscalAddress: '',
  district: '',
  province: '',
  department: '',
  ubigeoCode: '',
})

const settingsDraft = ref({
  taxRegime: 'GENERAL',
  isDetractionAgent: false,
  isRetentionAgent: false,
  isPerceptionAgent: false,
  igvPercent: 18,
  currencyCode: 'PEN',
  fiscalYearStartMonth: 1,
  amountDecimals: 2,
})

const seriesDraft = ref<Record<string, { sunatSeries: string; isActive: boolean }>>({})
const numberingDraft = ref<Record<string, { lastNumber: number; padLength: number }>>({})

const rucError = ref('')

watch(
  () => boot.value?.company,
  (c) => {
    if (!c) return
    companyDraft.value = {
      ruc: c.ruc,
      legalName: c.legalName,
      tradeName: c.tradeName ?? '',
      fiscalAddress: c.fiscalAddress,
      district: c.district,
      province: c.province,
      department: c.department,
      ubigeoCode: c.ubigeoCode,
    }
  },
  { immediate: true },
)

watch(
  () => boot.value?.settings,
  (s) => {
    if (s) settingsDraft.value = { ...s }
  },
  { immediate: true },
)

watch(
  () => boot.value?.documentSeries,
  (rows) => {
    if (!rows?.length) return
    const seriesMap: typeof seriesDraft.value = {}
    const numMap: typeof numberingDraft.value = {}
    for (const row of rows) {
      seriesMap[row.seriesKey] = { sunatSeries: row.sunatSeries, isActive: row.isActive }
      numMap[row.seriesKey] = { lastNumber: row.lastNumber, padLength: row.padLength }
    }
    seriesDraft.value = seriesMap
    numberingDraft.value = numMap
  },
  { immediate: true },
)

const documentSeriesRows = computed(() => boot.value?.documentSeries ?? [])

function validateRucField() {
  const ruc = normalizeRuc(companyDraft.value.ruc)
  if (!ruc) {
    rucError.value = ''
    return true
  }
  if (!isValidPeruvianRuc(ruc)) {
    rucError.value = 'RUC inválido. Verifique el dígito verificador.'
    return false
  }
  rucError.value = ''
  companyDraft.value.ruc = ruc
  return true
}

function submitCompany() {
  if (!validateRucField()) return
  if (!companyDraft.value.legalName.trim()) {
    void markapAlert.toast.warning('La razón social es obligatoria')
    return
  }
  saveCompany(
    {
      ...companyDraft.value,
      tradeName: companyDraft.value.tradeName.trim() || null,
    },
    { onSuccess: () => void refetch() },
  )
}

function submitSettings() {
  saveSettings(settingsDraft.value, { onSuccess: () => void refetch() })
}

function saveSeriesRow(row: ContabilidadDocumentSeriesDTO) {
  const draft = seriesDraft.value[row.seriesKey]
  if (!draft) return
  patchSeries(
    { seriesKey: row.seriesKey, body: { sunatSeries: draft.sunatSeries, isActive: draft.isActive } },
    { onSuccess: () => void refetch() },
  )
}

function saveNumberingRow(row: ContabilidadDocumentSeriesDTO) {
  const draft = numberingDraft.value[row.seriesKey]
  if (!draft) return
  patchSeries(
    { seriesKey: row.seriesKey, body: { lastNumber: draft.lastNumber, padLength: draft.padLength } },
    { onSuccess: () => void refetch() },
  )
}

function seriesLabel(seriesKey: string) {
  return CONTABILIDAD_DOCUMENT_SERIES_LABELS[seriesKey] ?? seriesKey
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <div>
      <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
        Configuración — Contabilidad
      </h1>
      <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
        Datos de la empresa, parámetros tributarios SUNAT y series de comprobantes electrónicos (Perú).
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
      <BaseButton variant="secondary" @click="refetch()">Reintentar</BaseButton>
    </div>

  <template v-else>
    <!-- Empresa -->
    <section v-if="activeTab === 'empresa'" class="space-y-4 max-w-2xl">
      <form class="space-y-4" @submit.prevent="submitCompany">
        <FormInput
          v-model="companyDraft.ruc"
          label="RUC"
          maxlength="11"
          inputmode="numeric"
          hint="11 dígitos con dígito verificador SUNAT"
          :error="rucError"
          @blur="validateRucField"
        />
        <FormInput v-model="companyDraft.legalName" label="Razón social" required />
        <FormInput v-model="companyDraft.tradeName" label="Nombre comercial" />
        <FormInput v-model="companyDraft.fiscalAddress" label="Domicilio fiscal" />
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormInput v-model="companyDraft.district" label="Distrito" />
          <FormInput v-model="companyDraft.province" label="Provincia" />
          <FormInput v-model="companyDraft.department" label="Departamento" />
        </div>
        <FormInput
          v-model="companyDraft.ubigeoCode"
          label="Ubigeo"
          maxlength="6"
          inputmode="numeric"
          hint="Código INEI de 6 dígitos"
        />
        <div class="flex justify-end">
          <BaseButton type="submit" variant="primary" :loading="savingCompany">Guardar empresa</BaseButton>
        </div>
      </form>
    </section>

    <!-- Tributario -->
    <section v-else-if="activeTab === 'tributario'" class="space-y-4 max-w-2xl">
      <form class="space-y-4" @submit.prevent="submitSettings">
        <div>
          <label class="block text-sm font-medium mb-1" :style="{ color: 'var(--color-text-primary)' }">
            Régimen tributario
          </label>
          <select
            v-model="settingsDraft.taxRegime"
            class="w-full px-3 py-2 rounded-lg border text-sm"
            :style="{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface-elevated)',
              color: 'var(--color-text-primary)',
            }"
          >
            <option v-for="opt in CONTABILIDAD_TAX_REGIME_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <FormCheckbox v-model="settingsDraft.isDetractionAgent" label="Agente de detracción (SPOT)" />
          <FormCheckbox v-model="settingsDraft.isRetentionAgent" label="Agente de retención" />
          <FormCheckbox v-model="settingsDraft.isPerceptionAgent" label="Agente de percepción" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput v-model.number="settingsDraft.igvPercent" type="number" label="IGV (%)" />
          <FormInput v-model="settingsDraft.currencyCode" label="Moneda (ISO)" maxlength="3" />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1" :style="{ color: 'var(--color-text-primary)' }">
              Inicio año fiscal
            </label>
            <select
              v-model.number="settingsDraft.fiscalYearStartMonth"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              :style="{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-primary)',
              }"
            >
              <option v-for="m in CONTABILIDAD_FISCAL_MONTH_OPTIONS" :key="m.value" :value="m.value">
                {{ m.label }}
              </option>
            </select>
          </div>
          <FormInput v-model.number="settingsDraft.amountDecimals" type="number" label="Decimales en montos" />
        </div>

        <div class="flex justify-end">
          <BaseButton type="submit" variant="primary" :loading="savingSettings">Guardar tributario</BaseButton>
        </div>
      </form>
    </section>

    <!-- Series documentales -->
    <section v-else-if="activeTab === 'series'" class="space-y-4">
      <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
        Series SUNAT para comprobantes electrónicos (ej. F001 factura, B001 boleta).
      </p>
      <div class="grid gap-4 md:grid-cols-2">
        <div
          v-for="row in documentSeriesRows"
          :key="row.seriesKey"
          class="rounded-xl border p-4 space-y-3"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <h3 class="font-semibold text-sm" :style="{ color: 'var(--color-text-primary)' }">
            {{ seriesLabel(row.seriesKey) }}
          </h3>
          <FormInput
            v-if="seriesDraft[row.seriesKey]"
            v-model="seriesDraft[row.seriesKey]!.sunatSeries"
            label="Serie SUNAT"
            maxlength="4"
            hint="Hasta 4 caracteres (F001, B001, FC01…)"
          />
          <FormCheckbox
            v-if="seriesDraft[row.seriesKey]"
            v-model="seriesDraft[row.seriesKey]!.isActive"
            label="Serie activa"
          />
          <div class="flex justify-end">
            <BaseButton variant="primary" size="sm" :loading="savingSeries" @click="saveSeriesRow(row)">
              Guardar
            </BaseButton>
          </div>
        </div>
      </div>
    </section>

    <!-- Numeración -->
    <section v-else-if="activeTab === 'numeracion'" class="space-y-4">
      <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
        Correlativo y longitud del número para cada serie. Vista previa del próximo comprobante.
      </p>
      <div
        class="rounded-xl border overflow-hidden"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">
                Tipo
              </th>
              <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">
                Último N°
              </th>
              <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">
                Dígitos
              </th>
              <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">
                Próximo
              </th>
              <th class="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in documentSeriesRows"
              :key="row.seriesKey"
              class="border-b last:border-b-0"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <td class="py-3 px-4" :style="{ color: 'var(--color-text-primary)' }">
                {{ seriesLabel(row.seriesKey) }}
              </td>
              <td class="py-3 px-4">
                <input
                  v-if="numberingDraft[row.seriesKey]"
                  v-model.number="numberingDraft[row.seriesKey]!.lastNumber"
                  type="number"
                  min="0"
                  class="w-28 px-2 py-1.5 rounded border text-sm"
                  :style="{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    color: 'var(--color-text-primary)',
                  }"
                />
              </td>
              <td class="py-3 px-4">
                <input
                  v-if="numberingDraft[row.seriesKey]"
                  v-model.number="numberingDraft[row.seriesKey]!.padLength"
                  type="number"
                  min="1"
                  max="8"
                  class="w-20 px-2 py-1.5 rounded border text-sm"
                  :style="{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface-elevated)',
                    color: 'var(--color-text-primary)',
                  }"
                />
              </td>
              <td class="py-3 px-4 font-mono text-xs" :style="{ color: 'var(--color-text-muted)' }">
                {{ row.nextPreview }}
              </td>
              <td class="py-3 px-4 text-right">
                <BaseButton variant="ghost" size="sm" :loading="savingSeries" @click="saveNumberingRow(row)">
                  Guardar
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </template>
  </div>
</template>
