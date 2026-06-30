<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BaseButton, AppIcon, Badge, FormCheckbox, PageHeader } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import {
  useContabilidadDownloadPleZip,
  useContabilidadGeneratePle,
  useContabilidadPleBooks,
  useContabilidadPleExportLogs,
  useContabilidadPleMandatoryProfile,
} from '../../application/useContabilidadPle'
import {
  downloadTextFile,
  PLE_EXPORT_STATUS_LABELS,
  type ContabilidadPleGenerateResultDTO,
  type ContabilidadPleValidationIssueDTO,
} from '../../domain/ple.types'

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
          void markapAlert.toast.error(`PLE bloqueado: ${result.errors.length} error(es) crítico(s)`)
        } else if (result.errors.length) {
          void markapAlert.toast.warning(`PLE generado con ${result.errors.length} error(es)`)
        } else if (result.warnings.length) {
          void markapAlert.toast.warning(`PLE generado con ${result.warnings.length} advertencia(s)`)
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
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
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

    <p v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Configure el periodo activo en Configuraci�n ? Contexto contable.
    </p>

    <div
      v-if="mandatoryProfile"
      class="rounded-xl border p-4"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 class="font-semibold text-sm" :style="{ color: 'var(--color-text-primary)' }">
            Checklist régimen tributario
          </h3>
          <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
            {{ mandatoryProfile.taxRegimeLabel }} — libros obligatorios marcados con etiqueta «Obligatorio».
          </p>
        </div>
        <BaseButton variant="secondary" size="sm" @click="selectMandatory">
          Seleccionar obligatorios
        </BaseButton>
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="book in mandatoryProfile.books.filter((b) => b.mandatory)"
          :key="book.code"
          class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
          :style="{
            borderColor: selectedCodes.includes(book.code) ? 'var(--color-primary)' : 'var(--color-border)',
            backgroundColor: selectedCodes.includes(book.code) ? 'var(--color-primary-soft)' : 'transparent',
          }"
        >
          <AppIcon
            :icon="selectedCodes.includes(book.code) ? 'lucide:check-circle' : 'lucide:circle'"
            :size="12"
            :color="selectedCodes.includes(book.code) ? 'var(--color-primary)' : 'var(--color-text-muted)'"
          />
          {{ book.name }}
        </span>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <BaseButton variant="secondary" size="sm" @click="selectAll">Seleccionar todos</BaseButton>
      <BaseButton variant="secondary" size="sm" @click="clearSelection">Limpiar</BaseButton>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label
        v-for="book in books"
        :key="book.code"
        class="flex items-start gap-3 p-4 rounded-xl border cursor-pointer"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
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
          <div class="text-xs font-mono mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
            {{ book.code }} · Estructura {{ book.sunatStructure }}
          </div>
          <div class="text-xs mt-1" :style="{ color: 'var(--color-text-secondary)' }">{{ book.description }}</div>
        </div>
      </label>
    </div>

    <template v-if="lastResult">
      <div
        v-if="lastResult.blocked"
        class="rounded-xl border p-4"
        :style="{ borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-surface)' }"
      >
        <h3 class="font-semibold text-sm mb-1" :style="{ color: 'var(--color-danger)' }">
          Exportación bloqueada
        </h3>
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Corrija los errores críticos antes de descargar archivos o el ZIP del periodo.
        </p>
      </div>

      <div
        v-if="lineErrors.length"
        class="rounded-xl border overflow-hidden"
        :style="{ borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-surface)' }"
      >
        <div class="px-4 py-3 border-b" :style="{ borderColor: 'var(--color-border)' }">
          <h3 class="font-semibold text-sm" :style="{ color: 'var(--color-danger)' }">
            Vista previa de líneas con error
          </h3>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <th class="text-left py-2 px-4 font-medium w-16">Línea</th>
              <th class="text-left py-2 px-4 font-medium w-24">Libro</th>
              <th class="text-left py-2 px-4 font-medium">Mensaje</th>
              <th class="text-left py-2 px-4 font-medium hidden lg:table-cell">Contenido</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(err, i) in lineErrors"
              :key="issueKey(err, i)"
              class="border-b last:border-0"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <td class="py-2 px-4 font-mono text-xs">{{ err.lineNumber ?? '—' }}</td>
              <td class="py-2 px-4 font-mono text-xs">{{ err.bookCode }}</td>
              <td class="py-2 px-4">{{ err.message }}</td>
              <td class="py-2 px-4 font-mono text-xs truncate max-w-md hidden lg:table-cell" :title="err.linePreview">
                {{ err.linePreview ?? '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="lastResult.errors.length && !lineErrors.length"
        class="rounded-xl border p-4"
        :style="{ borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-surface)' }"
      >
        <h3 class="font-semibold text-sm mb-2" :style="{ color: 'var(--color-danger)' }">Errores de validación</h3>
        <ul class="text-sm space-y-1">
          <li v-for="(err, i) in lastResult.errors" :key="issueKey(err, i)">
            <Badge variant="error" class="mr-2">{{ err.bookCode }}</Badge>
            {{ err.message }}
          </li>
        </ul>
      </div>

      <div
        v-if="lastResult.warnings.length"
        class="rounded-xl border p-4"
        :style="{ borderColor: 'var(--color-warning)', backgroundColor: 'var(--color-surface)' }"
      >
        <h3 class="font-semibold text-sm mb-2" :style="{ color: 'var(--color-warning)' }">Advertencias</h3>
        <ul class="text-sm space-y-1">
          <li v-for="(w, i) in lastResult.warnings" :key="issueKey(w, i)">
            <Badge variant="warning" class="mr-2">{{ w.bookCode }}</Badge>
            {{ w.message }}
          </li>
        </ul>
      </div>

      <div
        class="rounded-xl border overflow-hidden"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <th class="text-left py-3 px-4">Libro</th>
              <th class="text-left py-3 px-4">Archivo</th>
              <th class="text-right py-3 px-4">Líneas</th>
              <th class="py-3 px-4 w-28" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="file in lastResult.files"
              :key="file.bookCode"
              class="border-b last:border-b-0"
              :style="{ borderColor: 'var(--color-border)' }"
            >
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
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <div class="px-4 py-3 border-b" :style="{ borderColor: 'var(--color-border)' }">
        <h3 class="font-semibold text-sm" :style="{ color: 'var(--color-text-primary)' }">
          Historial de exportaciones
        </h3>
      </div>

      <div v-if="loadingLogs" class="flex justify-center py-10">
        <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
      </div>

      <div
        v-else-if="!exportLogs?.length"
        class="p-8 text-center text-sm"
        :style="{ color: 'var(--color-text-muted)' }"
      >
        Sin exportaciones registradas para este periodo.
      </div>

      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
            <th class="text-left py-2.5 px-4 font-medium">Fecha</th>
            <th class="text-left py-2.5 px-4 font-medium">Periodo</th>
            <th class="text-left py-2.5 px-4 font-medium hidden md:table-cell">Libros</th>
            <th class="text-right py-2.5 px-4 font-medium">Archivos</th>
            <th class="text-right py-2.5 px-4 font-medium">Errores</th>
            <th class="text-left py-2.5 px-4 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in exportLogs"
            :key="log.id"
            class="border-b last:border-0"
            :style="{ borderColor: 'var(--color-border)' }"
          >
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
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
