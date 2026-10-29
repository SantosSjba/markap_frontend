<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, filterActions } = useApplicationAccess('interiorismo')

import { computed, reactive, ref, toRef } from 'vue'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import HelpTooltip from '@shared/presentation/components/ui/HelpTooltip.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { formatDate, toCalendarDateString } from '@shared/utils/formatters'
import type { InteriorExecutionMilestoneDto } from '../../domain/execution.types'
import {
  useCreateExecutionMilestone,
  useDeleteExecutionMilestone,
  useUpdateExecutionMilestone,
} from '../composables/useInteriorExecution'
/** ExecutionMilestones — cronograma de hitos: alta, edición, cumplir / reabrir y eliminar. */

const props = defineProps<{ projectId: string; milestones: readonly InteriorExecutionMilestoneDto[] }>()
const today = toCalendarDateString()

const sorted = computed(() => [...props.milestones].sort((a, b) => a.plannedDate.localeCompare(b.plannedDate)))
const statusOf = (m: InteriorExecutionMilestoneDto) =>
  m.completedAt ? { label: 'Cumplido', variant: 'success' as const } : m.plannedDate < today ? { label: 'Atrasado', variant: 'error' as const } : { label: 'Pendiente', variant: 'warning' as const }

const pid = toRef(props, 'projectId')
const createM = useCreateExecutionMilestone(pid)
const updateM = useUpdateExecutionMilestone(pid)
const deleteM = useDeleteExecutionMilestone(pid)

// ── Formulario ──
const FORM_ID = 'interior-milestone-form'
const formOpen = ref(false)
const editing = ref<InteriorExecutionMilestoneDto | null>(null)
const { defineComponentBinds, handleSubmit, resetForm } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      title: yup.string().trim().required('El título es obligatorio').max(200, 'Máximo 200 caracteres'),
      plannedDate: yup.string().required('Indique la fecha'),
    }),
  ),
})
/** `reactive` desenvuelve los Ref de `defineComponentBinds` al usarlos como `binds.campo` en la plantilla. */
const binds = reactive({ title: defineComponentBinds('title'), plannedDate: defineComponentBinds('plannedDate') })

function openForm(m?: InteriorExecutionMilestoneDto) {
  editing.value = m ?? null
  resetForm({ values: { title: m?.title ?? '', plannedDate: m?.plannedDate ?? today } })
  formOpen.value = true
}
const onSubmit = handleSubmit(async (v) => {
  if (editing.value) await updateM.mutateAsync({ milestoneId: editing.value.id, payload: v })
  else await createM.mutateAsync(v)
  formOpen.value = false
})

function toggle(m: InteriorExecutionMilestoneDto) {
  updateM.mutate({ milestoneId: m.id, payload: { completed: !m.completedAt } })
}
async function remove(m: InteriorExecutionMilestoneDto) {
  const ok = await markapAlert.confirmDanger({ title: '¿Eliminar hito?', text: m.title, confirmText: 'Eliminar' })
  if (ok) await deleteM.mutateAsync(m.id)
}
const actionsFor = (m: InteriorExecutionMilestoneDto) =>
  filterActions([
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => openForm(m) },
    { label: m.completedAt ? 'Reabrir' : 'Marcar cumplido', icon: m.completedAt ? 'lucide:rotate-ccw' : 'lucide:check', onClick: () => toggle(m) },
    { label: 'Eliminar', icon: 'lucide:trash-2', danger: true, onClick: () => void remove(m) },
  ])
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        {{ milestones.filter((m) => m.completedAt).length }} de {{ milestones.length }} hitos cumplidos · también aparecen en el Calendario
        <HelpTooltip
          title="Cronograma de hitos"
          text="Entregas clave con fecha planificada. Toque el círculo para marcarlo cumplido. Si pasa la fecha sin cumplirse aparece como «Atrasado». El avance del proyecto (hitos cumplidos) se muestra en la ficha."
          width="w-72"
        />
      </p>
      <BaseButton v-if="canWrite" variant="primary" size="sm" icon="lucide:plus" @click="openForm()">Nuevo hito</BaseButton>
    </div>

    <div v-if="!sorted.length" class="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400 dark:border-gray-800 dark:text-gray-500">
      Sin hitos. Agrega las entregas clave del proyecto (diseño aprobado, llegada de mobiliario, entrega final…).
    </div>
    <ol v-else class="relative space-y-1 border-l border-gray-200 pl-5 dark:border-gray-800">
      <li v-for="m in sorted" :key="m.id" class="group relative flex items-center gap-3 rounded-lg py-2 pr-2">
        <button
          type="button"
          class="absolute -left-[29px] flex size-4 items-center justify-center rounded-full border-2 bg-white dark:bg-gray-900"
          :class="m.completedAt ? 'border-success-500 bg-success-500! text-white' : 'border-theme-purple-500'"
          :disabled="!canWrite"
          :aria-label="m.completedAt ? 'Reabrir hito' : 'Marcar hito como cumplido'"
          @click="toggle(m)"
        >
          <AppIcon v-if="m.completedAt" icon="lucide:check" :size="10" />
        </button>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-gray-800 dark:text-white/90" :class="m.completedAt ? 'line-through opacity-60' : ''">{{ m.title }}</p>
          <p class="text-theme-xs text-gray-500 first-letter:uppercase dark:text-gray-400">{{ formatDate(m.plannedDate, { weekday: 'short' }) }}</p>
        </div>
        <Badge :variant="statusOf(m).variant">{{ statusOf(m).label }}</Badge>
        <ActionsDropdown :items="actionsFor(m)" />
      </li>
    </ol>

    <BaseModal v-model="formOpen" :title="editing ? 'Editar hito' : 'Nuevo hito'" size="sm">
      <form :id="FORM_ID" class="space-y-4" @submit.prevent="onSubmit">
        <FormInput v-bind="binds.title" label="Hito" placeholder="Ej. Entrega de mobiliario" required />
        <FormInput v-bind="binds.plannedDate" type="date" label="Fecha planificada" required />
      </form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" @click="formOpen = false">Cancelar</BaseButton>
          <BaseButton variant="primary" type="submit" :form="FORM_ID" :loading="createM.isPending.value || updateM.isPending.value">Guardar</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
