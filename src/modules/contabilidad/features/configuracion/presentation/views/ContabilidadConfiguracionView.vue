<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('contabilidad')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import ContabilidadContextSettingsPanel from '../../../../presentation/components/ContabilidadContextSettingsPanel.vue'
import { CONTABILIDAD_PAGE_CLASS } from '../../../../config/layout.constants'
import {
  useContabilidadConfigBootstrap,
  useContabilidadSaveCompany,
  useContabilidadSaveSettings,
  useContabilidadPatchDocumentSeries,
} from '../composables/useContabilidadConfig'
import {
  CONTABILIDAD_DOCUMENT_SERIES_LABELS,
  CONTABILIDAD_FISCAL_MONTH_OPTIONS,
  CONTABILIDAD_TAX_REGIME_OPTIONS,
} from '../../domain/config.types'
import { isValidPeruvianRuc, normalizeRuc } from '../../domain/ruc-validator'
import type { ContabilidadDocumentSeriesDTO } from '../../domain/config.types'
const route = useRoute()
const activeTab = ref('contexto')

const tabs = [
  { id: 'contexto', label: 'Contexto contable', icon: 'lucide:target' },
  { id: 'empresa', label: 'Empresa', icon: 'lucide:building-2' },
  { id: 'tributario', label: 'Tributario', icon: 'lucide:landmark' },
  { id: 'series', label: 'Series documentales', icon: 'lucide:file-text' },
  { id: 'numeracion', label: 'Numeración', icon: 'lucide:hash' },
]

watch(
  () => route.query.tab,
  (tab) => {
    if (typeof tab === 'string' && tabs.some((t) => t.id === tab)) {
      activeTab.value = tab
    }
  },
  { immediate: true },
)

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
    {
      seriesKey: row.seriesKey,
      body: { sunatSeries: draft.sunatSeries, isActive: draft.isActive },
    },
    { onSuccess: () => void refetch() },
  )
}

function saveNumberingRow(row: ContabilidadDocumentSeriesDTO) {
  const draft = numberingDraft.value[row.seriesKey]
  if (!draft) return
  patchSeries(
    {
      seriesKey: row.seriesKey,
      body: { lastNumber: draft.lastNumber, padLength: draft.padLength },
    },
    { onSuccess: () => void refetch() },
  )
}

function seriesLabel(seriesKey: string) {
  return CONTABILIDAD_DOCUMENT_SERIES_LABELS[seriesKey] ?? seriesKey
}

const taxRegimeOptions = CONTABILIDAD_TAX_REGIME_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}))
const fiscalMonthOptions = CONTABILIDAD_FISCAL_MONTH_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}))

const fiscalYearStartMonthModel = computed({
  get: () => settingsDraft.value.fiscalYearStartMonth,
  set: (value: string | number | null) => {
    const month = Number(value)
    settingsDraft.value.fiscalYearStartMonth = month >= 1 && month <= 12 ? month : 1
  },
})
</script>

<template>
  <div :class="CONTABILIDAD_PAGE_CLASS">
    <PageHeader
      title="Configuración — Contabilidad"
    >
      <template #actions>
        <p class="text-sm mt-1 text-gray-500 dark:text-gray-400">
        Datos de la empresa, parámetros tributarios SUNAT y series de comprobantes electrónicos (Perú).
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
      <BaseButton variant="secondary" @click="refetch()">Reintentar</BaseButton>
    </BaseCard>

  <template v-else>
    <ContabilidadContextSettingsPanel v-if="activeTab === 'contexto'" />

    <!-- Empresa -->
    <section v-else-if="activeTab === 'empresa'" class="space-y-4 max-w-3xl">
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
          <BaseButton v-if="canWrite" type="submit" variant="primary" :loading="savingCompany">Guardar empresa</BaseButton>
        </div>
      </form>
    </section>

    <!-- Tributario -->
    <section v-else-if="activeTab === 'tributario'" class="space-y-4 max-w-3xl">
      <form class="space-y-4" @submit.prevent="submitSettings">
        <FormSelect
          v-model="settingsDraft.taxRegime"
          label="Régimen tributario"
          :options="taxRegimeOptions"
        />

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
          <FormSelect
            v-model="fiscalYearStartMonthModel"
            label="Inicio año fiscal"
            :options="fiscalMonthOptions"
          />
          <FormInput v-model.number="settingsDraft.amountDecimals" type="number" label="Decimales en montos" />
        </div>

        <div class="flex justify-end">
          <BaseButton v-if="canWrite" type="submit" variant="primary" :loading="savingSettings">Guardar tributario</BaseButton>
        </div>
      </form>
    </section>

    <!-- Series documentales -->
    <section v-else-if="activeTab === 'series'" class="space-y-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Series SUNAT para comprobantes electrónicos (ej. F001 factura, B001 boleta).
      </p>
      <div class="grid gap-4 md:grid-cols-2">
        <FormSectionCard
          v-for="row in documentSeriesRows"
          :key="row.seriesKey"
          :title="seriesLabel(row.seriesKey)"
          dense
        >
          <div class="space-y-3">
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
            <BaseButton v-if="canWrite" variant="primary" size="sm" :loading="savingSeries" @click="saveSeriesRow(row)">
              Guardar
            </BaseButton>
          </div>
          </div>
        </FormSectionCard>
      </div>
    </section>

    <!-- Numeración -->
    <section v-else-if="activeTab === 'numeracion'" class="space-y-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Correlativo y longitud del número para cada serie. Vista previa del próximo comprobante.
      </p>
      <BaseCard padding="none" class="block overflow-hidden">
        <DataTable
          :columns="[
            { key: 'c0', label: 'Tipo' },
            { key: 'c1', label: 'Último N°' },
            { key: 'c2', label: 'Dígitos' },
            { key: 'c3', label: 'Próximo' },
            { key: 'c4', label: '' },
          ]"
          :data="documentSeriesRows"
          row-key="seriesKey"
        >
          <template #row="{ row }">
              <td class="py-3 px-4 text-gray-800 dark:text-white/90">
                {{ seriesLabel(row.seriesKey) }}
              </td>
              <td class="py-3 px-4">
                <FormInput
                  v-if="numberingDraft[row.seriesKey]"
                  v-model.number="numberingDraft[row.seriesKey]!.lastNumber"
                  type="number"
                  input-class="w-28"
                />
              </td>
              <td class="py-3 px-4">
                <FormInput
                  v-if="numberingDraft[row.seriesKey]"
                  v-model.number="numberingDraft[row.seriesKey]!.padLength"
                  type="number"
                  input-class="w-20"
                />
              </td>
              <td class="py-3 px-4 font-mono text-xs text-gray-400 dark:text-gray-500">
                {{ row.nextPreview }}
              </td>
              <td class="py-3 px-4 text-right">
                <BaseButton v-if="canWrite" variant="ghost" size="sm" :loading="savingSeries" @click="saveNumberingRow(row)">
                  Guardar
                </BaseButton>
              </td>
          </template>
        </DataTable>
      </BaseCard>
    </section>
  </template>
  </div>
</template>
