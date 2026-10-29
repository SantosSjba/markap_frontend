<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, canAdmin } = useApplicationAccess('interiorismo')

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { CALENDAR_TONE_CLASSES } from '@shared/presentation/components/calendar/calendar-tones'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { formatDate, formatDateTime } from '@shared/utils/formatters'
import { INTERIORISMO_BASE_PATH } from '../../../../config/routes.constants'
import type { CalendarFeedItemDto } from '../../domain/calendar.types'
import { useDeleteCalendarEvent } from '../composables/useInteriorCalendar'
import { CALENDAR_ORIGINS, originOf, projectTabOf, toCalendarEntry } from '../calendar-entries'
import { CAL_EVENT_TYPE_LABELS } from '../labels'
/**
 * CalendarEventDetailModal — detalle de un evento del feed. Los manuales se editan o eliminan;
 * los derivados (hitos, tareas, cobros) enlazan a la pestaña correspondiente de la ficha.
 */

const props = defineProps<{ event: CalendarFeedItemDto | null }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ edit: [event: CalendarFeedItemDto] }>()
const router = useRouter()
const deleteEv = useDeleteCalendarEvent()

const origin = computed(() => (props.event ? CALENDAR_ORIGINS.find((o) => o.id === originOf(props.event!)) : null))
const tone = computed(() => (props.event ? CALENDAR_TONE_CLASSES[toCalendarEntry(props.event).tone] : null))
const when = computed(() => {
  const e = props.event
  if (!e) return ''
  if (e.allDay) {
    const start = formatDate(e.startsAt, { weekday: 'long' })
    return e.endsAt ? `${start} → ${formatDate(e.endsAt, { weekday: 'long' })}` : `${start} · todo el día`
  }
  return e.endsAt ? `${formatDateTime(e.startsAt)} → ${formatDateTime(e.endsAt)}` : formatDateTime(e.startsAt)
})

function goProject() {
  const e = props.event
  if (!e?.projectId) return
  open.value = false
  void router.push({ path: `${INTERIORISMO_BASE_PATH}/proyectos/${e.projectId}`, query: { tab: projectTabOf(e) } })
}

async function remove() {
  const e = props.event
  if (!e) return
  const ok = await markapAlert.confirmDanger({ title: '¿Eliminar evento?', text: e.title, confirmText: 'Eliminar' })
  if (!ok) return
  await deleteEv.mutateAsync(e.id)
  open.value = false
}
</script>

<template>
  <BaseModal v-model="open" :title="event?.title ?? 'Evento'" size="md">
    <div v-if="event" class="space-y-4 text-sm">
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-theme-xs font-medium" :class="tone?.pill">
          <span class="size-1.5 rounded-full" :class="tone?.dot" />{{ CAL_EVENT_TYPE_LABELS[event.eventType] ?? event.eventType }}
        </span>
        <span class="text-theme-xs text-gray-400 dark:text-gray-500">{{ origin?.label }}</span>
      </div>
      <dl class="space-y-2.5">
        <div class="flex gap-3"><dt class="w-6 shrink-0 text-gray-400"><AppIcon icon="lucide:clock" :size="16" /></dt><dd class="text-gray-800 first-letter:uppercase dark:text-white/90">{{ when }}</dd></div>
        <div v-if="event.projectCode" class="flex gap-3">
          <dt class="w-6 shrink-0 text-gray-400"><AppIcon icon="lucide:folder-kanban" :size="16" /></dt>
          <dd class="min-w-0"><span class="block font-medium text-gray-800 dark:text-white/90">{{ event.projectName }}</span><span class="block text-theme-xs text-gray-500 dark:text-gray-400">{{ event.projectCode }}</span></dd>
        </div>
        <div v-if="event.assignedAgentName" class="flex gap-3"><dt class="w-6 shrink-0 text-gray-400"><AppIcon icon="lucide:user" :size="16" /></dt><dd class="text-gray-800 dark:text-white/90">{{ event.assignedAgentName }}</dd></div>
        <div v-if="event.location" class="flex gap-3"><dt class="w-6 shrink-0 text-gray-400"><AppIcon icon="lucide:map-pin" :size="16" /></dt><dd class="text-gray-800 dark:text-white/90">{{ event.location }}</dd></div>
        <div v-if="event.description" class="flex gap-3"><dt class="w-6 shrink-0 text-gray-400"><AppIcon icon="lucide:align-left" :size="16" /></dt><dd class="whitespace-pre-line text-gray-600 dark:text-gray-300">{{ event.description }}</dd></div>
      </dl>
      <p v-if="event.readOnly" class="rounded-lg bg-gray-50 px-3 py-2 text-theme-xs text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
        Se genera desde el proyecto; para cambiarlo, edítalo en su ficha.
      </p>
    </div>
    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <BaseButton v-if="event && !event.readOnly && canAdmin" variant="outline" icon="lucide:trash-2" :loading="deleteEv.isPending.value" @click="remove">Eliminar</BaseButton>
        <BaseButton v-if="event?.projectId" variant="outline" icon="lucide:folder-open" @click="goProject">Abrir proyecto</BaseButton>
        <BaseButton v-if="event && !event.readOnly && canWrite" variant="primary" icon="lucide:pencil" @click="emit('edit', event)">Editar</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>
