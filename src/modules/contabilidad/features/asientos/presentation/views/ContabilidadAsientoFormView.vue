<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BaseButton,
  AppIcon,
  FormInput,
  FormSelect,
  FormTextarea,
  PageHeader,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { useContabilidadAccountsTree } from '@modules/contabilidad/features/plan-cuentas/application/useContabilidadAccounts'
import { useContabilidadCostCentersList } from '@modules/contabilidad/features/centros-costo/application/useContabilidadCostCenters'
import {
  useContabilidadJournalTemplates,
  useContabilidadApplyJournalTemplate,
} from '@modules/contabilidad/features/plantillas-asiento/application/useContabilidadJournalTemplates'
import {
  useContabilidadCreateJournal,
  useContabilidadUpdateJournal,
  useContabilidadJournalDetail,
  useContabilidadPostJournal,
} from '../../application/useContabilidadJournal'
import type { ContabilidadJournalEntryDetailDTO, JournalLineFormRow } from '../../domain/journal.types'
import {
  flattenMovementAccounts,
  formatPen,
  isJournalBalanced,
  linesFromDetail,
  linesToBody,
  newJournalLineRow,
  sumLineAmounts,
  applyForeignToPenLine,
} from '../../domain/journal.utils'
import {
  FUNCTIONAL_CURRENCY,
  useContabilidadCurrencies,
} from '@modules/contabilidad/presentation/composables/useContabilidadCurrencies'

const route = useRoute()
const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()

const entryId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' && route.name === 'contabilidad-asiento-editar' ? id : undefined
})
const isEdit = computed(() => Boolean(entryId.value))

const { data: detailData, isLoading: loadingDetail } = useContabilidadJournalDetail(entryId)
const { data: accountsData } = useContabilidadAccountsTree(ref(''))
const emptySearch = ref('')
const { data: costCenters } = useContabilidadCostCentersList(emptySearch)

const { mutate: createJournal, isPending: creating } = useContabilidadCreateJournal()
const { mutate: updateJournal, isPending: updating } = useContabilidadUpdateJournal()
const { mutate: postJournal, isPending: posting } = useContabilidadPostJournal()

const { data: templatesData } = useContabilidadJournalTemplates()
const { mutate: applyTemplate, isPending: applyingTemplate } = useContabilidadApplyJournalTemplate()
const selectedTemplateId = ref('')
const { data: currenciesData } = useContabilidadCurrencies()

const currencyOptions = computed(() => [
  { value: '', label: 'PEN (soles)' },
  ...(currenciesData.value ?? [])
    .filter((c) => c.code !== FUNCTIONAL_CURRENCY)
    .map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` })),
])

const templateOptions = computed(() => [
  { value: '', label: 'Sin plantilla' },
  ...(templatesData.value?.templates ?? [])
    .filter((t) => t.isActive)
    .map((t) => ({ value: t.id, label: t.name })),
])

const form = ref({
  entryDate: new Date().toISOString().slice(0, 10),
  description: '',
})
const lines = ref<JournalLineFormRow[]>([newJournalLineRow(), newJournalLineRow()])

const accountOptions = computed(() => flattenMovementAccounts(accountsData.value?.tree ?? []))
const costCenterOptions = computed(() => [
  { value: '', label: 'Sin centro de costo' },
  ...(costCenters.value ?? [])
    .filter((cc) => cc.isActive)
    .map((cc) => ({ value: cc.id, label: `${cc.code} — ${cc.name}` })),
])

const totals = computed(() => sumLineAmounts(lines.value))
const balanced = computed(() => isJournalBalanced(totals.value.totalDebit, totals.value.totalCredit))
const difference = computed(() =>
  Math.abs(totals.value.totalDebit - totals.value.totalCredit).toFixed(2),
)

watch(
  () => detailData.value?.entry,
  (entry) => {
    if (!entry || !isEdit.value) return
    form.value.entryDate = entry.entryDate
    form.value.description = entry.description
    lines.value = linesFromDetail(entry.lines)
    if (lines.value.length < 2) {
      while (lines.value.length < 2) lines.value.push(newJournalLineRow())
    }
  },
  { immediate: true },
)

watch(
  activePeriod,
  (period) => {
    if (!period || isEdit.value) return
    const now = new Date()
    const year = period.year
    const month = String(period.month).padStart(2, '0')
    const day = String(Math.min(now.getDate(), 28)).padStart(2, '0')
    form.value.entryDate = `${year}-${month}-${day}`
  },
  { immediate: true },
)

function addLine() {
  lines.value.push(newJournalLineRow())
}

function removeLine(index: number) {
  if (lines.value.length <= 2) {
    void markapAlert.toast.warning('El asiento requiere al menos dos líneas')
    return
  }
  lines.value.splice(index, 1)
}

function onDebitInput(line: JournalLineFormRow) {
  if (line.debit.trim()) line.credit = ''
}

function onCreditInput(line: JournalLineFormRow) {
  if (line.credit.trim()) line.debit = ''
}

function onForeignBlur(line: JournalLineFormRow) {
  applyForeignToPenLine(line)
}

function buildPayload() {
  if (!activePeriod.value) {
    void markapAlert.toast.warning('Seleccione un periodo activo')
    return null
  }
  if (!form.value.description.trim()) {
    void markapAlert.toast.warning('La glosa es obligatoria')
    return null
  }
  if (lines.value.some((line) => !line.accountId)) {
    void markapAlert.toast.warning('Todas las líneas deben tener cuenta')
    return null
  }

  return {
    periodId: activePeriod.value.id,
    entryDate: form.value.entryDate,
    description: form.value.description.trim(),
    lines: linesToBody(lines.value),
  }
}

function saveDraft() {
  const body = buildPayload()
  if (!body) return

  if (isEdit.value && entryId.value) {
    updateJournal(
      { id: entryId.value, body },
      {
        onSuccess: (entry: ContabilidadJournalEntryDetailDTO) => {
          void router.push({ name: 'contabilidad-asiento-detalle', params: { id: entry.id } })
        },
      },
    )
    return
  }

  createJournal(body, {
    onSuccess: (entry: ContabilidadJournalEntryDetailDTO) => {
      void router.push({ name: 'contabilidad-asiento-detalle', params: { id: entry.id } })
    },
  })
}

function saveAndPost() {
  if (!balanced.value) {
    void markapAlert.toast.warning('El asiento debe cuadrar antes de publicar')
    return
  }
  const body = buildPayload()
  if (!body) return

  const publish = (id: string) => {
    postJournal(id, {
      onSuccess: () => {
        void router.push({ name: 'contabilidad-asiento-detalle', params: { id } })
      },
    })
  }

  if (isEdit.value && entryId.value) {
    updateJournal(
      { id: entryId.value, body },
      { onSuccess: (entry: ContabilidadJournalEntryDetailDTO) => publish(entry.id) },
    )
    return
  }

  createJournal(body, { onSuccess: (entry: ContabilidadJournalEntryDetailDTO) => publish(entry.id) })
}

function goBack() {
  if (isEdit.value && entryId.value) {
    void router.push({ name: 'contabilidad-asiento-detalle', params: { id: entryId.value } })
    return
  }
  void router.push({ name: 'contabilidad-asientos-libro-diario' })
}

function applySelectedTemplate() {
  if (!selectedTemplateId.value) {
    void markapAlert.toast.warning('Seleccione una plantilla')
    return
  }
  applyTemplate(selectedTemplateId.value, {
    onSuccess: (result) => {
      if (result.description?.trim()) {
        form.value.description = result.description.trim()
      } else if (result.templateName) {
        form.value.description = result.templateName
      }
      lines.value = result.lines.map((line) => ({
        key: crypto.randomUUID(),
        accountId: line.accountId,
        debit: Number(line.debit) > 0 ? line.debit : '',
        credit: Number(line.credit) > 0 ? line.credit : '',
        foreignCurrency: '',
        foreignAmount: '',
        exchangeRate: '',
        costCenterId: line.costCenterId ?? '',
        auxiliaryRuc: '',
        auxiliaryDoc: '',
        description: line.description ?? '',
      }))
      if (lines.value.length < 2) {
        while (lines.value.length < 2) lines.value.push(newJournalLineRow())
      }
      void markapAlert.toast.success(`Plantilla «${result.templateName}» aplicada`)
    },
  })
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <PageHeader
      icon="lucide:file-pen-line"
      :title="isEdit ? 'Editar asiento' : 'Nuevo asiento'"
      subtitle="Registre las líneas del asiento. Debe = Haber para publicar."
    >
      <template #actions>
        <BaseButton variant="secondary" @click="goBack">Cancelar</BaseButton>
        <BaseButton variant="secondary" :loading="creating || updating" @click="saveDraft">
          Guardar borrador
        </BaseButton>
        <BaseButton variant="primary" :loading="creating || updating || posting" @click="saveAndPost">
          Publicar
        </BaseButton>
      </template>
    </PageHeader>

    <div v-if="loadingDetail && isEdit" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <template v-else>
      <div
        class="rounded-xl border p-4 sm:p-5 grid gap-4 sm:grid-cols-2"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <FormInput v-model="form.entryDate" label="Fecha" type="date" required />
        <div class="sm:col-span-2">
          <FormTextarea v-model="form.description" label="Glosa" :rows="2" required />
        </div>
        <div v-if="!isEdit" class="sm:col-span-2 flex flex-col sm:flex-row sm:items-end gap-3">
          <FormSelect
            v-model="selectedTemplateId"
            label="Plantilla de asiento"
            :options="templateOptions"
            class="flex-1"
          />
          <BaseButton
            variant="secondary"
            :loading="applyingTemplate"
            :disabled="!selectedTemplateId"
            @click="applySelectedTemplate"
          >
            <AppIcon icon="lucide:layout-template" :size="16" class="mr-1" />
            Aplicar plantilla
          </BaseButton>
        </div>
      </div>

      <div
        class="rounded-xl border overflow-hidden"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <div class="flex items-center justify-between gap-3 px-4 py-3 border-b" :style="{ borderColor: 'var(--color-border)' }">
          <h2 class="text-sm font-semibold" :style="{ color: 'var(--color-text-primary)' }">Líneas del asiento</h2>
          <BaseButton variant="secondary" size="sm" @click="addLine">
            <AppIcon icon="lucide:plus" :size="14" class="mr-1" />
            Agregar línea
          </BaseButton>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1200px]">
            <thead>
              <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
                <th class="text-left py-2.5 px-3 font-medium w-[26%]" :style="{ color: 'var(--color-text-secondary)' }">Cuenta</th>
                <th class="text-left py-2.5 px-3 font-medium w-[8%]" :style="{ color: 'var(--color-text-secondary)' }">Moneda</th>
                <th class="text-right py-2.5 px-3 font-medium w-[9%]" :style="{ color: 'var(--color-text-secondary)' }">Importe ME</th>
                <th class="text-right py-2.5 px-3 font-medium w-[8%]" :style="{ color: 'var(--color-text-secondary)' }">TC</th>
                <th class="text-right py-2.5 px-3 font-medium w-[9%]" :style="{ color: 'var(--color-text-secondary)' }">Debe</th>
                <th class="text-right py-2.5 px-3 font-medium w-[9%]" :style="{ color: 'var(--color-text-secondary)' }">Haber</th>
                <th class="text-left py-2.5 px-3 font-medium w-[14%]" :style="{ color: 'var(--color-text-secondary)' }">Centro costo</th>
                <th class="text-left py-2.5 px-3 font-medium w-[8%]" :style="{ color: 'var(--color-text-secondary)' }">RUC aux.</th>
                <th class="text-left py-2.5 px-3 font-medium w-[8%]" :style="{ color: 'var(--color-text-secondary)' }">Doc. aux.</th>
                <th class="py-2.5 px-3 w-10" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(line, index) in lines"
                :key="line.key"
                class="border-b align-top"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <td class="py-2 px-3">
                  <FormSelect v-model="line.accountId" :options="accountOptions" placeholder="Cuenta de movimiento…" />
                </td>
                <td class="py-2 px-3">
                  <FormSelect v-model="line.foreignCurrency" :options="currencyOptions" />
                </td>
                <td class="py-2 px-3">
                  <FormInput
                    v-model="line.foreignAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    :disabled="!line.foreignCurrency"
                    @blur="onForeignBlur(line)"
                  />
                </td>
                <td class="py-2 px-3">
                  <FormInput
                    v-model="line.exchangeRate"
                    type="number"
                    min="0"
                    step="0.000001"
                    placeholder="TC"
                    :disabled="!line.foreignCurrency"
                    @blur="onForeignBlur(line)"
                  />
                </td>
                <td class="py-2 px-3">
                  <FormInput
                    v-model="line.debit"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="onDebitInput(line)"
                  />
                </td>
                <td class="py-2 px-3">
                  <FormInput
                    v-model="line.credit"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="onCreditInput(line)"
                  />
                </td>
                <td class="py-2 px-3">
                  <FormSelect v-model="line.costCenterId" :options="costCenterOptions" />
                </td>
                <td class="py-2 px-3">
                  <FormInput v-model="line.auxiliaryRuc" placeholder="RUC" />
                </td>
                <td class="py-2 px-3">
                  <FormInput v-model="line.auxiliaryDoc" placeholder="Doc." />
                </td>
                <td class="py-2 px-3">
                  <BaseButton variant="ghost" size="sm" @click="removeLine(index)">
                    <AppIcon icon="lucide:trash-2" :size="16" />
                  </BaseButton>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr :style="{ backgroundColor: 'var(--color-surface-elevated)' }">
                <td class="py-3 px-3 text-right font-medium" :style="{ color: 'var(--color-text-secondary)' }">
                  Totales
                </td>
                <td class="py-3 px-3 text-right font-mono font-semibold">
                  {{ formatPen(totals.totalDebit) }}
                </td>
                <td class="py-3 px-3 text-right font-mono font-semibold">
                  {{ formatPen(totals.totalCredit) }}
                </td>
                <td colspan="6" class="py-3 px-3">
                  <span
                    class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                    :style="{
                      backgroundColor: balanced ? 'var(--color-primary-soft)' : 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
                      color: balanced ? 'var(--color-primary)' : 'var(--color-warning)',
                    }"
                  >
                    <AppIcon :icon="balanced ? 'lucide:check-circle-2' : 'lucide:alert-circle'" :size="14" />
                    {{ balanced ? 'Asiento cuadrado' : `Diferencia: S/ ${difference}` }}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
