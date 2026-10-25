import { createServiceKey } from '@shared/application/ports/service-key'
import type { ArquitecturaCalendarRepository } from '../../domain/repositories/calendar.repository'
export const arquitecturaCalendarRepositoryKey = createServiceKey<ArquitecturaCalendarRepository>(
  'arquitectura.features.cronograma.calendar',
)
