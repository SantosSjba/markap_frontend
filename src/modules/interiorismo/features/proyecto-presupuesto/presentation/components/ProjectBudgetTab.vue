<script setup lang="ts">
import { ref, toRef } from 'vue'
import {
  BaseButton,
  BaseModal,
  DataTable,
  FormCheckbox,
  FormInput,
  FormSectionCard,
  StatsCard,
  AppIcon,
  ActionsDropdown,
  FileDropzone,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import type { ProjectBudgetDetailDto } from '../../domain/project-budget.types'
import ProjectBudgetAttachments from './ProjectBudgetAttachments.vue'
import {
  useCreateBudgetLineItem,
  useCreateBudgetSection,
  useDeleteBudgetLineItem,
  useDeleteBudgetSection,
  useDuplicateBudgetSnapshot,
  useImportBudgetExcel,
  useUpdateBudgetLineItem,
  useUpdateBudgetSection,
} from '../../application/useProjectBudget'
import { formatSol, INTERVENTION_LEVEL_LABELS } from '../labels'
import { openProjectBudgetPdf } from '../../application/useProjectBudget'

const props = defineProps<{
  projectId: string
  budget: ProjectBudgetDetailDto
}>()

const projectIdRef = toRef(props, 'projectId')

const expanded = ref<Record<string, boolean>>({})
const showSectionModal = ref(false)
const newSectionName = ref('')
const showLineModal = ref(false)
const lineModalSectionId = ref('')
const lineDraft = ref({ description: '', budgetedCost: 0, hasIgv: false })

const createSection = useCreateBudgetSection(projectIdRef)
const updateSection = useUpdateBudgetSection(projectIdRef)
const deleteSection = useDeleteBudgetSection(projectIdRef)
const createLine = useCreateBudgetLineItem(projectIdRef)
const updateLine = useUpdateBudgetLineItem(projectIdRef)
const deleteLine = useDeleteBudgetLineItem(projectIdRef)
const duplicateSnapshot = useDuplicateBudgetSnapshot(projectIdRef)
const importExcel = useImportBudgetExcel(projectIdRef)
const showImportModal = ref(false)
const importFile = ref<File | null>(null)
const importReplace = ref(false)

function isExpanded(id: string) {
  return expanded.value[id] !== false
}

function toggleSection(id: string) {
  expanded.value[id] = !isExpanded(id)
}

function openAddSection() {
  newSectionName.value = ''
  showSectionModal.value = true
}

async function submitSection() {
  const name = newSectionName.value.trim()
  if (!name) return
  await createSection.mutateAsync({ name })
  showSectionModal.value = false
}

function openAddLine(sectionId: string) {
  lineModalSectionId.value = sectionId
  lineDraft.value = { description: '', budgetedCost: 0, hasIgv: false }
  showLineModal.value = true
}

async function submitLine() {
  const description = lineDraft.value.description.trim()
  if (!description) return
  await createLine.mutateAsync({
    sectionId: lineModalSectionId.value,
    description,
    budgetedCost: Number(lineDraft.value.budgetedCost) || 0,
    hasIgv: lineDraft.value.hasIgv,
  })
  showLineModal.value = false
}

async function onDeleteSection(sectionId: string, name: string) {
  const ok = await markapAlert.confirmDanger({
    title: 'Eliminar sección',
    text: `¿Eliminar "${name}" y todas sus partidas?`,
  })
  if (!ok) return
  await deleteSection.mutateAsync(sectionId)
}

async function onDeleteLine(lineItemId: string) {
  const ok = await markapAlert.confirmDanger({
    title: 'Eliminar partida',
    text: 'Esta acción no se puede deshacer.',
  })
  if (!ok) return
  await deleteLine.mutateAsync(lineItemId)
}

async function onDuplicateSnapshot() {
  const ok = await markapAlert.confirm({
    title: 'Duplicar presupuesto',
    text: 'Se creará una copia de todas las secciones y partidas (solo datos cliente, sin compras ni abonos). ¿Continuar?',
    confirmText: 'Duplicar',
  })
  if (!ok) return
  await duplicateSnapshot.mutateAsync()
}

async function submitImportExcel() {
  if (!importFile.value) return
  await importExcel.mutateAsync({ file: importFile.value, replace: importReplace.value })
  showImportModal.value = false
  importFile.value = null
  importReplace.value = false
}

async function saveLineField(
  lineItemId: string,
  field: 'description' | 'budgetedCost' | 'hasIgv',
  value: string | number | boolean,
) {
  await updateLine.mutateAsync({
    lineItemId,
    payload: { [field]: value },
  })
}

const lineCols = [
  { key: 'description', label: 'Descripción', align: 'left' as const },
  { key: 'budgetedCost', label: 'Costo', align: 'left' as const },
  { key: 'utility', label: 'Utilidad', align: 'left' as const },
  { key: 'price', label: 'Precio', align: 'left' as const },
  { key: 'igv', label: 'IGV', align: 'left' as const },
  { key: '_a', label: '', align: 'right' as const },
]
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard title="Presupuesto total" :value="formatSol(budget.totals.priceTotal)">
        <template #icon><AppIcon icon="lucide:banknote" :size="20" color="var(--color-primary)" /></template>
      </StatsCard>
      <StatsCard title="Costo base" :value="formatSol(budget.totals.budgetedCostTotal)">
        <template #icon><AppIcon icon="lucide:calculator" :size="20" color="#2563eb" /></template>
      </StatsCard>
      <StatsCard title="Utilidad" :value="formatSol(budget.totals.utilityTotal)">
        <template #icon><AppIcon icon="lucide:trending-up" :size="20" color="#16a34a" /></template>
      </StatsCard>
      <StatsCard title="IGV" :value="formatSol(budget.totals.igvTotal)">
        <template #icon><AppIcon icon="lucide:receipt" :size="20" color="#d97706" /></template>
      </StatsCard>
    </div>

    <FormSectionCard
      title="Cabecera del presupuesto"
      subtitle="Datos del proyecto según modelo Excel"
      icon="lucide:file-spreadsheet"
    >
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <p class="text-xs font-medium mb-1" :style="{ color: 'var(--color-text-muted)' }">Ciudad</p>
          <p :style="{ color: 'var(--color-text-primary)' }">{{ budget.city ?? '—' }}</p>
        </div>
        <div>
          <p class="text-xs font-medium mb-1" :style="{ color: 'var(--color-text-muted)' }">Nivel intervención</p>
          <p :style="{ color: 'var(--color-text-primary)' }">
            {{ budget.interventionLevel ? (INTERVENTION_LEVEL_LABELS[budget.interventionLevel] ?? budget.interventionLevel) : '—' }}
          </p>
        </div>
        <div>
          <p class="text-xs font-medium mb-1" :style="{ color: 'var(--color-text-muted)' }">Tiempo ejecución</p>
          <p :style="{ color: 'var(--color-text-primary)' }">{{ budget.executionTimeNote ?? '—' }}</p>
        </div>
        <div>
          <p class="text-xs font-medium mb-1" :style="{ color: 'var(--color-text-muted)' }">Utilidad / IGV</p>
          <p :style="{ color: 'var(--color-text-primary)' }">
            {{ budget.defaultUtilityPct }}% · IGV {{ budget.defaultIgvPct }}%
          </p>
        </div>
      </div>
    </FormSectionCard>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
        {{ budget.sections.length }} secciones · Vista cliente (precio final por partida)
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <BaseButton size="sm" variant="outline" @click="showImportModal = true">
          <AppIcon icon="lucide:file-spreadsheet" :size="16" class="mr-1" />
          Importar Excel
        </BaseButton>
        <BaseButton size="sm" variant="outline" @click="openProjectBudgetPdf(projectId)">
          <AppIcon icon="lucide:file-down" :size="16" class="mr-1" />
          Exportar PDF
        </BaseButton>
        <BaseButton
          size="sm"
          variant="outline"
          :loading="duplicateSnapshot.isPending.value"
          :disabled="!budget.sections.length"
          @click="onDuplicateSnapshot"
        >
          <AppIcon icon="lucide:copy" :size="16" class="mr-1" />
          Duplicar snapshot
        </BaseButton>
        <BaseButton size="sm" variant="primary" @click="openAddSection">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
          Nueva sección
        </BaseButton>
      </div>
    </div>

    <div v-if="!budget.sections.length" class="text-center py-12 text-sm" :style="{ color: 'var(--color-text-muted)' }">
      Sin secciones. Agrega la primera zona del proyecto (ej. PRIMER NIVEL, Sala/comedor).
    </div>

    <FormSectionCard
      v-for="section in budget.sections"
      :key="section.id"
      :title="section.name"
      :subtitle="`${section.lineItems.length} partidas · ${formatSol(section.sectionTotal)}`"
      icon="lucide:layers"
      dense
    >
      <template #actions>
        <div class="flex items-center gap-1">
          <BaseButton size="sm" variant="outline" @click="openAddLine(section.id)">
            + Partida
          </BaseButton>
          <button
            type="button"
            class="p-2 rounded-lg hover:bg-[var(--color-hover)]"
            :style="{ color: 'var(--color-text-secondary)' }"
            @click="toggleSection(section.id)"
          >
            <AppIcon :icon="isExpanded(section.id) ? 'lucide:chevron-up' : 'lucide:chevron-down'" :size="18" />
          </button>
          <ActionsDropdown
            :items="[
              {
                label: 'Renombrar',
                icon: 'lucide:pencil',
                onClick: async () => {
                  const name = await markapAlert.promptText({
                    title: 'Renombrar sección',
                    placeholder: section.name,
                    confirmText: 'Guardar',
                  })
                  if (name?.trim()) await updateSection.mutateAsync({ sectionId: section.id, payload: { name: name.trim() } })
                },
              },
              {
                label: 'Eliminar sección',
                icon: 'lucide:trash-2',
                danger: true,
                onClick: () => onDeleteSection(section.id, section.name),
              },
            ]"
          />
        </div>
      </template>

      <div v-show="isExpanded(section.id)" class="space-y-3">
        <DataTable
          empty-text="Sin partidas en esta sección."
          :columns="lineCols"
          :data="section.lineItems"
          row-key="id"
        >
          <template #row="{ row }">
            <td class="py-2 px-3 text-sm max-w-[280px]">
              <input
                class="w-full bg-transparent border-b border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none py-1"
                :value="(row as any).description"
                @change="saveLineField((row as any).id, 'description', ($event.target as HTMLInputElement).value)"
              />
            </td>
            <td class="py-2 px-3 text-sm w-28">
              <input
                type="number"
                min="0"
                step="0.01"
                class="w-full bg-transparent border-b border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none py-1"
                :value="(row as any).budgetedCost"
                @change="saveLineField((row as any).id, 'budgetedCost', Number(($event.target as HTMLInputElement).value))"
              />
            </td>
            <td class="py-2 px-3 text-sm">{{ formatSol((row as any).utilityAmount) }}</td>
            <td class="py-2 px-3 text-sm font-medium">{{ formatSol((row as any).price) }}</td>
            <td class="py-2 px-3">
              <FormCheckbox
                :model-value="(row as any).hasIgv"
                label=""
                @update:model-value="saveLineField((row as any).id, 'hasIgv', $event)"
              />
            </td>
            <td class="py-2 px-3 text-right">
              <ActionsDropdown
                :items="[
                  {
                    label: 'Eliminar',
                    icon: 'lucide:trash-2',
                    danger: true,
                    onClick: () => onDeleteLine((row as any).id),
                  },
                ]"
              />
            </td>
          </template>
        </DataTable>
      </div>
    </FormSectionCard>

    <div
      class="sticky bottom-0 z-10 p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3"
      :style="{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }"
    >
      <span class="text-sm font-medium" :style="{ color: 'var(--color-text-secondary)' }">
        Total presupuesto al cliente
      </span>
      <span class="text-xl font-bold" :style="{ color: 'var(--color-primary)' }">
        {{ formatSol(budget.totals.priceTotal) }}
      </span>
    </div>

    <ProjectBudgetAttachments :project-id="projectId" />

    <BaseModal v-model="showSectionModal" title="Nueva sección">
      <FormInput v-model="newSectionName" label="Nombre de la sección" placeholder="Ej. PRIMER NIVEL" />
      <template #footer>
        <BaseButton variant="outline" @click="showSectionModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="createSection.isPending.value" @click="submitSection">
          Crear
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="showLineModal" title="Nueva partida">
      <div class="space-y-4">
        <FormInput v-model="lineDraft.description" label="Descripción" />
        <FormInput v-model.number="lineDraft.budgetedCost" label="Costo presupuestado (S/)" type="number" />
        <FormCheckbox v-model="lineDraft.hasIgv" label="Aplica IGV" />
      </div>
      <template #footer>
        <BaseButton variant="outline" @click="showLineModal = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="createLine.isPending.value" @click="submitLine">
          Agregar
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="showImportModal" title="Importar presupuesto desde Excel">
      <div class="space-y-4">
        <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          Formato esperado: columnas Descripción y Costo. Las filas sin costo se interpretan como secciones.
        </p>
        <FileDropzone v-model="importFile" accept=".xlsx,.xls" />
        <FormCheckbox v-model="importReplace" label="Reemplazar secciones existentes" />
      </div>
      <template #footer>
        <BaseButton variant="outline" @click="showImportModal = false">Cancelar</BaseButton>
        <BaseButton
          variant="primary"
          :disabled="!importFile"
          :loading="importExcel.isPending.value"
          @click="submitImportExcel"
        >
          Importar
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
