import type {
  CalendarFeedItemDto,
  CalendarFeedParams,
  CreateCalendarEventPayload,
  UpdateCalendarEventPayload,
} from '../calendar.types'
export interface InteriorCalendarRepository {
  getFeed: (params: CalendarFeedParams) => Promise<CalendarFeedItemDto[]>
  createEvent: (payload: CreateCalendarEventPayload) => Promise<CalendarFeedItemDto>
  updateEvent: (
    eventId: string,
    payload: UpdateCalendarEventPayload,
  ) => Promise<CalendarFeedItemDto>
  deleteEvent: (eventId: string) => Promise<undefined>
}
