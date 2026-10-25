import { createServiceKey } from '@shared/application/ports/service-key'
import type { InteriorCalendarRepository } from '../../domain/repositories/calendar.repository'
export const interiorCalendarRepositoryKey = createServiceKey<InteriorCalendarRepository>(
  'interiorismo.features.calendario.calendar',
)
