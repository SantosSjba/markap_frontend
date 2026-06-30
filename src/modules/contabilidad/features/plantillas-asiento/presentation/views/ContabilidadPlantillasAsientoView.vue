<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  BaseButton,
  AppIcon,
  Badge,
  BaseModal,
  DataTable,
  FormCheckbox,
  FormInput,
  FormSelect,
  FormTextarea,
  PageHeader,
} from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useContabilidadAccountsTree } from '@modules/contabilidad/features/plan-cuentas/application/useContabilidadAccounts'
import { useContabilidadCostCentersList } from '@modules/contabilidad/features/centros-costo/application/useContabilidadCostCenters'
import { flattenMovementAccounts } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import {
  useContabilidadJournalTemplates,
  useContabilidadCreateJournalTemplate,
  useContabilidadUpdateJournalTemplate,
} from '../../application/useContabilidadJournalTemplates'
import type { ContabilidadJournalTemplateDTO } from '../../domain/journal-template.types'
import {
  linesFromTemplate,
  linesToBody,
  newJournalTemplateLineRow,
  type JournalTemplateLineFormRow,
} from '../../domain/journal-template.types'

const { data, isLoading, refetch } = useContabilidadJournalTemplates()
const rows = computed(() => data.value?.templates ?? [])

const { mutate: createTemplate, isPending: creating } = useContabilidadCreateJournalTemplate()
const { mutate: updateTemplate, isPending: updating } = useContabilidadUpdateJournalTemplate()

const emptySearch = ref('')
const { data: accountsData } = useContabilidadAccountsTree(emptySearch)
const { data: costCenters } = useContabilidadCostCentersList(emptySearch)

const accountOptions = computed(() => flattenMovementAccounts(accountsData.value?.tree ?? []))
const costCenterOptions = computed(() => [
  { value: '', label: 'Sin centro de costo' },
  ...(costCenters.value ?? [])
    .filter((cc) => cc.isActive)
    .map((cc) => ({ value: cc.id, label: `${cc.code} — ${cc.name}` })),
])

const modalOpen = ref(false)
const editing = ref<ContabilidadJournalTemplateDTO | null>(null)
const form = ref({
  name: '',
  description: '',
  isActive: true,
})
const lines = ref<JournalTemplateLineFormRow[]>([newJournalTemplateLineRow(), newJournalTemplateLineRow()])

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'description', label: 'Descripción' },
  { key: 'lines', label: 'Líneas', align: 'center' as const },
  { key: 'isActive', label: 'Estado' },
  { key: 'actions', label: '', align: 'right' as const },
]

function openNew() {
  editing.value = null
  form.value = { name: '', description: '', isActive: true }
  lines.value = [newJournalTemplateLineRow(), newJournalTemplateLineRow()]
  modalOpen.value = true
}

function openEdit(row: ContabilidadJournalTemplateDTO) {
  editing.value = row
  form.value = {
    name: row.name,
    description: row.description ?? '',
    isActive: row.isActive,
  }
  lines.value = linesFromTemplate(row)
  modalOpen.value = true
}

function addLine() {
  lines.value.push(newJournalTemplateLineRow())
}

function removeLine(index: number) {
  if (lines.value.length <= 2) {
    void markapAlert.toast.warning('La plantilla requiere al menos dos líneas')
    return
  }
  lines.value.splice(index, 1)
}

function submit() {
  if (!form.value.name.trim()) {
    void markapAlert.toast.warning('El nombre es obligatorio')
    return
  }
  const bodyLines = linesToBody(lines.value)
  if (bodyLines.length < 2) {
    void markapAlert.toast.warning('Agregue al menos dos líneas con cuenta')
    return
  }
  const payload = {
    name: form.value.name.trim(),
    description: form.value.description.trim() || null,
    isActive: form.value.isActive,
    lines: bodyLines,
  }
  if (editing.value) {
    updateTemplate(
      { id: editing.value.id, body: payload },
      { onSuccess: () => { modalOpen.value = false; void refetch() } },
    )
  } else {
    createTemplate(payload, { onSuccess: () => { modalOpen.value = false; void refetch() } })
  }
}

watch(modalOpen, (open) => {
  if (!open) editing.value = null
})
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:layout-template"
      title="Plantillas de asiento"
      subtitle="Modelos reutilizables con cuentas, importes y centros de costo predefinidos."
    >
      <template #actions>
        <BaseButton variant="primary" @click="openNew">
          <AppIcon icon="lucide:plus" :size="16" class="mr-1" />
          Nueva plantilla
        </BaseButton>
      </template>
    </PageHeader>

    <div
      class="rounded-xl border overflow-hidden"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <DataTable
        :columns="columns"
        :data="rows"
        :loading="isLoading"
        empty-text="Sin plantillas registradas."
        row-key="id"
      >
        <template #row="{ row }">
          <td class="py-3 px-4 text-sm font-medium">{{ (row as ContabilidadJournalTemplateDTO).name }}</td>
          <td class="py-3 px-4 text-sm max-w-xs truncate">
            {{ (row as ContabilidadJournalTemplateDTO).description ?? '—' }}
          </td>
          <td class="py-3 px-4 text-sm text-center">
            {{ (row as ContabilidadJournalTemplateDTO).lines.length }}
          </td>
          <td class="py-3 px-4">
            <Badge :variant="(row as ContabilidadJournalTemplateDTO).isActive ? 'success' : 'neutral'">
              {{ (row as ContabilidadJournalTemplateDTO).isActive ? 'Activa' : 'Inactiva' }}
            </Badge>
          </td>
          <td class="py-3 px-4 text-right">
            <BaseButton variant="secondary" size="sm" @click="openEdit(row as ContabilidadJournalTemplateDTO)">
              Editar
            </BaseButton>
          </td>
        </template>
      </DataTable>
    </div>

    <BaseModal
      v-model="modalOpen"
      :title="editing ? 'Editar plantilla' : 'Nueva plantilla'"
      size="lg"
    >
      <form class="space-y-4" @submit.prevent="submit">
        <div class="grid gap-4 sm:grid-cols-2">
          <FormInput v-model="form.name" label="Nombre" required />
          <div class="flex items-end pb-1">
            <FormCheckbox v-model="form.isActive" label="Plantilla activa" />
          </div>
        </div>
        <FormTextarea v-model="form.description" label="Descripción" :rows="2" />

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">Líneas del asiento</h3>
            <BaseButton type="button" variant="secondary" size="sm" @click="addLine">
              <AppIcon icon="lucide:plus" :size="14" class="mr-1" />
              Línea
            </BaseButton>
          </div>

          <div
            v-for="(line, index) in lines"
            :key="line.key"
            class="rounded-lg border p-3 space-y-3"
            :style="{ borderColor: 'var(--color-border)' }"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium" :style="{ color: 'var(--color-text-secondary)' }">
                Línea {{ index + 1 }}
              </span>
              <BaseButton type="button" variant="ghost" size="sm" @click="removeLine(index)">
                <AppIcon icon="lucide:trash-2" :size="14" />
              </BaseButton>
            </div>
            <FormSelect v-model="line.accountId" label="Cuenta" :options="accountOptions" />
            <div class="grid gap-3 sm:grid-cols-2">
              <FormInput v-model="line.defaultDebit" label="Debe (S/)" type="number" min="0" step="0.01" />
              <FormInput v-model="line.defaultCredit" label="Haber (S/)" type="number" min="0" step="0.01" />
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <FormSelect v-model="line.costCenterId" label="Centro de costo" :options="costCenterOptions" />
              <FormInput v-model="line.description" label="Glosa línea" />
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <BaseButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="creating || updating">
            {{ editing ? 'Guardar' : 'Crear' }}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
