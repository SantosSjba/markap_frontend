export interface RentalTenantRef {
  id: string
  fullName: string
}

export interface CreateRentalPayload {
  applicationSlug?: string
  propertyId: string
  tenantIds: string[]
  startDate: string
  endDate: string
  currency: string
  monthlyAmount: number
  securityDeposit?: number | null
  paymentDueDay: number
  notes?: string | null
  enableExpirationAlerts?: boolean
  enableCollectionAlerts?: boolean
}

export interface RentalCreated {
  id: string
  applicationId: string
  propertyId: string
  tenantId: string
  startDate: string
  endDate: string
  currency: string
  monthlyAmount: number
  securityDeposit: number | null
  paymentDueDay: number
  notes: string | null
  status: string
  enableExpirationAlerts: boolean
  enableCollectionAlerts: boolean
}

export interface RentalListItem {
  id: string
  code: string
  propertyId: string
  propertyAddress: string
  propertyCode: string
  tenantId: string
  tenantName: string
  ownerId: string
  ownerName: string
  startDate: string
  endDate: string
  currency: string
  monthlyAmount: number
  securityDeposit: number | null
  status: string
  hasContract: boolean
}

export interface ListRentalsParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
}

export interface ListRentalsResponse {
  data: RentalListItem[]
  total: number
  page: number
  limit: number
}

export interface RentalStats {
  total: number
  vigentes: number
  porVencer: number
  vencidos: number
}

export interface RentalAttachment {
  id: string
  type: 'CONTRACT' | 'DELIVERY_ACT'
  filePath: string
  originalFileName: string
  archivoId?: string | null
  downloadUrl?: string | null
}

export interface RentalDetail {
  id: string
  applicationId: string
  propertyId: string
  tenantId: string
  startDate: string
  endDate: string
  currency: string
  monthlyAmount: number
  securityDeposit: number | null
  paymentDueDay: number
  notes: string | null
  status: string
  enableExpirationAlerts: boolean
  enableCollectionAlerts: boolean
  code: string
  property: {
    id: string
    code: string
    addressLine: string
    ownerId: string
    owner: { id: string; fullName: string }
  }
  tenant: { id: string; fullName: string }
  tenants: RentalTenantRef[]
  hasContract: boolean
  hasDeliveryAct: boolean
  attachments?: RentalAttachment[]
}

export interface UpdateRentalPayload {
  startDate?: string
  endDate?: string
  currency?: string
  monthlyAmount?: number
  securityDeposit?: number | null
  paymentDueDay?: number
  notes?: string | null
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  enableExpirationAlerts?: boolean
  enableCollectionAlerts?: boolean
  tenantIds?: string[]
}

export type FinancialValueType = 'PERCENT' | 'FIXED'

export interface RentalFinancialConfig {
  id: string
  rentalId: string
  currency: string
  baseAmount: number | null
  expenseType: FinancialValueType
  expenseValue: number
  expenseDetail: string | null
  taxType: FinancialValueType
  taxValue: number
  taxDetail: string | null
  externalAgentId: string | null
  externalAgentType: FinancialValueType
  externalAgentValue: number
  externalAgentName: string | null
  internalAgentId: string | null
  internalAgentType: FinancialValueType
  internalAgentValue: number
  internalAgentName: string | null
  createdAt: string
  updatedAt: string
}

export interface RentalFinancialBreakdown {
  monthlyAmount: number
  baseAmount: number
  currency: string
  expense: number
  tax: number
  externalAgentCommission: number
  internalAgentCommission: number
  utility: number
  config: RentalFinancialConfig | null
}

export interface UpsertRentalFinancialConfigPayload {
  currency?: string
  baseAmount?: number | null
  expenseType?: FinancialValueType
  expenseValue?: number
  expenseDetail?: string | null
  taxType?: FinancialValueType
  taxValue?: number
  taxDetail?: string | null
  externalAgentId?: string | null
  externalAgentType?: FinancialValueType
  externalAgentValue?: number
  externalAgentName?: string | null
  internalAgentId?: string | null
  internalAgentType?: FinancialValueType
  internalAgentValue?: number
  internalAgentName?: string | null
}
