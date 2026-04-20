/**
 * Valores de formularios del panel de seguimiento; alineados con saleProcessFollowUpSchemas (Yup).
 */
export type SaleProcessNoteFormValues = {
  text: string
}

export type SaleProcessActivityFormValues = {
  activityType: string
  title: string
  description?: string
}

export type SaleProcessReminderFormValues = {
  title: string
  dueAt: string
}
