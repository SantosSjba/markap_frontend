<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import { formatDateTime, formatShortDate } from '@shared/utils/formatters'
import { computed, ref } from 'vue'
import { useForm, toTypedSchema } from '@shared/presentation/components/forms/index'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import {
  useVentasProcessDetail,
  useVentasAddProcessNote,
  useVentasAddActivity,
  useVentasAddReminder,
  useVentasCompleteReminder,
} from '../composables/useVentasSales'
import type { SaleProcessDetail } from '../../domain/sales.types'
import { ACTIVITY_TYPE_OPTIONS } from '../../domain/activityTypes.constants'
import {
  saleProcessNoteFormSchema,
  saleProcessActivityFormSchema,
  saleProcessReminderFormSchema,
} from '../validation/saleProcessFollowUpSchemas'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
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
    <div v-if="!processId" class="text-sm text-gray-400 dark:text-gray-500">
      Seleccione un proceso para el seguimiento.
    </div>

    <LoadingState v-else-if="isLoading" class="py-10" />

    <BaseCard v-else-if="detailQueryError" class="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
      <p class="text-sm font-medium max-w-md text-error-500 dark:text-error-400">{{ getApiErrorMessage(detailFetchError) }}</p>
      <BaseButton variant="outline" size="sm" icon="lucide:refresh-cw" @click="() => refetchProcDetail()">Reintentar</BaseButton>
    </BaseCard>

    <template v-else-if="proc">
      <!-- Pestañas (pipeline / modal) -->
      <BaseTabs v-if="layout === 'tabs'" v-model="tab" :tabs="tabItems" variant="segmented" class="mb-4" />

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
              class="text-sm p-2 rounded-lg bg-gray-100 dark:bg-white/5"
            >
              <p class="whitespace-pre-wrap">{{ n.body }}</p>
              <p class="text-[11px] mt-1 text-gray-400 dark:text-gray-500">
                {{ formatDateTime(n.createdAt) }}
              </p>
            </div>
            <p
              v-if="!(proc.notes ?? []).length"
              class="text-sm text-gray-400 dark:text-gray-500"
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
              <span class="text-gray-800 dark:text-white/90">{{ a.title }}</span>
              <span v-if="a.description" class="w-full text-xs text-gray-500 dark:text-gray-400">{{
                a.description
              }}</span>
            </div>
            <p
              v-if="!(proc.activities ?? []).length"
              class="text-sm text-gray-400 dark:text-gray-500"
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
              class="flex justify-between gap-2 items-start py-1 border-b last:border-0 border-gray-200 dark:border-gray-800"
            >
              <div>
                <span class="text-gray-800 dark:text-white/90">{{ r.title }}</span>
                <span class="block text-xs mt-0.5 text-gray-400 dark:text-gray-500">{{
                  formatShortDate(r.dueAt)
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
            <li class="text-gray-400 dark:text-gray-500" v-if="!(proc.reminders ?? []).length">
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
