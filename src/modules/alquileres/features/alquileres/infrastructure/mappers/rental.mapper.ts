import type {
  ListRentalsResponse,
  RentalCreated,
  RentalDetail,
  RentalFinancialBreakdown,
  RentalFinancialConfig,
  RentalStats,
} from '../../domain/rental.types'

/** Punto único para adaptar respuestas HTTP al modelo de dominio (evolución sin acoplar vistas). */
export function mapListRentalsResponse(body: ListRentalsResponse): ListRentalsResponse {
  return body
}

type RentalAlertFields = {
  enableExpirationAlerts?: boolean
  enableCollectionAlerts?: boolean
  enableAlerts?: boolean
}

function mapRentalAlertFields<T extends RentalAlertFields>(body: T): T {
  const legacy = body.enableAlerts
  return {
    ...body,
    enableExpirationAlerts: body.enableExpirationAlerts ?? legacy ?? true,
    enableCollectionAlerts: body.enableCollectionAlerts ?? legacy ?? true,
  }
}

export function mapRentalDetail(body: RentalDetail): RentalDetail {
  return mapRentalAlertFields(body)
}

export function mapRentalStats(body: RentalStats): RentalStats {
  return body
}

export function mapRentalCreated(body: RentalCreated): RentalCreated {
  return mapRentalAlertFields(body)
}

export function mapRentalFinancialConfig(body: RentalFinancialConfig | null): RentalFinancialConfig | null {
  return body
}

export function mapRentalFinancialBreakdown(body: RentalFinancialBreakdown): RentalFinancialBreakdown {
  return body
}
