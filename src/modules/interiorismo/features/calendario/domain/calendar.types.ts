export type CalendarFeedSource = 'MANUAL' | 'MILESTONE' | 'EXECUTION_TASK' | 'FINANCE_SCHEDULE'

export interface CalendarFeedItemDto {
  id: string
  source: CalendarFeedSource
  eventType: string
  title: string
  description: string | null
  location: string | null
  startsAt: string
  endsAt: string | null
  allDay: boolean
  projectId: string | null
  projectCode: string | null
  projectName: string | null
  assignedAgentId: string | null
  assignedAgentName: string | null
  readOnly: boolean
  executionPhase: string | null
}

export interface CalendarFeedParams {
  from: string
  to: string
  projectId?: string
  agentId?: string
}

export interface CreateCalendarEventPayload {
  eventType: string
  title: string
  description?: string | null
  location?: string | null
  startsAt: string
  endsAt?: string | null
  allDay?: boolean
  projectId?: string | null
  assignedAgentId?: string | null
}

export interface UpdateCalendarEventPayload {
  eventType?: string
  title?: string
  description?: string | null
  location?: string | null
  startsAt?: string
  endsAt?: string | null
  allDay?: boolean
  projectId?: string | null
  assignedAgentId?: string | null
}
