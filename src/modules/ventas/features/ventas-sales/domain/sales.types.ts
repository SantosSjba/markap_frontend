export const VENTAS_SALES_APP_SLUG = 'ventas' as const

export interface SaleProcessListRow {
  id: string
  code: string
  title: string | null
  pipelineStage: string
  status: string
  buyer: { id: string; fullName: string; primaryPhone: string }
  property: { id: string; code: string; addressLine: string; salePrice: number | null }
  agent: { id: string; fullName: string } | null
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
