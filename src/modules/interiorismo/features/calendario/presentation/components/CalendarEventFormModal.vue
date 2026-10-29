<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import FormCombobox from '@shared/presentation/components/forms/FormCombobox.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { toCalendarDateString } from '@shared/utils/formatters'
import type { CalendarFeedItemDto } from '../../domain/calendar.types'
import { useCreateCalendarEvent, useUpdateCalendarEvent } from '../composables/useInteriorCalendar'
import { CAL_EVENT_TYPE_LABELS } from '../labels'
/**
 * CalendarEventFormModal — crear / editar un evento manual de la agenda.
 * `event` = edición; sin él crea con `defaultDate` y `defaultProjectId`.
 */

type Option = { value: string; label: string }
const props = defineProps<{
  event?: CalendarFeedItemDto | null
  defaultDate?: string
  defaultProjectId?: string
  projectOptions: Option[]
  agentOptions: Option[]
}>()
const open = defineModel<boolean>('open', { required: true })

const MANUAL_TYPES = ['MEETING', 'VISIT', 'INSTALLATION', 'DEADLINE', 'TEAM_BLOCK'] as const
const typeOptions = MANUAL_TYPES.map((v) => ({ value: v, label: CAL_EVENT_TYPE_LABELS[v] ?? v }))
const FORM_ID = 'interior-cal-event-form'

const schema = yup.object({
  eventType: yup.string().required('Seleccione el tipo'),
  title: yup.string().trim().required('El título es obligatorio'),
  description: yup.string().trim(),
  location: yup.string().trim(),
  allDay: yup.boolean(),
  date: yup.string().required('Indique la fecha'),
  startTime: yup.string().when('allDay', { is: true, then: (s) => s.notRequired(), otherwise: (s) => s.required('Indique la hora') }),
  endDate: yup.string().trim(),
  endTime: yup.string().trim(),
  projectId: yup.string().trim(),
  assignedAgentId: yup.string().trim(),
})

const { defineComponentBinds, defineField, handleSubmit, resetForm, values, setFieldValue } = useForm({
  validationSchema: toTypedSchema(schema),
})
/** `reactive` desenvuelve los Ref de `defineComponentBinds` al usarlos como `binds.campo` en la plantilla. */
const binds = reactive({
  eventType: defineComponentBinds('eventType'),
  title: defineComponentBinds('title'),
  description: defineComponentBinds('description'),
  location: defineComponentBinds('location'),
  date: defineComponentBinds('date'),
  startTime: defineComponentBinds('startTime'),
  endDate: defineComponentBinds('endDate'),
  endTime: defineComponentBinds('endTime'),
  assignedAgentId: defineComponentBinds('assignedAgentId'),
})
const [projectId] = defineField('projectId')

const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false })
const limaDay = (iso: string) => toCalendarDateString(new Date(iso))

watch(open, (isOpen) => {
  if (!isOpen) return
  const e = props.event
  resetForm({
    values: e
      ? {
          eventType: e.eventType,
          title: e.title,
          description: e.description ?? '',
          location: e.location ?? '',
          allDay: e.allDay,
          date: limaDay(e.startsAt),
          startTime: e.allDay ? '' : timeFmt.format(new Date(e.startsAt)),
          endDate: e.endsAt && limaDay(e.endsAt) !== limaDay(e.startsAt) ? limaDay(e.endsAt) : '',
          endTime: e.endsAt && !e.allDay ? timeFmt.format(new Date(e.endsAt)) : '',
          projectId: e.projectId ?? '',
          assignedAgentId: e.assignedAgentId ?? '',
        }
      : {
          eventType: 'MEETING',
          title: '',
          description: '',
          location: '',
          allDay: false,
          date: props.defaultDate ?? toCalendarDateString(),
          startTime: '09:00',
          endDate: '',
          endTime: '10:00',
          projectId: props.defaultProjectId ?? '',
          assignedAgentId: '',
        },
  })
})

const createEv = useCreateCalendarEvent()
const updateEv = useUpdateCalendarEvent()
const saving = computed(() => createEv.isPending.value || updateEv.isPending.value)

/** Hora civil de Lima (UTC−5, sin horario de verano) → instante ISO. */
const limaInstant = (date: string, time: string) => new Date(`${date}T${time}:00-05:00`).toISOString()

const onSubmit = handleSubmit(async (v) => {
  const endDay = v.endDate?.trim() || v.date
  const startsAt = v.allDay ? `${v.date}T12:00:00.000Z` : limaInstant(v.date, v.startTime!)
  let endsAt: string | null = null
  if (v.allDay) endsAt = v.endDate?.trim() ? `${endDay}T12:00:00.000Z` : null
  else if (v.endTime?.trim()) endsAt = limaInstant(endDay, v.endTime.trim())
  const payload = {
    eventType: v.eventType,
    title: v.title,
    description: v.description || null,
    location: v.location || null,
    startsAt,
    endsAt,
    allDay: !!v.allDay,
    projectId: v.projectId?.trim() || null,
    assignedAgentId: v.assignedAgentId?.trim() || null,
  }
  if (props.event) await updateEv.mutateAsync({ eventId: props.event.id, payload })
  else await createEv.mutateAsync(payload)
  open.value = false
})
</script>

<template>
  <BaseModal v-model="open" :title="event ? 'Editar evento' : 'Nuevo evento'" size="lg">
    <form :id="FORM_ID" class="grid grid-cols-1 gap-4 sm:grid-cols-2" @submit.prevent="onSubmit">
      <FormSelect v-bind="binds.eventType" label="Tipo" :options="typeOptions" required />
      <FormInput v-bind="binds.title" label="Título" required />
      <div class="flex items-center sm:col-span-2">
        <FormCheckbox :model-value="!!values.allDay" label="Todo el día" @update:model-value="setFieldValue('allDay', $event)" />
      </div>
      <FormInput v-bind="binds.date" type="date" label="Fecha" required />
      <FormInput v-if="!values.allDay" v-bind="binds.startTime" type="time" label="Hora de inicio" required />
      <FormInput v-bind="binds.endDate" type="date" label="Fecha de fin (si dura varios días)" />
      <FormInput v-if="!values.allDay" v-bind="binds.endTime" type="time" label="Hora de fin" />
      <FormCombobox v-model="projectId" label="Proyecto" :options="projectOptions" placeholder="Sin proyecto" />
      <FormSelect v-bind="binds.assignedAgentId" label="Responsable" :options="agentOptions" />
      <FormInput v-bind="binds.location" label="Ubicación" placeholder="Obra, oficina, showroom…" class="sm:col-span-2" />
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
