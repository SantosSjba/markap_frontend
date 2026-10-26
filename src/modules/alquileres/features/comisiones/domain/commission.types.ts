/** Cobro de la comisión (ingreso de la distribución financiera): un solo pago. */
export type CommissionStatus = 'PENDING' | 'PAID'

export interface RentalCommissionItem {
  rentalId: string
  rentalCode: string
  propertyAddress: string
  ownerName: string
  tenantName: string
  rentalStatus: string
  contractStartDate: string
  currency: string
  /** Ingreso de la distribución financiera, en la moneda del contrato */
  amount: number
  status: CommissionStatus
  dueDate: string | null
  paidDate: string | null
  /** Pendiente con fecha estimada vencida */
  isOverdue: boolean
}

export interface RentalCommissionCurrencyTotals {
  currency: string
  pendingCount: number
  pendingAmount: number
  paidCount: number
  paidAmount: number
}

export interface RentalCommissionsList {
  /** Página pedida */
  items: RentalCommissionItem[]
  /** Totales de todas las comisiones del filtro (no solo la página) */
  totalsByCurrency: RentalCommissionCurrencyTotals[]
  total: number
  page: number
  limit: number
}

export interface ListCommissionsParams {
  applicationSlug?: string
  status?: CommissionStatus
  search?: string
  page?: number
  limit?: number
}

/** PATCH /rental-commissions/:rentalId — fechas AAAA-MM-DD; null borra la fecha. */
export interface UpdateCommissionPayload {
  status?: CommissionStatus
  dueDate?: string | null
  paidDate?: string | null
}
