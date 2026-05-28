<script setup lang="ts">
import { computed, ref } from 'vue'
import { useForm, toTypedSchema } from '@shared/components/forms'
import { BaseButton, Badge, AppIcon, FormInput, FormSelect, FormTextarea, FormSectionCard } from '@shared/components'
import {
  useVentasProcessDetail,
  useVentasAddProcessNote,
  useVentasAddActivity,
  useVentasAddReminder,
  useVentasCompleteReminder,
} from '../../application/useVentasSales'
import type { SaleProcessDetail } from '../../domain/sales.types'
import { ACTIVITY_TYPE_OPTIONS } from '../../domain/activityTypes.constants'
import {
  saleProcessNoteFormSchema,
  saleProcessActivityFormSchema,
  saleProcessReminderFormSchema,
} from '../../infrastructure/schemas/saleProcessFollowUpSchemas'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'

const props = withDefaults(
  defineProps<{
    processId: string
    /** Vista detalle: tres columnas. Pipeline/modal: pestañas. */
    layout?: 'grid' | 'tabs'
    /** Listados más bajos (modal). */
    compact?: boolean
  }>(),
  {
    layout: 'grid',
    compact: false,
  },
)

const pid = computed(() => props.processId)
const {
  data: procRaw,
  isLoading,
  isError: detailQueryError,
  error: detailFetchError,
  refetch: refetchProcDetail,
} = useVentasProcessDetail(pid)

const proc = computed(() => procRaw.value as SaleProcessDetail | undefined)

const tab = ref<'notes' | 'activities' | 'reminders'>('notes')

const listMaxClass = computed(() => (props.compact ? 'max-h-32' : 'max-h-44'))

const tabItems = [
  { id: 'notes' as const, label: 'Notas', icon: 'lucide:sticky-note' },
  { id: 'activities' as const, label: 'Actividades', icon: 'lucide:calendar-clock' },
  { id: 'reminders' as const, label: 'Recordatorios', icon: 'lucide:bell' },
]

const { mutateAsync: addNoteAsync, isPending: addingNote } = useVentasAddProcessNote()
const { mutateAsync: addActAsync, isPending: addingAct } = useVentasAddActivity()
const { mutateAsync: addRemAsync, isPending: addingRem } = useVentasAddReminder()
const { mutate: completeRem } = useVentasCompleteReminder()
const completingReminderId = ref<string | null>(null)

const {
  handleSubmit: submitNoteForm,
  errors: noteErrors,
  defineComponentBinds: defineNoteField,
  resetForm: resetNoteForm,
} = useForm({
  validationSchema: toTypedSchema(saleProcessNoteFormSchema),
  initialValues: { text: '' },
})
const noteBinds = defineNoteField('text')
const onNoteSubmit = submitNoteForm(async (values) => {
  await addNoteAsync({ processId: props.processId, text: values.text })
  resetNoteForm()
})

const {
  handleSubmit: submitActivityForm,
  errors: activityErrors,
  defineComponentBinds: defineActivityField,
  resetForm: resetActivityForm,
} = useForm({
  validationSchema: toTypedSchema(saleProcessActivityFormSchema),
  initialValues: {
    activityType: 'CALL',
    title: '',
    description: '',
  },
})
const actTypeBinds = defineActivityField('activityType')
const actTitleBinds = defineActivityField('title')
const actDescBinds = defineActivityField('description')
const onActivitySubmit = submitActivityForm(async (values) => {
  await addActAsync({
    processId: props.processId,
    body: {
      activityType: values.activityType,
      title: values.title,
      description: values.description || null,
    },
  })
  resetActivityForm({
    values: { activityType: 'CALL', title: '', description: '' },
  })
})

const {
  handleSubmit: submitReminderForm,
  errors: reminderErrors,
  defineComponentBinds: defineReminderField,
  resetForm: resetReminderForm,
} = useForm({
  validationSchema: toTypedSchema(saleProcessReminderFormSchema),
  initialValues: { title: '', dueAt: '' },
})
const remTitleBinds = defineReminderField('title')
const remDueBinds = defineReminderField('dueAt')
const onReminderSubmit = submitReminderForm(async (values) => {
  await addRemAsync({
    processId: props.processId,
    body: {
      title: values.title,
      dueAt: new Date(values.dueAt).toISOString(),
    },
  })
  resetReminderForm()
})

function doneReminder(reminderId: string) {
  if (completingReminderId.value) return
  completingReminderId.value = reminderId
  completeRem(
    { reminderId, processId: props.processId },
    {
      onSettled: () => {
        completingReminderId.value = null
      },
    },
  )
}

function showSection(id: 'notes' | 'activities' | 'reminders') {
  return props.layout === 'grid' || tab.value === id
}
</script>

<template>
  <div>
    <div v-if="!processId" class="text-sm" :style="{ color: 'var(--color-text-muted)' }">
      Seleccione un proceso para el seguimiento.
    </div>

    <div v-else-if="isLoading" class="flex justify-center py-10">
      <AppIcon icon="svg-spinners:ring-resize" :size="28" color="var(--color-primary)" />
    </div>

    <div
      v-else-if="detailQueryError"
      class="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center rounded-xl border"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <p class="text-sm font-medium max-w-md" style="color: var(--color-error)">{{ getApiErrorMessage(detailFetchError) }}</p>
      <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchProcDetail()">Reintentar</BaseButton>
    </div>

    <template v-else-if="proc">
      <!-- Pestañas (pipeline / modal) -->
      <div
        v-if="layout === 'tabs'"
        class="flex flex-wrap gap-1 border-b pb-2 mb-4"
        :style="{ borderColor: 'var(--color-border)' }"
      >
        <button
          v-for="t in tabItems"
          :key="t.id"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          :style="{
            color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            backgroundColor: tab === t.id ? 'var(--color-hover)' : 'transparent',
          }"
          @click="tab = t.id"
        >
          <AppIcon :icon="t.icon" :size="16" />
          {{ t.label }}
        </button>
      </div>

      <div :class="layout === 'grid' ? 'grid lg:grid-cols-3 gap-6' : 'space-y-0'">
        <FormSectionCard
          v-show="showSection('notes')"
          dense
          title="Notas"
          subtitle="Seguimiento y acuerdos del proceso"
          icon="lucide:notebook-pen"
        >
          <div class="space-y-2 overflow-y-auto mb-3" :class="listMaxClass">
            <div
              v-for="n in proc.notes ?? []"
              :key="n.id"
              class="text-sm p-2 rounded-lg"
              :style="{ background: 'var(--color-hover)' }"
            >
              <p class="whitespace-pre-wrap">{{ n.body }}</p>
              <p class="text-[11px] mt-1" :style="{ color: 'var(--color-text-muted)' }">
                {{ new Date(n.createdAt).toLocaleString() }}
              </p>
            </div>
            <p
              v-if="!(proc.notes ?? []).length"
              class="text-sm"
              :style="{ color: 'var(--color-text-muted)' }"
            >
              Sin notas aún.
            </p>
          </div>
          <form class="space-y-2" @submit.prevent="onNoteSubmit">
            <FormTextarea
              v-bind="noteBinds"
              label="Nueva nota"
              :rows="compact ? 2 : 3"
              placeholder="Escriba el seguimiento o acuerdos..."
              :error="noteErrors.text"
            />
            <BaseButton type="submit" size="sm" icon="lucide:sticky-note" :loading="addingNote">Agregar nota</BaseButton>
          </form>
        </FormSectionCard>

        <FormSectionCard
          v-show="showSection('activities')"
          dense
          title="Actividades"
          subtitle="Llamadas, visitas y gestiones"
          icon="lucide:calendar-clock"
        >
          <div class="space-y-2 overflow-y-auto mb-3 text-sm" :class="listMaxClass">
            <div v-for="a in proc.activities ?? []" :key="a.id" class="flex flex-wrap gap-2 items-baseline">
              <Badge variant="neutral">{{ a.activityType }}</Badge>
              <span :style="{ color: 'var(--color-text-primary)' }">{{ a.title }}</span>
              <span v-if="a.description" class="w-full text-xs" :style="{ color: 'var(--color-text-secondary)' }">{{
                a.description
              }}</span>
            </div>
            <p
              v-if="!(proc.activities ?? []).length"
              class="text-sm"
              :style="{ color: 'var(--color-text-muted)' }"
            >
              Sin actividades registradas.
            </p>
          </div>
          <form class="space-y-2" @submit.prevent="onActivitySubmit">
            <FormSelect
              v-bind="actTypeBinds"
              label="Tipo"
              :options="[...ACTIVITY_TYPE_OPTIONS]"
              :error="activityErrors.activityType"
            />
            <FormInput
              v-bind="actTitleBinds"
              label="Título"
              placeholder="Ej. Llamada de seguimiento"
              :error="activityErrors.title"
            />
            <FormTextarea
              v-bind="actDescBinds"
              label="Detalle (opcional)"
              :rows="2"
              placeholder="Resumen o próximos pasos"
              :error="activityErrors.description"
            />
            <BaseButton type="submit" size="sm" icon="lucide:calendar-plus" :loading="addingAct">Registrar actividad</BaseButton>
          </form>
        </FormSectionCard>

        <FormSectionCard
          v-show="showSection('reminders')"
          dense
          title="Recordatorios"
          subtitle="Alertas y fechas pendientes"
          icon="lucide:bell"
        >
          <ul class="space-y-2 text-sm mb-3 overflow-y-auto" :class="listMaxClass">
            <li
              v-for="r in proc.reminders ?? []"
              :key="r.id"
              class="flex justify-between gap-2 items-start py-1 border-b last:border-0"
              :style="{ borderColor: 'var(--color-border)' }"
            >
              <div>
                <span :style="{ color: 'var(--color-text-primary)' }">{{ r.title }}</span>
                <span class="block text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">{{
                  new Date(r.dueAt).toLocaleString()
                }}</span>
              </div>
              <BaseButton
                v-if="!r.completedAt"
                size="sm"
                variant="outline"
                :loading="completingReminderId === r.id"
                :disabled="!!completingReminderId && completingReminderId !== r.id"
                @click="doneReminder(r.id)"
              >
                Hecho
              </BaseButton>
              <Badge v-else variant="success" class="shrink-0">Listo</Badge>
            </li>
            <li v-if="!(proc.reminders ?? []).length" :style="{ color: 'var(--color-text-muted)' }">
              Sin recordatorios.
            </li>
          </ul>
          <form class="space-y-2" @submit.prevent="onReminderSubmit">
            <FormInput
              v-bind="remTitleBinds"
              label="Título"
              placeholder="Ej. Enviar cotización"
              :error="reminderErrors.title"
            />
            <FormInput
              v-bind="remDueBinds"
              type="datetime-local"
              label="Fecha y hora"
              :error="reminderErrors.dueAt"
            />
            <BaseButton type="submit" size="sm" icon="lucide:bell-plus" :loading="addingRem">Agregar recordatorio</BaseButton>
          </form>
        </FormSectionCard>
      </div>
    </template>
  </div>
</template>
