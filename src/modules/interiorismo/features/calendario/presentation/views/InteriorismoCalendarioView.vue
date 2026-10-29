<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('interiorismo')

import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import HelpTooltip, { type HelpTooltipItem } from '@shared/presentation/components/ui/HelpTooltip.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import FormCombobox from '@shared/presentation/components/forms/FormCombobox.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import CalendarToolbar from '@shared/presentation/components/calendar/CalendarToolbar.vue'
import CalendarMonthView from '@shared/presentation/components/calendar/CalendarMonthView.vue'
import CalendarAgendaList from '@shared/presentation/components/calendar/CalendarAgendaList.vue'
import { CALENDAR_TONE_CLASSES } from '@shared/presentation/components/calendar/calendar-tones'
import type { CalendarEntry } from '@shared/presentation/components/calendar/calendar.types'
import { shiftAnchor, viewRange, weekDays, type CalendarViewMode } from '@shared/domain/calendar-grid'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { formatDate, toCalendarDateString } from '@shared/utils/formatters'
import { useInteriorProjectOptions } from '../../../proyectos/presentation/composables/useInteriorProjects'
import { useInteriorActiveTeam } from '../../../equipo/presentation/composables/useTeam'
import type { CalendarFeedItemDto } from '../../domain/calendar.types'
import { useInteriorCalendarFeed } from '../composables/useInteriorCalendar'
import { CALENDAR_ORIGINS, originOf, toCalendarEntry, type CalendarOrigin } from '../calendar-entries'
import CalendarEventFormModal from '../components/CalendarEventFormModal.vue'
import CalendarEventDetailModal from '../components/CalendarEventDetailModal.vue'
/**
 * Calendario de Interiorismo: agenda manual + hitos, tareas de obra y cobros programados.
 * Vistas mes / semana / lista; estado en la URL (`?view=&date=&projectId=`).
 */

const route = useRoute()
const router = useRouter()
const today = toCalendarDateString()

// ── Estado sincronizado con la URL ──
const qs = (k: string) => (typeof route.query[k] === 'string' ? (route.query[k] as string) : '')
const VIEWS: CalendarViewMode[] = ['month', 'week', 'list']
const view = ref<CalendarViewMode>(VIEWS.includes(qs('view') as CalendarViewMode) ? (qs('view') as CalendarViewMode) : 'month')
const anchor = ref(/^\d{4}-\d{2}-\d{2}$/.test(qs('date')) ? qs('date') : today)
const projectFilter = ref(qs('projectId'))
const agentFilter = ref('')
const hiddenOrigins = ref<CalendarOrigin[]>([])

watch([view, anchor, projectFilter], () => {
  void router.replace({
    query: {
      ...route.query,
      view: view.value === 'month' ? undefined : view.value,
      date: anchor.value === today ? undefined : anchor.value,
      projectId: projectFilter.value || undefined,
    },
  })
})

const range = computed(() => viewRange(view.value, anchor.value))
const feedParams = computed(() => ({
  ...range.value,
  ...(projectFilter.value ? { projectId: projectFilter.value } : {}),
  ...(agentFilter.value ? { agentId: agentFilter.value } : {}),
}))
const { data: feed, isLoading, isError, error, refetch } = useInteriorCalendarFeed(feedParams)

const visibleFeed = computed(() => (feed.value ?? []).filter((i) => !hiddenOrigins.value.includes(originOf(i))))
const entryIndex = computed(() => new Map(visibleFeed.value.map((i) => [`${i.source}:${i.id}`, i])))
const entries = computed(() =>
  visibleFeed.value.map(toCalendarEntry).sort((a, b) => a.start.localeCompare(b.start) || (a.time ?? '').localeCompare(b.time ?? '')),
)

const countByOrigin = computed(() => {
  const counts: Record<CalendarOrigin, number> = { MANUAL: 0, MILESTONE: 0, TASK: 0, FINANCE: 0 }
  for (const i of feed.value ?? []) counts[originOf(i)]++
  return counts
})
function toggleOrigin(o: CalendarOrigin) {
  hiddenOrigins.value = hiddenOrigins.value.includes(o) ? hiddenOrigins.value.filter((x) => x !== o) : [...hiddenOrigins.value, o]
}

const periodTitle = computed(() => {
  if (view.value === 'week') {
    const { from: first, to: last } = range.value
    return `${formatDate(first, { day: 'numeric', month: 'short', year: undefined })} – ${formatDate(last, { day: 'numeric', month: 'short' })}`
  }
  return formatDate(anchor.value, { month: 'long', year: 'numeric', day: undefined })
})

// ── Filtros: proyectos y equipo ──
const { options: projectItems } = useInteriorProjectOptions()
const projectFilterOptions = computed(() => [{ value: '', label: 'Todos los proyectos' }, ...projectItems.value])
const projectFormOptions = computed(() => [{ value: '', label: 'Sin proyecto' }, ...projectItems.value])

const { data: team } = useInteriorActiveTeam()
const agentItems = computed(() => (team.value ?? []).map((a) => ({ value: a.id, label: a.fullName })))

// ── Ayuda ──
const HELP: HelpTooltipItem[] = [
  { icon: 'lucide:calendar-plus', term: 'Agenda', text: 'Reuniones, visitas, instalaciones y fechas límite que se crean aquí con «Nuevo evento».' },
  { icon: 'lucide:flag', term: 'Hitos y fechas', text: 'Hitos del cronograma (Ejecución) y el inicio y la entrega estimada de cada proyecto. Los hitos cumplidos se ven en gris.' },
  { icon: 'lucide:list-checks', term: 'Tareas de obra', text: 'Tareas de Ejecución con fechas planificadas, de su inicio a su fin.' },
  { icon: 'lucide:wallet', term: 'Cobros', text: 'Cobros «Programado» registrados en Liquidación, en su fecha.' },
  { icon: 'lucide:users', term: 'Filtro por persona', text: 'Muestra sus eventos asignados y lo de los proyectos donde integra el equipo.' },
  { icon: 'lucide:info', term: 'Proyectos cancelados', text: 'No aparecen sus hitos, tareas ni cobros.' },
]
const agentFilterOptions = computed(() => [{ value: '', label: 'Todo el equipo' }, ...agentItems.value])
const agentFormOptions = computed(() => [{ value: '', label: 'Sin responsable' }, ...agentItems.value])

// ── Modales ──
const formOpen = ref(false)
const formEvent = ref<CalendarFeedItemDto | null>(null)
const formDate = ref<string>()
const detailOpen = ref(false)
const detailEvent = ref<CalendarFeedItemDto | null>(null)

function openCreate(date?: string) {
  formEvent.value = null
  formDate.value = date ?? (anchor.value === today || view.value === 'week' ? today : anchor.value)
  formOpen.value = true
}
function openEntry(entry: CalendarEntry) {
  detailEvent.value = entryIndex.value.get(entry.id) ?? null
  detailOpen.value = !!detailEvent.value
}
function onEdit(event: CalendarFeedItemDto) {
  detailOpen.value = false
  formEvent.value = event
  formOpen.value = true
}
/** Clic en un día: en la vista mensual pasa a la semana de ese día; con permiso abre el alta. */
function onSelectDay(date: string) {
  if (view.value === 'month') {
    anchor.value = date
    view.value = 'week'
  } else if (canWrite.value) {
    openCreate(date)
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Calendario" subtitle="Agenda del equipo, hitos, fechas de proyecto, tareas de obra y cobros programados">
      <template #actions>
        <BaseButton v-if="canWrite" variant="primary" icon="lucide:plus" @click="openCreate()">Nuevo evento</BaseButton>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatsCard v-for="o in CALENDAR_ORIGINS" :key="o.id" compact :title="o.label" :value="String(countByOrigin[o.id])" :subtitle="view === 'week' ? 'esta semana' : 'en el período'" :loading="isLoading">
        <template #icon><span class="size-2.5 rounded-full" :class="CALENDAR_TONE_CLASSES[o.tone].dot" /></template>
      </StatsCard>
    </div>

    <div class="space-y-4">
      <CalendarToolbar v-model:view="view" :title="periodTitle" @prev="anchor = shiftAnchor(view, anchor, -1)" @next="anchor = shiftAnchor(view, anchor, 1)" @today="anchor = today" />

      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div class="w-full min-w-0 lg:w-[280px]"><FormCombobox v-model="projectFilter" :options="projectFilterOptions" placeholder="Todos los proyectos" /></div>
        <div class="w-full min-w-0 lg:w-[220px]"><FormSelect v-model="agentFilter" :options="agentFilterOptions" /></div>
        <div class="flex flex-wrap items-center gap-1.5 lg:ml-auto">
          <HelpTooltip title="¿Qué muestra el calendario?" :items="HELP" width="w-96" align="end" class="me-1" />
          <button
            v-for="o in CALENDAR_ORIGINS"
            :key="o.id"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-theme-xs font-medium transition-colors"
            :class="hiddenOrigins.includes(o.id) ? 'border-gray-200 text-gray-400 line-through dark:border-gray-800 dark:text-gray-600' : 'border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300'"
            :aria-pressed="!hiddenOrigins.includes(o.id)"
            @click="toggleOrigin(o.id)"
          >
            <span class="size-2 rounded-full" :class="hiddenOrigins.includes(o.id) ? 'bg-gray-300 dark:bg-gray-700' : CALENDAR_TONE_CLASSES[o.tone].dot" />{{ o.label }}
          </button>
        </div>
      </div>

      <LoadingState v-if="isLoading" class="py-16" />
      <div v-else-if="isError" class="space-y-3 py-12 text-center text-sm">
        <p class="text-error-500">{{ getApiErrorMessage(error) }}</p>
        <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetch()">Reintentar</BaseButton>
      </div>
      <CalendarMonthView v-else-if="view === 'month'" :anchor="anchor" :today="today" :entries="entries" @select-entry="openEntry" @select-day="onSelectDay" />
      <CalendarAgendaList
        v-else
        :entries="entries"
        :range="range"
        :today="today"
        :days="view === 'week' ? weekDays(anchor) : undefined"
        empty-text="Sin eventos este mes."
        @select-entry="openEntry"
        @select-day="onSelectDay"
      />
      <p v-if="view !== 'list' && !isLoading" class="flex items-center gap-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
        <AppIcon icon="lucide:info" :size="14" />
        {{ view === 'month' ? 'Toca un día para ver su semana.' : canWrite ? 'Toca un día para agendar un evento.' : 'Toca un evento para ver su detalle.' }}
      </p>
    </div>

    <CalendarEventFormModal v-model:open="formOpen" :event="formEvent" :default-date="formDate" :default-project-id="projectFilter" :project-options="projectFormOptions" :agent-options="agentFormOptions" />
    <CalendarEventDetailModal v-model:open="detailOpen" :event="detailEvent" @edit="onEdit" />
  </div>
</template>
