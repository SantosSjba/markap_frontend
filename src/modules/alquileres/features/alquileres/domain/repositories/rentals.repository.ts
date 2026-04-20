import type {
  CreateRentalPayload,
  ListRentalsParams,
  ListRentalsResponse,
  RentalCreated,
  RentalDetail,
  RentalFinancialBreakdown,
  RentalFinancialConfig,
  RentalStats,
  UpdateRentalPayload,
  UpsertRentalFinancialConfigPayload,
} from '../rental.types'

/** Puerto de persistencia de contratos de alquiler (rentals / API `/rentals`). */
export interface RentalsRepository {
  getById: (id: string) => Promise<RentalDetail>
  update: (
    id: string,
    data: UpdateRentalPayload,
    files?: { contractFile?: File; deliveryActFile?: File },
  ) => Promise<RentalCreated>
  getList: (params: ListRentalsParams) => Promise<ListRentalsResponse>
  getStats: (applicationSlug?: string) => Promise<RentalStats>
  getFinancialConfig: (rentalId: string) => Promise<RentalFinancialConfig | null>
  getFinancialBreakdown: (rentalId: string) => Promise<RentalFinancialBreakdown>
  upsertFinancialConfig: (
    rentalId: string,
    data: UpsertRentalFinancialConfigPayload,
  ) => Promise<RentalFinancialConfig>
  cancel: (id: string) => Promise<{ message: string }>
  create: (
    data: CreateRentalPayload,
    files?: { contractFile?: File; deliveryActFile?: File },
  ) => Promise<RentalCreated>
}
