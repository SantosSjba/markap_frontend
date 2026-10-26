<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { useContabilidadAccountsTree } from '../../../plan-cuentas/presentation/composables/useContabilidadAccounts'
import { useContabilidadCostCentersList } from '../../../centros-costo/presentation/composables/useContabilidadCostCenters'
import {
  useContabilidadJournalTemplates,
  useContabilidadApplyJournalTemplate,
} from '../../../plantillas-asiento/presentation/composables/useContabilidadJournalTemplates'
import {
  useContabilidadCreateJournal,
  useContabilidadUpdateJournal,
  useContabilidadJournalDetail,
  useContabilidadPostJournal,
} from '../composables/useContabilidadJournal'
import type {
  ContabilidadJournalEntryDetailDTO,
  JournalLineFormRow,
} from '../../domain/journal.types'
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
} from '../../../../presentation/composables/useContabilidadCurrencies'
import { toCalendarDateString } from '@shared/utils/formatters'
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
  entryDate: toCalendarDateString(),
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
const balanced = computed(() =>
  isJournalBalanced(totals.value.totalDebit, totals.value.totalCredit),
)
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

  createJournal(body, {
    onSuccess: (entry: ContabilidadJournalEntryDetailDTO) => publish(entry.id),
  })
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
  <div class="w-full space-y-6">
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

    <LoadingState v-if="loadingDetail && isEdit" />

    <template v-else>
      <BaseCard padding="sm" class="grid gap-4 sm:grid-cols-2">
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
      </BaseCard>

      <BaseCard padding="none" class="block overflow-hidden">
        <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">Líneas del asiento</h2>
          <BaseButton variant="secondary" size="sm" @click="addLine">
            <AppIcon icon="lucide:plus" :size="14" class="mr-1" />
            Agregar línea
          </BaseButton>
        </div>

        <div class="overflow-x-auto">
          <Table class="w-full text-sm min-w-[1200px]">
            <TableHeader>
              <TableRow class="border-b border-gray-200 dark:border-gray-800">
                <TableCell is-header class="text-left py-2.5 px-3 font-medium w-[26%] text-gray-500 dark:text-gray-400">Cuenta</TableCell>
                <TableCell is-header class="text-left py-2.5 px-3 font-medium w-[8%] text-gray-500 dark:text-gray-400">Moneda</TableCell>
                <TableCell is-header class="text-right py-2.5 px-3 font-medium w-[9%] text-gray-500 dark:text-gray-400">Importe ME</TableCell>
                <TableCell is-header class="text-right py-2.5 px-3 font-medium w-[8%] text-gray-500 dark:text-gray-400">TC</TableCell>
                <TableCell is-header class="text-right py-2.5 px-3 font-medium w-[9%] text-gray-500 dark:text-gray-400">Debe</TableCell>
                <TableCell is-header class="text-right py-2.5 px-3 font-medium w-[9%] text-gray-500 dark:text-gray-400">Haber</TableCell>
                <TableCell is-header class="text-left py-2.5 px-3 font-medium w-[14%] text-gray-500 dark:text-gray-400">Centro costo</TableCell>
                <TableCell is-header class="text-left py-2.5 px-3 font-medium w-[8%] text-gray-500 dark:text-gray-400">RUC aux.</TableCell>
                <TableCell is-header class="text-left py-2.5 px-3 font-medium w-[8%] text-gray-500 dark:text-gray-400">Doc. aux.</TableCell>
                <TableCell is-header class="py-2.5 px-3 w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="(line, index) in lines"
                :key="line.key"
                class="border-b align-top border-gray-200 dark:border-gray-800"
              >
                <TableCell class="py-2 px-3">
                  <FormSelect v-model="line.accountId" :options="accountOptions" placeholder="Cuenta de movimiento…" />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <FormSelect v-model="line.foreignCurrency" :options="currencyOptions" />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <FormInput
                    v-model="line.foreignAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    :disabled="!line.foreignCurrency"
                    @blur="onForeignBlur(line)"
                  />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <FormInput
                    v-model="line.exchangeRate"
                    type="number"
                    min="0"
                    step="0.000001"
                    placeholder="TC"
                    :disabled="!line.foreignCurrency"
                    @blur="onForeignBlur(line)"
                  />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <FormInput
                    v-model="line.debit"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="onDebitInput(line)"
                  />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <FormInput
                    v-model="line.credit"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="onCreditInput(line)"
                  />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <FormSelect v-model="line.costCenterId" :options="costCenterOptions" />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <FormInput v-model="line.auxiliaryRuc" placeholder="RUC" />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <FormInput v-model="line.auxiliaryDoc" placeholder="Doc." />
                </TableCell>
                <TableCell class="py-2 px-3">
                  <BaseButton variant="ghost" size="sm" @click="removeLine(index)">
                    <AppIcon icon="lucide:trash-2" :size="16" />
                  </BaseButton>
                </TableCell>
              </TableRow>
            </TableBody>
            <tfoot>
              <TableRow class="bg-gray-50 dark:bg-gray-800">
                <TableCell class="py-3 px-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Totales
                </TableCell>
                <TableCell class="py-3 px-3 text-right font-mono font-semibold">
                  {{ formatPen(totals.totalDebit) }}
                </TableCell>
                <TableCell class="py-3 px-3 text-right font-mono font-semibold">
                  {{ formatPen(totals.totalCredit) }}
                </TableCell>
                <TableCell colspan="6" class="py-3 px-3">
                  <Badge :variant="balanced ? 'success' : 'warning'">
                    <AppIcon :icon="balanced ? 'lucide:check-circle-2' : 'lucide:alert-circle'" :size="14" />
                    {{ balanced ? 'Asiento cuadrado' : `Diferencia: S/ ${difference}` }}
                  </Badge>
                </TableCell>
              </TableRow>
            </tfoot>
          </Table>
        </div>
      </BaseCard>
    </template>
  </div>
</template>
