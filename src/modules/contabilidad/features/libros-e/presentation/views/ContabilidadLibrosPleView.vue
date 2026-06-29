<script setup lang="ts">
import { computed, ref } from 'vue'
import { BaseButton, AppIcon, Badge, FormCheckbox, PageHeader } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { useContabilidadPleBooks, useContabilidadGeneratePle } from '../../application/useContabilidadPle'
import { downloadAllPleFiles, downloadTextFile, type ContabilidadPleGenerateResultDTO } from '../../domain/ple.types'

const { activePeriod } = useContabilidadActivePeriod()

const { data: booksData } = useContabilidadPleBooks()
const books = computed(() => booksData.value?.books ?? [])

const selectedCodes = ref<string[]>([])
const lastResult = ref<ContabilidadPleGenerateResultDTO | null>(null)

const { mutate: generate, isPending: generating } = useContabilidadGeneratePle()

function toggleBook(code: string, checked: boolean) {
  if (checked) {
    if (!selectedCodes.value.includes(code)) selectedCodes.value.push(code)
  } else {
    selectedCodes.value = selectedCodes.value.filter((c) => c !== code)
  }
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
        if (result.errors.length) {
          void markapAlert.toast.warning(`PLE generado con ${result.errors.length} error(es)`)
        } else {
          void markapAlert.toast.success(`${result.files.length} libro(s) generado(s)`)
        }
      },
    },
  )
}

function downloadZipEquivalent() {
  if (!lastResult.value?.files.length) return
  downloadAllPleFiles(lastResult.value.files)
  void markapAlert.toast.success('Descargando archivos PLE…')
}

function downloadSingle(fileName: string, content: string) {
  downloadTextFile(fileName, content)
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:file-archive"
      title="Generación PLE"
      subtitle="Libros electrónicos formato pipe (SUNAT). Validación local antes de exportar."
    >
      <template #actions>
        <BaseButton variant="secondary" :disabled="!lastResult?.files.length" @click="downloadZipEquivalent">
          <AppIcon icon="lucide:download" :size="16" class="mr-1" />
          Descargar todos
        </BaseButton>
        <BaseButton variant="primary" :disabled="!activePeriod || !selectedCodes.length" :loading="generating" @click="runGenerate">
          <AppIcon icon="lucide:play" :size="16" class="mr-1" />
          Generar PLE
        </BaseButton>
      </template>
    </PageHeader>

    <p v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Seleccione un periodo activo en la barra superior.
    </p>

    <div class="flex gap-2">
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
        <div class="min-w-0">
          <div class="font-medium text-sm">{{ book.name }}</div>
          <div class="text-xs font-mono mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
            {{ book.code }} · Estructura {{ book.sunatStructure }}
          </div>
          <div class="text-xs mt-1" :style="{ color: 'var(--color-text-secondary)' }">{{ book.description }}</div>
        </div>
      </label>
    </div>

    <div v-if="lastResult" class="space-y-4">
      <div
        v-if="lastResult.errors.length"
        class="rounded-xl border p-4"
        :style="{ borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-surface)' }"
      >
        <h3 class="font-semibold text-sm mb-2" :style="{ color: 'var(--color-danger)' }">Errores de validación</h3>
        <ul class="text-sm space-y-1">
          <li v-for="(err, i) in lastResult.errors" :key="`e-${i}`">
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
          <li v-for="(w, i) in lastResult.warnings" :key="`w-${i}`">
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
                <BaseButton variant="secondary" size="sm" @click="downloadSingle(file.fileName, file.content)">
                  Descargar
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
