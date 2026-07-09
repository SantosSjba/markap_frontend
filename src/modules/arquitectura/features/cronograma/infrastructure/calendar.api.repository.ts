import { apiClient } from '@core/api/apiClient'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import type {
  CalendarFeedItemDto,
  CalendarFeedParams,
  CreateCalendarEventPayload,
  UpdateCalendarEventPayload,
} from '../domain/calendar.types'

const BASE = '/arquitectura-calendar'

const q = () => ({ params: { applicationSlug: ARQUITECTURA_APP_SLUG } })

export const arquitecturaCalendarApiRepository = {
  getFeed: (params: CalendarFeedParams) =>
    apiClient
      .get<CalendarFeedItemDto[]>(`${BASE}/feed`, {
        params: {
          ...q().params,
          from: params.from,
          to: params.to,
          ...(params.projectId?.trim() ? { projectId: params.projectId.trim() } : {}),
          ...(params.agentId?.trim() ? { agentId: params.agentId.trim() } : {}),
        },
      })
      .then((r) => r.data),

  createEvent: (payload: CreateCalendarEventPayload) =>
    apiClient.post<CalendarFeedItemDto>(`${BASE}/events`, payload, q()).then((r) => r.data),

  updateEvent: (eventId: string, payload: UpdateCalendarEventPayload) =>
    apiClient.patch<CalendarFeedItemDto>(`${BASE}/events/${encodeURIComponent(eventId)}`, payload, q()).then((r) => r.data),

  deleteEvent: (eventId: string) =>
    apiClient.delete(`${BASE}/events/${encodeURIComponent(eventId)}`, q()).then(() => undefined),
}
