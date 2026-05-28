export const VENTAS_SALES_APP_SLUG = 'ventas' as const

export interface SaleProcessParticipant {
  id: string
  fullName: string
  documentNumber: string
  documentTypeName?: string | null
  primaryPhone: string
  primaryEmail?: string | null
  clientType?: string
  isPrimary?: boolean
}

export interface SaleFinancingChannel {
  id: string
  code: string
  name: string
  category: 'BANK' | 'PAYMENT_METHOD' | 'OWN_FUNDS' | 'OTHER' | string
}

export interface SaleProcessPropertyDetail {
  id: string
  code: string
  addressLine: string
  salePrice: number | null
  saleCurrency?: string
  projectName?: string | null
  listingStatus?: string | null
  area?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  propertyTypeName?: string | null
  locationLabel?: string | null
}

export interface SaleProcessListRow {
  id: string
  code: string
  title: string | null
  pipelineStage: string
  status: string
  buyer: { id: string; fullName: string; primaryPhone: string }
  buyers?: SaleProcessParticipant[]
  owners?: SaleProcessParticipant[]
  property: SaleProcessPropertyDetail
  agent: { id: string; fullName: string } | null
  financingChannel?: SaleFinancingChannel | null
}

export interface SaleSeparationRow {
  id: string
  amount: number
  currency: string
  separationDate: string
  status: string
  receiptFilePath: string | null
  buyer: { id: string; fullName: string }
  property: { id: string; code: string; addressLine: string }
  saleProcess: { id: string; code: string } | null
}

export interface SaleClosingRow {
  id: string
  finalPrice: number
  paymentType: string
  closedAt: string
  contractFilePath: string | null
  buyer: { id: string; fullName: string }
  property: { id: string; code: string; addressLine: string }
  agent: { id: string; fullName: string } | null
  commission: {
    id: string
    amount: number
    status: string
    percentApplied: number | null
  } | null
}

export interface SaleProcessNoteRow {
  id: string
  body: string
  createdAt: string
}

export interface SaleProcessActivityRow {
  id: string
  activityType: string
  title: string
  description: string | null
  createdAt: string
}

export interface SaleProcessReminderRow {
  id: string
  title: string
  dueAt: string
  completedAt: string | null
}

/** Detalle de proceso (GET /processes/:id) */
export interface SaleProcessDetail extends SaleProcessListRow {
  notes: SaleProcessNoteRow[]
  activities: SaleProcessActivityRow[]
  reminders: SaleProcessReminderRow[]
}

export interface SaleClosingReadiness {
  ok: boolean
  missing: string[]
  checklist: Record<string, unknown> | null
}

export interface SaleComplianceChecklist {
  id?: string
  applicationId?: string
  propertyId: string
  buyerClientId: string
  titleStudyChecked?: boolean
  criChecked?: boolean
  noLiensChecked?: boolean
  municipalTaxClearanceChecked?: boolean
  minutaSigned?: boolean
  publicDeedSigned?: boolean
  notarialPartSubmitted?: boolean
  sunarpStatus?: 'PENDING' | 'SUBMITTED' | 'OBSERVED' | 'REGISTERED'
  sunarpSubmittedAt?: string | null
  sunarpObservedAt?: string | null
  sunarpRegisteredAt?: string | null
  sunarpObservationNotes?: string | null
  alcabalaApplicable?: boolean
  alcabalaAmount?: number | null
  alcabalaPaidAt?: string | null
  rent2Applicable?: boolean
  rent2Amount?: number | null
  rent2PaidAt?: string | null
  bankedPaymentRequired?: boolean
  bankedPaymentVerified?: boolean
  paymentMethod?: string | null
  bankOperationNumber?: string | null
  bankName?: string | null
  bankAccountHolder?: string | null
  paymentEvidencePath?: string | null
  fundsSourceDeclared?: boolean
  beneficialOwnerDeclared?: boolean
  kycRiskLevel?: 'PENDING' | 'LOW' | 'MEDIUM' | 'HIGH'
  complianceNotes?: string | null
}

export interface SaleComplianceDocument {
  id: string
  docType: string
  filePath: string
  archivoId?: string | null
  downloadUrl?: string | null
  issuedAt: string | null
  verifiedAt: string | null
  verifiedBy: string | null
  notes: string | null
  createdAt: string
}

export interface SaleTaxPreview {
  salePrice: number
  acquisitionCost: number
  uit: number
  alcabala: { applicable: boolean; taxableBase: number; amount: number }
  rent2: { applicable: boolean; capitalGain: number; amount: number }
  legalNote: string
}

export interface CompliancePendingItem {
  checklistId: string
  propertyId: string
  buyerClientId: string
  sunarpStatus: string
  nextActionAt: string | null
  lastAlertSentAt: string | null
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  missing: string[]
}
