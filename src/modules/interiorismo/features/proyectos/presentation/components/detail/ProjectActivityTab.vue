<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin } = useApplicationAccess('interiorismo')

import { reactive, ref, toRef } from 'vue'
import * as yup from 'yup'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import OptionCardGroup from '@shared/presentation/components/forms/OptionCardGroup.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import SectionIntro from '@shared/presentation/components/ui/SectionIntro.vue'
import type { HelpTooltipItem } from '@shared/presentation/components/ui/HelpTooltip.vue'
import { formatDateTime } from '@shared/utils/formatters'
import { toCalendarDateString } from '@shared/utils/formatters'
import type { InteriorManualActivityType, InteriorProjectActivityDto } from '../../../domain/project.types'
import { useCreateInteriorProjectActivity, useDeleteInteriorProjectActivity } from '../../composables/useInteriorProjects'
/**
 * Pestaña Actividad: línea de tiempo de notas, reuniones y cambios de etapa. Las notas, reuniones
 * y tareas se registran a mano; los cambios de etapa los anota el sistema y no se eliminan.
 */

const props = defineProps<{ projectId: string; activities: InteriorProjectActivityDto[] }>()

const TYPES: Record<string, { label: string; icon: string; tone: string }> = {
  NOTE: { label: 'Nota', icon: 'lucide:sticky-note', tone: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  STATUS_CHANGE: { label: 'Cambio de etapa', icon: 'lucide:git-commit-horizontal', tone: 'bg-brand-50 text-brand-500 dark:bg-brand-500/15' },
  MEETING: { label: 'Reunión', icon: 'lucide:users', tone: 'bg-theme-purple-500/10 text-theme-purple-500' },
  TASK: { label: 'Tarea', icon: 'lucide:list-checks', tone: 'bg-success-50 text-success-600 dark:bg-success-500/15' },
  OTHER: { label: 'Otro', icon: 'lucide:circle-dot', tone: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
}
const typeOf = (a: InteriorProjectActivityDto) => TYPES[a.activityType] ?? TYPES.OTHER!

// ── Registro ──
const FORM_ID = 'interior-activity-form'
const MANUAL_TYPES: InteriorManualActivityType[] = ['NOTE', 'MEETING', 'TASK', 'OTHER']
const typeCards = MANUAL_TYPES.map((t) => ({ value: t, label: TYPES[t]!.label, icon: TYPES[t]!.icon }))
const nowTime = () => new Date().toTimeString().slice(0, 5)

const formOpen = ref(false)
const { values, errors, defineComponentBinds, handleSubmit, resetForm, setFieldValue } = useForm({
  validationSchema: toTypedSchema(
    yup.object({
      activityType: yup.string().oneOf(MANUAL_TYPES).required(),
      title: yup.string().trim().required('Escriba un título').max(200, 'Máximo 200 caracteres'),
      description: yup.string().trim().max(4000, 'Máximo 4000 caracteres'),
      date: yup.string().required('Indique la fecha'),
      time: yup.string().required('Indique la hora'),
    }),
  ),
})
/** `reactive` desenvuelve los Ref de `defineComponentBinds` al usarlos como `binds.campo` en la plantilla. */
const binds = reactive({
  title: defineComponentBinds('title'),
  description: defineComponentBinds('description'),
  date: defineComponentBinds('date'),
  time: defineComponentBinds('time'),
})

function openForm(type: InteriorManualActivityType = 'NOTE') {
  resetForm({ values: { activityType: type, title: '', description: '', date: toCalendarDateString(), time: nowTime() } })
  formOpen.value = true
}

const pid = toRef(props, 'projectId')
const create = useCreateInteriorProjectActivity(pid)
const remove = useDeleteInteriorProjectActivity(pid)

const onSubmit = handleSubmit(async (v) => {
  await create.mutateAsync({
    activityType: v.activityType as InteriorManualActivityType,
    title: v.title,
    description: v.description || null,
    // Fecha y hora locales del usuario → ISO
    occurredAt: new Date(`${v.date}T${v.time}`).toISOString(),
  })
  formOpen.value = false
})

async function onDelete(a: InteriorProjectActivityDto) {
  const ok = await markapAlert.confirmDanger({ title: 'Eliminar actividad', text: a.title, confirmText: 'Eliminar' })
  if (ok) await remove.mutateAsync(a.id)
}

const HELP: HelpTooltipItem[] = Object.values(TYPES)
  .filter((t) => t.label !== 'Otro')
  .map((t) => ({
    icon: t.icon,
    term: t.label,
    text:
      t.label === 'Nota'
        ? 'Comentarios y acuerdos sobre el proyecto.'
        : t.label === 'Reunión'
          ? 'Reuniones con el cliente o el equipo y lo que se decidió.'
          : t.label === 'Tarea'
            ? 'Pendientes puntuales registrados en el historial.'
            : 'Se anota solo al cambiar la etapa del proyecto; no se puede eliminar.',
  }))
</script>

<template>
  <div class="space-y-5">
    <SectionIntro
      title="Actividad del proyecto"
      subtitle="Historial de notas, reuniones y cambios de etapa, del más reciente al más antiguo."
      help-title="¿Qué aparece en la actividad?"
      :help="HELP"
    >
      <template v-if="canWrite" #actions>
        <BaseButton variant="outline" size="sm" icon="lucide:users" @click="openForm('MEETING')">Reunión</BaseButton>
        <BaseButton variant="primary" size="sm" icon="lucide:plus" @click="openForm()">Registrar actividad</BaseButton>
      </template>
    </SectionIntro>
    <ol v-if="activities.length" class="relative space-y-5 border-s border-gray-200 ps-7 dark:border-gray-800">
      <li v-for="a in activities" :key="a.id" class="group/act relative">
        <span
          :class="['absolute -start-[42px] top-0 flex size-7 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900', typeOf(a).tone]"
        >
          <AppIcon :icon="typeOf(a).icon" :size="14" />
        </span>
        <div class="flex flex-wrap items-center gap-x-2 text-theme-xs text-gray-400 dark:text-gray-500">
          <span class="font-medium text-gray-500 dark:text-gray-400">{{ typeOf(a).label }}</span>
          <span>·</span>
          <span>{{ formatDateTime(a.occurredAt) }}</span>
          <IconButton
            v-if="canAdmin && a.activityType !== 'STATUS_CHANGE'"
            icon="lucide:trash-2"
            label="Eliminar actividad"
            size="xs"
            danger
            class="ms-auto opacity-0 transition-opacity group-hover/act:opacity-100 focus:opacity-100"
            @click="onDelete(a)"
          />
        </div>
        <p class="mt-0.5 text-sm font-medium text-gray-800 dark:text-white/90">{{ a.title }}</p>
        <p v-if="a.description" class="mt-0.5 text-sm whitespace-pre-wrap text-gray-500 dark:text-gray-400">{{ a.description }}</p>
      </li>
    </ol>
    <div
      v-else
      class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 px-4 py-12 text-center dark:border-gray-800"
    >
      <AppIcon icon="lucide:history" :size="28" class="text-gray-300 dark:text-gray-600" />
      <p class="text-sm text-gray-400 dark:text-gray-500">Sin actividad registrada.</p>
      <p class="max-w-sm text-theme-xs text-gray-400 dark:text-gray-500">
        Registre notas y reuniones; los cambios de etapa del proyecto aparecerán aquí solos.
      </p>
      <BaseButton v-if="canWrite" variant="outline" size="sm" icon="lucide:plus" class="mt-2" @click="openForm()">Registrar actividad</BaseButton>
    </div>

    <BaseModal v-model="formOpen" title="Registrar actividad" size="md">
      <form :id="FORM_ID" class="space-y-4" @submit.prevent="onSubmit">
        <OptionCardGroup
          :model-value="values.activityType"
          :options="typeCards"
          :columns="2"
          label="Tipo"
          @update:model-value="setFieldValue('activityType', $event as InteriorManualActivityType)"
        />
        <FormInput
          v-bind="binds.title"
          label="Título"
          :placeholder="values.activityType === 'MEETING' ? 'Ej. Revisión de propuesta con el cliente' : 'Ej. Cliente pidió cambiar el color del sofá'"
          :error="errors.title"
          required
        />
        <div class="grid grid-cols-2 gap-4">
          <FormInput v-bind="binds.date" type="date" label="Fecha" :error="errors.date" required />
          <FormInput v-bind="binds.time" type="time" label="Hora" :error="errors.time" required />
        </div>
        <FormTextarea
          v-bind="binds.description"
          label="Detalle"
          :placeholder="values.activityType === 'MEETING' ? 'Asistentes, acuerdos y próximos pasos…' : 'Opcional'"
          :rows="4"
          :error="errors.description"
        />
      </form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" @click="formOpen = false">Cancelar</BaseButton>
          <BaseButton variant="primary" type="submit" :form="FORM_ID" icon="lucide:save" :loading="create.isPending.value">Guardar</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
