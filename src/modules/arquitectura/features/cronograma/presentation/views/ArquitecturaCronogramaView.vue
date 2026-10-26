<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite, filterActions } = useApplicationAccess('arquitectura')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import { useService } from '@shared/presentation/di/services'
import { DIRECTORY } from '@shared/application/ports/directory.port'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import * as yup from 'yup'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import {
  formatDate,
  formatDateTime,
  formatShortDate,
  toCalendarDateString,
} from '@shared/utils/formatters'
import { ARQUITECTURA_APP_SLUG } from '../../../../config/app.constants'
import { useArquitecturaProjectsList } from '../../../proyectos/presentation/composables/useArquitecturaProjects'
import type { ListArquitecturaProjectsParams } from '../../../proyectos/domain/project.types'
import type { CalendarFeedItemDto } from '../../domain/calendar.types'
import {
  useArquitecturaCalendarFeed,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
} from '../composables/useArquitecturaCalendar'
import { CAL_EVENT_TYPE_LABELS, CAL_SOURCE_LABELS } from '../labels'
const directory = useService(DIRECTORY)

const route = useRoute()
const router = useRouter()

function monthBounds(y: number, m: number): { from: string; to: string } {
  const from = new Date(y, m - 1, 1)
  const to = new Date(y, m, 0)
  return {
    from: toCalendarDateString(from),
    to: toCalendarDateString(to),
  }
}

const now = new Date()
const rangeMonth = ref(now.getMonth() + 1)
const rangeYear = ref(now.getFullYear())

const range = computed(() => monthBounds(rangeYear.value, rangeMonth.value))

const projectFilter = ref('')
const agentFilter = ref('')
const lens = ref('all')

const lensTabs = [
  { id: 'all', label: 'Todo', icon: 'lucide:calendar-days' },
  { id: 'meetings', label: 'Reuniones', icon: 'lucide:users' },
  { id: 'visits', label: 'Visitas', icon: 'lucide:map-pin' },
  { id: 'installations', label: 'Visita de obra', icon: 'lucide:hard-hat' },
  { id: 'deadlines', label: 'Fechas límite', icon: 'lucide:alarm-clock' },
  { id: 'team', label: 'Agenda equipo', icon: 'lucide:briefcase' },
]

const feedParams = computed(() => ({
  from: range.value.from,
  to: range.value.to,
  ...(projectFilter.value.trim() ? { projectId: projectFilter.value.trim() } : {}),
  ...(agentFilter.value.trim() ? { agentId: agentFilter.value.trim() } : {}),
}))

const {
  data: feed,
  isLoading,
  isError,
  error: feedError,
  refetch: refetchFeed,
} = useArquitecturaCalendarFeed(feedParams)
const createEv = useCreateCalendarEvent()
const updateEv = useUpdateCalendarEvent()
const deleteEv = useDeleteCalendarEvent()

const listParams = ref<ListArquitecturaProjectsParams>({ page: 1, limit: 400 })
const {
  data: projectsRes,
  isError: projectsQueryError,
  error: projectsListError,
  refetch: refetchProjects,
} = useArquitecturaProjectsList(listParams)

const projectOptions = computed(() => [
  { value: '', label: 'Todos los proyectos' },
  ...(projectsRes.value?.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.code} · ${p.name}`,
  })),
])

const {
  data: agentsRes,
  isError: agentsQueryError,
  error: agentsListError,
  refetch: refetchAgents,
} = useQuery({
  queryKey: ['agents', ARQUITECTURA_APP_SLUG, 'calendar'],
  queryFn: async () => {
    const data = await directory.listAgents({
      applicationSlug: ARQUITECTURA_APP_SLUG,
      limit: 500,
      page: 1,
    })
    return data
  },
})

const agentOptions = computed(() => [
  { value: '', label: 'Todo el equipo' },
  ...(agentsRes.value?.data ?? []).map((a) => ({
    value: a.id,
    label: a.fullName,
  })),
])

function matchesLens(item: CalendarFeedItemDto, L: string): boolean {
  switch (L) {
    case 'all':
      return true
    case 'meetings':
      return item.eventType === 'MEETING'
    case 'visits':
      return item.eventType === 'VISIT'
    case 'installations':
      return item.eventType === 'INSTALLATION' || item.eventType === 'TASK_INSTALLATION'
    case 'deadlines':
      return ['DEADLINE', 'MILESTONE', 'FINANCE_DUE'].includes(item.eventType)
    case 'team':
      return item.eventType === 'TEAM_BLOCK' || !!item.assignedAgentId
    default:
      return true
  }
}

const filteredFeed = computed(() => {
  const rows = feed.value ?? []
  let list = rows.filter((r) => matchesLens(r, lens.value))
  if (agentFilter.value.trim()) {
    list = list.filter((r) => r.assignedAgentId === agentFilter.value.trim())
  }
  return [...list].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
})

/** Mini heatmap: cuántos eventos por día (filtrados) */
const countsByDay = computed(() => {
  const m: Record<string, number> = {}
  for (const r of filteredFeed.value) {
    const d = toCalendarDateString(r.startsAt)
    m[d] = (m[d] ?? 0) + 1
  }
  return m
})

const monthDays = computed(() => {
  const y = rangeYear.value
  const m = rangeMonth.value
  const first = new Date(Date.UTC(y, m - 1, 1))
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const pad = (first.getUTCDay() + 6) % 7
  const cells: { key: string; label: string | null; iso: string | null }[] = []
  for (let i = 0; i < pad; i++) cells.push({ key: `p-${i}`, label: null, iso: null })
  for (let d = 1; d <= lastDay; d++) {
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ key: iso, label: String(d), iso })
  }
  return cells
})

onMounted(() => {
  const q = route.query.projectId
  if (typeof q === 'string' && q.trim()) projectFilter.value = q.trim()
})

watch(projectFilter, (v) => {
  const cur = typeof route.query.projectId === 'string' ? route.query.projectId : ''
  const next = v.trim()
  if (cur === next) return
  router.replace({ path: route.path, query: { ...route.query, projectId: next || undefined } })
})

/** Id del formulario del modal de evento (botones en `#footer` usan `form` para submit nativo). */
const CAL_EVENT_FORM_ID = 'arq-cal-event-form'

const cols = [
  { key: 'when', label: 'Cuándo', align: 'left' as const },
  { key: 'kind', label: 'Tipo', align: 'left' as const },
  { key: 'title', label: 'Título', align: 'left' as const },
  { key: 'project', label: 'Proyecto', align: 'left' as const },
  { key: 'assignee', label: 'Responsable', align: 'left' as const },
  { key: 'source', label: 'Origen', align: 'left' as const },
  { key: '_a', label: '', align: 'right' as const },
]

const modalOpen = ref(false)
const editId = ref<string | null>(null)

const MANUAL_TYPES = ['MEETING', 'VISIT', 'INSTALLATION', 'DEADLINE', 'TEAM_BLOCK'] as const

const eventSchema = yup.object({
  eventType: yup.string().required('Seleccione el tipo'),
  title: yup.string().required('El título es obligatorio').trim(),
  description: yup.string().trim(),
  location: yup.string().trim(),
  startsAt: yup.string().required('Indique inicio'),
  endsAt: yup.string().trim(),
  allDay: yup.boolean(),
  projectId: yup.string().trim(),
  assignedAgentId: yup.string().trim(),
})

const evForm = useForm({
  validationSchema: toTypedSchema(eventSchema),
  initialValues: {
    eventType: 'MEETING',
    title: '',
    description: '',
    location: '',
    startsAt: '',
    endsAt: '',
    allDay: false,
    projectId: '',
    assignedAgentId: '',
  },
})

const { values: evValues, setFieldValue } = evForm

const evBinds = {
  eventType: evForm.defineComponentBinds('eventType'),
  title: evForm.defineComponentBinds('title'),
  description: evForm.defineComponentBinds('description'),
  location: evForm.defineComponentBinds('location'),
  startsAt: evForm.defineComponentBinds('startsAt'),
  endsAt: evForm.defineComponentBinds('endsAt'),
  allDay: evForm.defineComponentBinds('allDay'),
  projectId: evForm.defineComponentBinds('projectId'),
  assignedAgentId: evForm.defineComponentBinds('assignedAgentId'),
}

const typeOptions = MANUAL_TYPES.map((v) => ({
  value: v,
  label: CAL_EVENT_TYPE_LABELS[v] ?? v,
}))

function openCreate() {
  editId.value = null
  const d = new Date()
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  evForm.resetForm({
    values: {
      eventType: 'MEETING',
      title: '',
      description: '',
      location: '',
      startsAt: local,
      endsAt: '',
      allDay: false,
      projectId: projectFilter.value.trim(),
      assignedAgentId: '',
    },
  })
  modalOpen.value = true
}

function openEdit(row: CalendarFeedItemDto) {
  if (row.readOnly) return
  editId.value = row.id
  let startsLocal: string
  let endsLocal = ''
  if (row.allDay) {
    startsLocal = toCalendarDateString(row.startsAt)
    endsLocal = row.endsAt ? toCalendarDateString(row.endsAt) : ''
  } else {
    const sd = new Date(row.startsAt)
    startsLocal = new Date(sd.getTime() - sd.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    if (row.endsAt) {
      const ed = new Date(row.endsAt)
      endsLocal = new Date(ed.getTime() - ed.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    }
  }
  evForm.resetForm({
    values: {
      eventType: row.eventType,
      title: row.title,
      description: row.description ?? '',
      location: row.location ?? '',
      startsAt: startsLocal,
      endsAt: endsLocal,
      allDay: row.allDay,
      projectId: row.projectId ?? '',
      assignedAgentId: row.assignedAgentId ?? '',
    },
  })
  modalOpen.value = true
}

const onSubmitEvent = evForm.handleSubmit(async (values) => {
  const pid = values.projectId?.trim() ? values.projectId.trim() : null
  const aid = values.assignedAgentId?.trim() ? values.assignedAgentId.trim() : null
  let startsIso: string
  let endsIso: string | null = null
  if (values.allDay) {
    const d = toCalendarDateString(values.startsAt.trim())
    // Noon UTC: date-only transport convention (matches backend parseDateOnly)
    startsIso = `${d}T12:00:00.000Z`
    const er = values.endsAt?.trim()
    endsIso = er ? `${toCalendarDateString(er)}T12:00:00.000Z` : null
  } else {
    startsIso = new Date(values.startsAt).toISOString()
    const endsRaw = values.endsAt?.trim()
    endsIso = endsRaw ? new Date(endsRaw).toISOString() : null
  }

  if (editId.value) {
    await updateEv.mutateAsync({
      eventId: editId.value,
      payload: {
        eventType: values.eventType,
        title: values.title,
        description: values.description || null,
        location: values.location || null,
        startsAt: startsIso,
        endsAt: endsIso,
        allDay: values.allDay,
        projectId: pid,
        assignedAgentId: aid,
      },
    })
  } else {
    await createEv.mutateAsync({
      eventType: values.eventType,
      title: values.title,
      description: values.description || null,
      location: values.location || null,
      startsAt: startsIso,
      endsAt: endsIso,
      allDay: values.allDay,
      projectId: pid,
      assignedAgentId: aid,
    })
  }
  modalOpen.value = false
})

async function removeEvent(row: CalendarFeedItemDto) {
  if (row.readOnly) return
  const ok = await markapAlert.confirmDanger({
    title: '¿Eliminar evento?',
    confirmText: 'Eliminar',
  })
  if (!ok) return
  await deleteEv.mutateAsync(row.id)
}

function getEventActions(
  row: CalendarFeedItemDto,
): { label: string; icon: string; onClick: () => void }[] {
  if (row.readOnly) return []
  return [
    { label: 'Editar', icon: 'lucide:pencil', onClick: () => openEdit(row) },
    { label: 'Eliminar', icon: 'lucide:trash-2', onClick: () => void removeEvent(row) },
  ]
}

function fmtWhen(row: CalendarFeedItemDto): string {
  if (row.allDay) return formatShortDate(row.startsAt)
  const s = formatDateTime(row.startsAt)
  if (!row.endsAt) return s
  return `${s} → ${formatDateTime(row.endsAt)}`
}

function prevMonth() {
  if (rangeMonth.value <= 1) {
    rangeMonth.value = 12
    rangeYear.value -= 1
  } else {
    rangeMonth.value -= 1
  }
}

function nextMonth() {
  if (rangeMonth.value >= 12) {
    rangeMonth.value = 1
    rangeYear.value += 1
  } else {
    rangeMonth.value += 1
  }
}

const monthTitle = computed(() =>
  formatDate(new Date(rangeYear.value, rangeMonth.value - 1, 1), {
    month: 'long',
    year: 'numeric',
  }),
)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Cronograma"
    >
      <template #actions>
        <p class="text-sm mt-1 text-gray-500 dark:text-gray-400">
        Reuniones, visitas, visitas de obra, fechas límite y agenda del equipo; integrado con hitos, tareas de ejecución y cobros programados.
      </p>
      </template>
    </PageHeader>

    <BaseCard padding="sm" class="block overflow-hidden space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <BaseButton variant="outline" size="sm" type="button" @click="prevMonth">
            <AppIcon icon="lucide:chevron-left" :size="18" />
          </BaseButton>
          <span class="text-sm font-semibold capitalize min-w-[160px] text-center text-gray-800 dark:text-white/90">
            {{ monthTitle }}
          </span>
          <BaseButton variant="outline" size="sm" type="button" @click="nextMonth">
            <AppIcon icon="lucide:chevron-right" :size="18" />
          </BaseButton>
        </div>
        <BaseButton v-if="canWrite" variant="primary" size="sm" type="button" @click="openCreate">
          <AppIcon icon="lucide:plus" :size="18" class="mr-1" />
          Nuevo evento
        </BaseButton>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <FormSelect v-model="projectFilter" label="Proyecto" :options="projectOptions" />
        <FormSelect v-model="agentFilter" label="Responsable (filtro)" :options="agentOptions" />
      </div>

      <div
        v-if="projectsQueryError || agentsQueryError"
        class="rounded-lg border px-3 py-2 text-sm space-y-2 border-gray-200 dark:border-gray-800 bg-warning-50 dark:bg-warning-500/15"
      >
        <p v-if="projectsQueryError" class="flex flex-wrap items-center gap-2 text-gray-800 dark:text-white/90">
          <span class="text-xs font-medium text-error-600 dark:text-error-500">Proyectos</span>
          <span class="text-xs">{{ getApiErrorMessage(projectsListError) }}</span>
          <BaseButton variant="outline" size="sm" class="ml-auto" @click="() => refetchProjects()">Reintentar</BaseButton>
        </p>
        <p v-if="agentsQueryError" class="flex flex-wrap items-center gap-2 text-gray-800 dark:text-white/90">
          <span class="text-xs font-medium text-error-600 dark:text-error-500">Agentes</span>
          <span class="text-xs">{{ getApiErrorMessage(agentsListError) }}</span>
          <BaseButton variant="outline" size="sm" class="ml-auto" @click="() => refetchAgents()">Reintentar</BaseButton>
        </p>
      </div>

      <BaseTabs v-model="lens" :tabs="lensTabs" />

      <div
        class="rounded-lg border p-3 overflow-x-auto border-gray-200 dark:border-gray-800"
      >
        <p class="text-xs mb-2 text-gray-400 dark:text-gray-500">
          Vista rápida del mes · número = cantidad de ítems en esta vista
        </p>
        <div class="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
          <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
        </div>
        <div class="grid grid-cols-7 gap-1">
          <div :class="[(c.iso && countsByDay[c.iso] ? 'bg-brand-50 dark:bg-brand-500/12' : 'bg-transparent')]"
            v-for="c in monthDays"
            :key="c.key"
            class="aspect-square rounded-md flex flex-col items-center justify-center text-xs border border-transparent text-gray-800 dark:text-white/90" :style="{ opacity: c.label ? 1 : 0 }"
          >
            <template v-if="c.label">
              <span>{{ c.label }}</span>
              <span v-if="countsByDay[c.iso!]" class="font-semibold text-[10px] text-brand-500 dark:text-brand-400">
                {{ countsByDay[c.iso!] }}
              </span>
            </template>
          </div>
        </div>
      </div>

      <LoadingState v-if="isLoading" />
      <div v-else-if="isError" class="text-center py-12 space-y-3 text-sm text-gray-500 dark:text-gray-400">
        <p class="text-error-500 dark:text-error-400">{{ getApiErrorMessage(feedError) }}</p>
        <BaseButton variant="outline" size="sm" @click="() => refetchFeed()">Reintentar</BaseButton>
      </div>
      <DataTable
        v-else
        empty-text="Sin eventos en el período."
        :columns="cols"
        :data="
          filteredFeed.map((r) => ({
            ...r,
            when: fmtWhen(r),
            kind: CAL_EVENT_TYPE_LABELS[r.eventType] ?? r.eventType,
            project: r.projectCode ? `${r.projectCode}` : '—',
            assignee: r.assignedAgentName ?? '—',
            source: CAL_SOURCE_LABELS[r.source] ?? r.source,
            _a: '',
          }))
        "
        row-key="id"
      >
        <template #row="{ row }">
          <td class="py-2 px-3 text-sm whitespace-nowrap">{{ (row as any).when }}</td>
          <td class="py-2 px-3 text-sm">{{ (row as any).kind }}</td>
          <td class="py-2 px-3 text-sm max-w-[240px]">
            <span class="line-clamp-2">{{ (row as any).title }}</span>
            <span v-if="(row as CalendarFeedItemDto).location" class="block text-xs text-muted truncate">{{
              (row as CalendarFeedItemDto).location
            }}</span>
          </td>
          <td class="py-2 px-3 text-sm">{{ (row as any).project }}</td>
          <td class="py-2 px-3 text-sm">{{ (row as any).assignee }}</td>
          <td class="py-2 px-3">
            <Badge variant="neutral">{{ (row as any).source }}</Badge>
          </td>
          <td class="py-2 px-3 text-right whitespace-nowrap">
            <ActionsDropdown
              v-if="!(row as CalendarFeedItemDto).readOnly"
              :items="filterActions(getEventActions(row as CalendarFeedItemDto))"
            />
            <span v-else class="text-xs text-gray-400 dark:text-gray-500">—</span>
          </td>
        </template>
      </DataTable>
    </BaseCard>

    <BaseModal v-model="modalOpen" :title="editId ? 'Editar evento' : 'Nuevo evento'" size="lg">
      <form :id="CAL_EVENT_FORM_ID" class="space-y-3" @submit.prevent="onSubmitEvent">
        <FormSelect v-bind="evBinds.eventType" label="Tipo" :options="typeOptions" />
        <FormInput v-bind="evBinds.title" label="Título" />
        <FormTextarea v-bind="evBinds.description" label="Detalle" :rows="2" />
        <FormInput v-bind="evBinds.location" label="Ubicación (visitas / obra)" />
        <div class="flex flex-wrap gap-4 items-center">
          <FormCheckbox :model-value="!!evValues.allDay" label="Todo el día" @update:model-value="setFieldValue('allDay', $event)" />
        </div>
        <FormInput v-bind="evBinds.startsAt" :type="evValues.allDay ? 'date' : 'datetime-local'" label="Inicio" />
        <FormInput v-bind="evBinds.endsAt" :type="evValues.allDay ? 'date' : 'datetime-local'" label="Fin (opcional)" />
        <FormSelect v-bind="evBinds.projectId" label="Proyecto (opcional)" :options="projectOptions" />
        <FormSelect v-bind="evBinds.assignedAgentId" label="Responsable (opcional)" :options="agentOptions" />
      </form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" type="button" @click="modalOpen = false">Cancelar</BaseButton>
          <BaseButton v-if="canWrite"
            variant="primary"
            type="submit"
            :form="CAL_EVENT_FORM_ID"
            :loading="createEv.isPending.value || updateEv.isPending.value"
          >
            Guardar
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
