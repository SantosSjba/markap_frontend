<script setup lang="ts">
import { computed, reactive, toRef, watch } from 'vue'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import type { InteriorExecutionTaskDto } from '../../domain/execution.types'
import { useCreateExecutionTask, useUpdateExecutionTask } from '../composables/useInteriorExecution'
import { KANBAN_LABELS, PHASE_LABELS } from '../labels'
/** ExecutionTaskFormModal — alta y edición de una tarea de obra. */

const props = defineProps<{ projectId: string; task?: InteriorExecutionTaskDto | null; defaultStatus?: string }>()
const open = defineModel<boolean>('open', { required: true })

const FORM_ID = 'interior-execution-task-form'
const phaseOptions = Object.entries(PHASE_LABELS).map(([value, label]) => ({ value, label }))
const statusOptions = Object.entries(KANBAN_LABELS).map(([value, label]) => ({ value, label }))

const schema = yup.object({
  phase: yup.string().required('Seleccione la fase'),
  title: yup.string().trim().required('El título es obligatorio').max(200, 'Máximo 200 caracteres'),
  description: yup.string().trim(),
  kanbanStatus: yup.string().required(),
  plannedStart: yup.string().trim(),
  plannedEnd: yup
    .string()
    .trim()
    .test('after-start', 'El fin no puede ser antes del inicio', function (end) {
      const start = this.parent.plannedStart as string | undefined
      return !start || !end || end >= start
    }),
  progressPct: yup.number().typeError('Ingrese un número').min(0, 'Mínimo 0').max(100, 'Máximo 100').required(),
})

const { defineComponentBinds, handleSubmit, resetForm } = useForm({ validationSchema: toTypedSchema(schema) })
/** `reactive` desenvuelve los Ref de `defineComponentBinds` al usarlos como `binds.campo` en la plantilla. */
const binds = reactive({
  phase: defineComponentBinds('phase'),
  title: defineComponentBinds('title'),
  description: defineComponentBinds('description'),
  kanbanStatus: defineComponentBinds('kanbanStatus'),
  plannedStart: defineComponentBinds('plannedStart'),
  plannedEnd: defineComponentBinds('plannedEnd'),
  progressPct: defineComponentBinds('progressPct'),
})

watch(open, (isOpen) => {
  if (!isOpen) return
  const t = props.task
  resetForm({
    values: {
      phase: t?.phase ?? 'DESIGN',
      title: t?.title ?? '',
      description: t?.description ?? '',
      kanbanStatus: t?.kanbanStatus ?? props.defaultStatus ?? 'BACKLOG',
      plannedStart: t?.plannedStart ?? '',
      plannedEnd: t?.plannedEnd ?? '',
      progressPct: t?.progressPct ?? 0,
    },
  })
})

const pid = toRef(props, 'projectId')
const createTask = useCreateExecutionTask(pid)
const updateTask = useUpdateExecutionTask(pid)
const saving = computed(() => createTask.isPending.value || updateTask.isPending.value)

const onSubmit = handleSubmit(async (v) => {
  const payload = {
    phase: v.phase,
    title: v.title,
    description: v.description || null,
    kanbanStatus: v.kanbanStatus,
    plannedStart: v.plannedStart || null,
    plannedEnd: v.plannedEnd || null,
    // Una tarea hecha queda al 100 %.
    progressPct: v.kanbanStatus === 'DONE' ? 100 : Number(v.progressPct),
  }
  if (props.task) await updateTask.mutateAsync({ taskId: props.task.id, payload })
  else await createTask.mutateAsync(payload)
  open.value = false
})
</script>

<template>
  <BaseModal v-model="open" :title="task ? 'Editar tarea' : 'Nueva tarea'" size="lg">
    <form :id="FORM_ID" class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
      <FormInput v-bind="binds.title" label="Tarea" placeholder="Ej. Instalación de cocina" required class="sm:col-span-2" />
      <FormSelect v-bind="binds.phase" label="Fase" :options="phaseOptions" required />
      <FormSelect v-bind="binds.kanbanStatus" label="Estado" :options="statusOptions" required />
      <FormInput v-bind="binds.plannedStart" type="date" label="Inicio planificado" />
      <FormInput v-bind="binds.plannedEnd" type="date" label="Fin planificado" />
      <FormInput v-bind="binds.progressPct" type="number" label="Avance (%)" />
      <FormTextarea v-bind="binds.description" label="Detalle" :rows="2" class="sm:col-span-2" />
    </form>
    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="outline" @click="open = false">Cancelar</BaseButton>
        <BaseButton variant="primary" type="submit" :form="FORM_ID" :loading="saving">Guardar</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
