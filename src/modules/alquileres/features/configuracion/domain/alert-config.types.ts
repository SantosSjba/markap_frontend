export interface AlertConfigData {
  id: string | null
  applicationId: string
  userId: string

  alert30Days: boolean
  alert60Days: boolean
  alert90Days: boolean

  alertPendingPayment: boolean
  alertOverduePayment: boolean

  channelInApp: boolean
  channelEmail: boolean
  channelWhatsapp: boolean
}

export interface UpsertAlertConfigPayload {
  alert30Days?: boolean
  alert60Days?: boolean
  alert90Days?: boolean
  alertPendingPayment?: boolean
  alertOverduePayment?: boolean
  channelInApp?: boolean
  channelEmail?: boolean
  channelWhatsapp?: boolean
}
