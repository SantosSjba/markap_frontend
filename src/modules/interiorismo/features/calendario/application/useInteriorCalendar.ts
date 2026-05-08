import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type { CalendarFeedParams, CreateCalendarEventPayload, UpdateCalendarEventPayload } from '../domain/calendar.types'
import { interiorCalendarApiRepository as repo } from '../infrastructure/calendar.api.repository'

export const interiorCalendarKeys = {
  all: ['interiorismo-calendar', INTERIORISMO_APP_SLUG] as const,
  feed: (p: CalendarFeedParams) => [...interiorCalendarKeys.all, 'feed', p] as const,
}

export function useInteriorCalendarFeed(params: Ref<CalendarFeedParams> | CalendarFeedParams) {
  return useQuery({
    queryKey: computed(() => interiorCalendarKeys.feed({ ...unref(params) })),
    queryFn: () => repo.getFeed({ ...unref(params) }),
    enabled: computed(() => {
      const p = unref(params)
      return !!p.from?.trim() && !!p.to?.trim()
    }),
  })
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCalendarEventPayload) => repo.createEvent(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: interiorCalendarKeys.all })
      void markapAlert.toast.success('Evento creado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(err)),
  })
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: UpdateCalendarEventPayload }) =>
      repo.updateEvent(eventId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: interiorCalendarKeys.all })
      void markapAlert.toast.success('Evento actualizado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(err)),
  })
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => repo.deleteEvent(eventId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: interiorCalendarKeys.all })
      void markapAlert.toast.success('Evento eliminado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err)),
  })
}
