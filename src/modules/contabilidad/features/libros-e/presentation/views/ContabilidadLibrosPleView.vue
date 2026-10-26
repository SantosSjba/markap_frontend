<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { computed, ref, watch } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { formatDateTime } from '@shared/utils/formatters'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import {
  useContabilidadDownloadPleZip,
  useContabilidadGeneratePle,
  useContabilidadPleBooks,
  useContabilidadPleExportLogs,
  useContabilidadPleMandatoryProfile,
} from '../composables/useContabilidadPle'
import {
  PLE_EXPORT_STATUS_LABELS,
  type ContabilidadPleGenerateResultDTO,
  type ContabilidadPleValidationIssueDTO,
} from '../../domain/ple.types'
import { downloadTextFile } from '@shared/infrastructure/browser/download-file'
const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data: booksData } = useContabilidadPleBooks()
const { data: mandatoryProfile } = useContabilidadPleMandatoryProfile()
const { data: exportLogs, isLoading: loadingLogs } = useContabilidadPleExportLogs(periodId)

const books = computed(() => booksData.value?.books ?? [])
const mandatorySet = computed(() => new Set(mandatoryProfile.value?.mandatoryBookCodes ?? []))

const selectedCodes = ref<string[]>([])
const lastResult = ref<ContabilidadPleGenerateResultDTO | null>(null)
const profileInitialized = ref(false)

watch(
  mandatoryProfile,
  (profile) => {
    if (!profile || profileInitialized.value) return
    selectedCodes.value = [...profile.mandatoryBookCodes]
    profileInitialized.value = true
  },
  { immediate: true },
)

const { mutate: generate, isPending: generating } = useContabilidadGeneratePle()
const { mutate: downloadZip, isPending: downloadingZip } = useContabilidadDownloadPleZip()

const lineErrors = computed(() =>
  (lastResult.value?.errors ?? []).filter((e) => e.lineNumber != null || e.linePreview),
)

const canDownload = computed(
  () => Boolean(lastResult.value?.files.length) && !lastResult.value?.blocked,
)

function isMandatory(code: string) {
  return mandatorySet.value.has(code)
}

function toggleBook(code: string, checked: boolean) {
  if (checked) {
    if (!selectedCodes.value.includes(code)) selectedCodes.value.push(code)
  } else {
    selectedCodes.value = selectedCodes.value.filter((c) => c !== code)
  }
}

function selectMandatory() {
  if (!mandatoryProfile.value) return
  selectedCodes.value = [...mandatoryProfile.value.mandatoryBookCodes]
}

function selectAll() {
  selectedCodes.value = books.value.map((b) => b.code)
}

function clearSelection() {
  selectedCodes.value = []
}

function runGenerate() {
  if (!activePeriod.value) return
  if (!selectedCodes.value.length) {
    void markapAlert.toast.warning('Seleccione al menos un libro')
    return
  }
  generate(
    { periodId: activePeriod.value.id, bookCodes: selectedCodes.value },
    {
      onSuccess: (result) => {
        lastResult.value = result
        if (result.blocked) {
          void markapAlert.toast.error(
            `PLE bloqueado: ${result.errors.length} error(es) crítico(s)`,
          )
        } else if (result.errors.length) {
          void markapAlert.toast.warning(`PLE generado con ${result.errors.length} error(es)`)
        } else if (result.warnings.length) {
          void markapAlert.toast.warning(
            `PLE generado con ${result.warnings.length} advertencia(s)`,
          )
        } else {
          void markapAlert.toast.success(`${result.files.length} libro(s) generado(s)`)
        }
      },
    },
  )
}

function runDownloadZip() {
  if (!activePeriod.value) return
  if (!selectedCodes.value.length) {
    void markapAlert.toast.warning('Seleccione al menos un libro')
    return
  }
  if (lastResult.value?.blocked) {
    void markapAlert.toast.error('Corrija los errores críticos antes de descargar el ZIP')
    return
  }
  downloadZip({ periodId: activePeriod.value.id, bookCodes: selectedCodes.value })
}

function downloadSingle(fileName: string, content: string) {
  if (lastResult.value?.blocked) {
    void markapAlert.toast.error('Descarga bloqueada por errores de validación')
    return
  }
  downloadTextFile(fileName, content)
}

function formatPeriod(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function formatLogDate(iso: string) {
  return formatDateTime(iso)
}

function statusVariant(status: string): 'success' | 'warning' | 'error' | 'neutral' | 'info' {
  if (status === 'SUCCESS') return 'success'
  if (status === 'WITH_WARNINGS') return 'warning'
  if (status === 'BLOCKED') return 'error'
  return 'neutral'
}

function issueKey(issue: ContabilidadPleValidationIssueDTO, index: number) {
  return `${issue.bookCode}-${issue.code}-${issue.lineNumber ?? index}`
}
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:file-archive"
      title="Generación PLE"
      subtitle="Libros electrónicos formato pipe (SUNAT). Validación local ampliada antes de exportar."
    >
      <template #actions>
        <BaseButton
          variant="secondary"
          :disabled="!activePeriod || !selectedCodes.length"
          :loading="downloadingZip"
          @click="runDownloadZip"
        >
          <AppIcon icon="lucide:file-archive" :size="16" class="mr-1" />
          Descargar ZIP
        </BaseButton>
        <BaseButton
          variant="primary"
          :disabled="!activePeriod || !selectedCodes.length"
          :loading="generating"
          @click="runGenerate"
        >
          <AppIcon icon="lucide:play" :size="16" class="mr-1" />
          Validar y generar
        </BaseButton>
      </template>
    </PageHeader>

    <p v-if="!activePeriod" class="text-sm text-warning-600 dark:text-orange-400">
      Configure el periodo activo en Configuracin ? Contexto contable.
    </p>

    <BaseCard v-if="mandatoryProfile" padding="sm" class="block">
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 class="font-semibold text-sm text-gray-800 dark:text-white/90">
            Checklist régimen tributario
          </h3>
          <p class="text-xs mt-0.5 text-gray-400 dark:text-gray-500">
            {{ mandatoryProfile.taxRegimeLabel }} — libros obligatorios marcados con etiqueta «Obligatorio».
          </p>
        </div>
        <BaseButton variant="secondary" size="sm" @click="selectMandatory">
          Seleccionar obligatorios
        </BaseButton>
      </div>
      <div class="flex flex-wrap gap-2">
        <Badge
          v-for="book in mandatoryProfile.books.filter((b) => b.mandatory)"
          :key="book.code"
          :variant="selectedCodes.includes(book.code) ? 'primary' : 'neutral'"
        >
          <AppIcon :icon="selectedCodes.includes(book.code) ? 'lucide:check-circle' : 'lucide:circle'" />
          {{ book.name }}
        </Badge>
      </div>
    </BaseCard>

    <div class="flex flex-wrap gap-2">
      <BaseButton variant="secondary" size="sm" @click="selectAll">Seleccionar todos</BaseButton>
      <BaseButton variant="secondary" size="sm" @click="clearSelection">Limpiar</BaseButton>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label
        v-for="book in books"
        :key="book.code"
        class="flex items-start gap-3 p-4 rounded-2xl border cursor-pointer border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-dark"
      >
        <FormCheckbox
          :model-value="selectedCodes.includes(book.code)"
          @update:model-value="(v: boolean) => toggleBook(book.code, v)"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-medium text-sm">{{ book.name }}</span>
            <Badge v-if="isMandatory(book.code)" variant="info">Obligatorio</Badge>
          </div>
          <div class="text-xs font-mono mt-0.5 text-gray-400 dark:text-gray-500">
            {{ book.code }} · Estructura {{ book.sunatStructure }}
          </div>
          <div class="text-xs mt-1 text-gray-500 dark:text-gray-400">{{ book.description }}</div>
        </div>
      </label>
    </div>

    <template v-if="lastResult">
      <FormSectionCard
        v-if="lastResult.blocked"
        title="Exportación bloqueada"
        subtitle="Corrija los errores críticos antes de descargar archivos o el ZIP del periodo."
        dense
      >

      </FormSectionCard>

      <BaseCard v-if="lineErrors.length" padding="none" class="block overflow-hidden border-error-500">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h3 class="font-semibold text-sm text-error-500 dark:text-error-400">
            Vista previa de líneas con error
          </h3>
        </div>
        <DataTable
          :columns="[
            { key: 'c0', label: 'Línea' },
            { key: 'c1', label: 'Libro' },
            { key: 'c2', label: 'Mensaje' },
            { key: 'c3', label: 'Contenido' },
          ]"
          :data="lineErrors"
        >
          <template #row="{ row: err }">
              <td class="py-2 px-4 font-mono text-xs">{{ err.lineNumber ?? '—' }}</td>
              <td class="py-2 px-4 font-mono text-xs">{{ err.bookCode }}</td>
              <td class="py-2 px-4">{{ err.message }}</td>
              <td class="py-2 px-4 font-mono text-xs truncate max-w-md hidden lg:table-cell" :title="err.linePreview">
                {{ err.linePreview ?? '—' }}
              </td>
          </template>
        </DataTable>
      </BaseCard>

      <FormSectionCard
        v-if="lastResult.errors.length && !lineErrors.length"
        title="Errores de validación"
        dense
      >
        <ul class="text-sm space-y-1">
          <li v-for="(err, i) in lastResult.errors" :key="issueKey(err, i)">
            <Badge variant="error" class="mr-2">{{ err.bookCode }}</Badge>
            {{ err.message }}
          </li>
        </ul>
      </FormSectionCard>

      <FormSectionCard
        v-if="lastResult.warnings.length"
        title="Advertencias"
        dense
      >
        <ul class="text-sm space-y-1">
          <li v-for="(w, i) in lastResult.warnings" :key="issueKey(w, i)">
            <Badge variant="warning" class="mr-2">{{ w.bookCode }}</Badge>
            {{ w.message }}
          </li>
        </ul>
      </FormSectionCard>

      <BaseCard padding="none" class="block overflow-hidden">
        <DataTable
          :columns="[
            { key: 'c0', label: 'Libro' },
            { key: 'c1', label: 'Archivo' },
            { key: 'c2', label: 'Líneas', align: 'right' },
            { key: 'c3', label: '' },
          ]"
          :data="lastResult.files"
          row-key="bookCode"
        >
          <template #row="{ row: file }">
              <td class="py-2.5 px-4">{{ file.bookName }}</td>
              <td class="py-2.5 px-4 font-mono text-xs">{{ file.fileName }}</td>
              <td class="py-2.5 px-4 text-right">{{ file.lineCount }}</td>
              <td class="py-2.5 px-4 text-right">
                <BaseButton
                  variant="secondary"
                  size="sm"
                  :disabled="!canDownload"
                  @click="downloadSingle(file.fileName, file.content)"
                >
                  Descargar
                </BaseButton>
              </td>
          </template>
        </DataTable>
      </BaseCard>
    </template>

    <BaseCard padding="none" class="block overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h3 class="font-semibold text-sm text-gray-800 dark:text-white/90">
          Historial de exportaciones
        </h3>
      </div>

      <LoadingState v-if="loadingLogs" class="py-10" />

      <div
        v-else-if="!exportLogs?.length"
        class="p-8 text-center text-sm text-gray-400 dark:text-gray-500"
      >
        Sin exportaciones registradas para este periodo.
      </div>

      <DataTable
        :columns="[
          { key: 'c0', label: 'Fecha' },
          { key: 'c1', label: 'Periodo' },
          { key: 'c2', label: 'Libros' },
          { key: 'c3', label: 'Archivos', align: 'right' },
          { key: 'c4', label: 'Errores', align: 'right' },
          { key: 'c5', label: 'Estado' },
        ]"
        :data="exportLogs ?? []"
      >
        <template #row="{ row: log }">
            <td class="py-2 px-4 whitespace-nowrap text-xs">{{ formatLogDate(log.createdAt) }}</td>
            <td class="py-2 px-4 font-mono text-xs">{{ formatPeriod(log.year, log.month) }}</td>
            <td class="py-2 px-4 text-xs hidden md:table-cell">
              {{ log.bookCodes.join(', ') }}
            </td>
            <td class="py-2 px-4 text-right">{{ log.fileCount }}</td>
            <td class="py-2 px-4 text-right">{{ log.errorCount }}</td>
            <td class="py-2 px-4">
              <Badge :variant="statusVariant(log.status)">
                {{ PLE_EXPORT_STATUS_LABELS[log.status] ?? log.status }}
              </Badge>
            </td>
        </template>
      </DataTable>
    </BaseCard>
  </div>
</template>
