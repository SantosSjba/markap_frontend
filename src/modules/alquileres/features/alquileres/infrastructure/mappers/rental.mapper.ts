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

export function mapRentalDetail(body: RentalDetail): RentalDetail {
  return body
}

export function mapRentalStats(body: RentalStats): RentalStats {
  return body
}

export function mapRentalCreated(body: RentalCreated): RentalCreated {
  return body
}

export function mapRentalFinancialConfig(body: RentalFinancialConfig | null): RentalFinancialConfig | null {
  return body
}

export function mapRentalFinancialBreakdown(body: RentalFinancialBreakdown): RentalFinancialBreakdown {
  return body
}
