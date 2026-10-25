import { interiorCalendarRepositoryKey as repoKey } from '../../application/ports/calendar.port'
import { useService } from '@shared/presentation/di/services'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import type {
  CalendarFeedParams,
  CreateCalendarEventPayload,
  UpdateCalendarEventPayload,
} from '../../domain/calendar.types'
export const interiorCalendarKeys = {
  all: ['interiorismo-calendar', INTERIORISMO_APP_SLUG] as const,
  feed: (p: CalendarFeedParams) => [...interiorCalendarKeys.all, 'feed', p] as const,
}

export function useInteriorCalendarFeed(params: Ref<CalendarFeedParams> | CalendarFeedParams) {
  const repo = useService(repoKey)
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
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCalendarEventPayload) => repo.createEvent(payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Evento creado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(err)),
  })
}

export function useUpdateCalendarEvent() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: UpdateCalendarEventPayload }) =>
      repo.updateEvent(eventId, payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Evento actualizado')
    },
    onError: (err) =>
      void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(err)),
  })
}

export function useDeleteCalendarEvent() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => repo.deleteEvent(eventId),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Evento eliminado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err)),
  })
}
