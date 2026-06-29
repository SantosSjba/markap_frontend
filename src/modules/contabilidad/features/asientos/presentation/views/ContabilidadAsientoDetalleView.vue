<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BaseButton, AppIcon, Badge, PageHeader } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import {
  useContabilidadJournalDetail,
  useContabilidadDeleteJournal,
  useContabilidadPostJournal,
  useContabilidadReverseJournal,
} from '../../application/useContabilidadJournal'
import {
  CONTABILIDAD_JOURNAL_STATUS,
  CONTABILIDAD_JOURNAL_STATUS_LABELS,
} from '../../domain/journal.types'
import { formatPen, journalStatusVariant } from '../../domain/journal.utils'

const route = useRoute()
const router = useRouter()

const entryId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? id : ''
})

const { data, isLoading, isError, refetch } = useContabilidadJournalDetail(entryId)
const entry = computed(() => data.value?.entry)

const { mutate: deleteDraft, isPending: deleting } = useContabilidadDeleteJournal()
const { mutate: postJournal, isPending: posting } = useContabilidadPostJournal()
const { mutate: reverseJournal, isPending: reversing } = useContabilidadReverseJournal()

const statusLabel = computed(() => {
  const status = entry.value?.status ?? ''
  return CONTABILIDAD_JOURNAL_STATUS_LABELS[status as keyof typeof CONTABILIDAD_JOURNAL_STATUS_LABELS] ?? status
})

const isDraft = computed(() => entry.value?.status === CONTABILIDAD_JOURNAL_STATUS.DRAFT)
const isPosted = computed(() => entry.value?.status === CONTABILIDAD_JOURNAL_STATUS.POSTED)

function goBack() {
  void router.push({ name: 'contabilidad-asientos-libro-diario' })
}

function goEdit() {
  if (!entry.value) return
  void router.push({ name: 'contabilidad-asiento-editar', params: { id: entry.value.id } })
}

function printEntry() {
  window.print()
}

async function confirmDelete() {
  if (!entry.value) return
  const ok = await markapAlert.confirmDanger({
    title: 'Eliminar borrador',
    text: `¿Eliminar el asiento N° ${entry.value.entryNumber}?`,
    confirmText: 'Eliminar',
  })
  if (!ok) return
  deleteDraft(entry.value.id, {
    onSuccess: () => void router.push({ name: 'contabilidad-asientos-libro-diario' }),
  })
}

async function confirmPost() {
  if (!entry.value) return
  const ok = await markapAlert.confirm({
    title: 'Publicar asiento',
    text: 'El asiento quedará registrado en el libro diario. No podrá editarse.',
    confirmText: 'Publicar',
  })
  if (!ok) return
  postJournal(entry.value.id)
}

async function confirmReverse() {
  if (!entry.value) return
  const ok = await markapAlert.confirm({
    title: 'Reversar asiento',
    text: 'Se generará un asiento de reversa y este quedará como reversado.',
    confirmText: 'Reversar',
  })
  if (!ok) return
  reverseJournal(entry.value.id, {
    onSuccess: () => void refetch(),
  })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1200px] mx-auto print:max-w-none">
    <div class="print:hidden">
      <PageHeader
        icon="lucide:file-text"
        :title="entry ? `Asiento N° ${entry.entryNumber}` : 'Detalle de asiento'"
        :subtitle="entry?.description ?? 'Libro diario'"
      >
        <template #actions>
          <BaseButton variant="secondary" @click="goBack">Volver</BaseButton>
          <BaseButton variant="secondary" @click="printEntry">
            <AppIcon icon="lucide:printer" :size="16" class="mr-1.5" />
            Imprimir
          </BaseButton>
          <BaseButton v-if="isDraft" variant="secondary" @click="goEdit">Editar</BaseButton>
          <BaseButton v-if="isDraft" variant="danger" :loading="deleting" @click="confirmDelete">
            Eliminar
          </BaseButton>
          <BaseButton v-if="isDraft" variant="primary" :loading="posting" @click="confirmPost">
            Publicar
          </BaseButton>
          <BaseButton v-if="isPosted" variant="primary" :loading="reversing" @click="confirmReverse">
            Reversar
          </BaseButton>
        </template>
      </PageHeader>
    </div>

    <div v-if="isLoading" class="flex justify-center py-16 print:hidden">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div
      v-else-if="isError || !entry"
      class="rounded-xl border p-8 text-center print:hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <BaseButton variant="secondary" @click="refetch()">Reintentar</BaseButton>
    </div>

    <template v-else>
      <div class="hidden print:block mb-6">
        <h1 class="text-xl font-bold">Asiento contable N° {{ entry.entryNumber }}</h1>
        <p class="text-sm mt-1">{{ entry.description }}</p>
      </div>

      <div
        class="rounded-xl border p-4 sm:p-5 space-y-3 print:border-0 print:p-0"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <div class="flex flex-wrap items-center gap-3">
          <Badge :variant="journalStatusVariant(entry.status)">{{ statusLabel }}</Badge>
          <span class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
            Fecha: <strong :style="{ color: 'var(--color-text-primary)' }">{{ entry.entryDate }}</strong>
          </span>
          <span v-if="entry.postedAt" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
            Publicado: {{ new Date(entry.postedAt).toLocaleString('es-PE') }}
          </span>
          <span v-if="entry.reversalOfId" class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
            Reversa de otro asiento
          </span>
        </div>

        <p class="text-sm" :style="{ color: 'var(--color-text-primary)' }">{{ entry.description }}</p>
      </div>

      <div
        class="rounded-xl border overflow-hidden print:border print:border-gray-300"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Cuenta</th>
              <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Centro</th>
              <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Auxiliar</th>
              <th class="text-right py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Debe</th>
              <th class="text-right py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Haber</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="line in entry.lines"
              :key="line.id"
              class="border-b last:border-b-0"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <td class="py-2.5 px-4">
                <span class="font-mono text-xs" :style="{ color: 'var(--color-primary)' }">{{ line.accountCode }}</span>
                <span class="block text-sm">{{ line.accountName }}</span>
                <span v-if="line.description" class="block text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
                  {{ line.description }}
                </span>
              </td>
              <td class="py-2.5 px-4 text-sm">
                <template v-if="line.costCenterCode">{{ line.costCenterCode }}</template>
                <span v-else :style="{ color: 'var(--color-text-muted)' }">—</span>
              </td>
              <td class="py-2.5 px-4 text-xs">
                <div v-if="line.auxiliaryRuc || line.auxiliaryDoc">
                  <div v-if="line.auxiliaryRuc">RUC {{ line.auxiliaryRuc }}</div>
                  <div v-if="line.auxiliaryDoc">Doc. {{ line.auxiliaryDoc }}</div>
                </div>
                <span v-else :style="{ color: 'var(--color-text-muted)' }">—</span>
              </td>
              <td class="py-2.5 px-4 text-right font-mono">{{ formatPen(line.debit) }}</td>
              <td class="py-2.5 px-4 text-right font-mono">{{ formatPen(line.credit) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr :style="{ backgroundColor: 'var(--color-surface-elevated)' }">
              <td colspan="3" class="py-3 px-4 text-right font-medium" :style="{ color: 'var(--color-text-secondary)' }">
                Totales
              </td>
              <td class="py-3 px-4 text-right font-mono font-semibold">{{ formatPen(entry.totalDebit) }}</td>
              <td class="py-3 px-4 text-right font-mono font-semibold">{{ formatPen(entry.totalCredit) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .print\:max-w-none,
  .print\:max-w-none * {
    visibility: visible;
  }
  .print\:max-w-none {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}
</style>
