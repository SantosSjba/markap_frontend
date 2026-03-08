import { apiClient } from '@app/api/apiClient'

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

export const alertConfigService = {
  get(applicationSlug: string): Promise<AlertConfigData> {
    return apiClient
      .get<AlertConfigData>(`/alert-config/${applicationSlug}`)
      .then((r) => r.data)
  },

  upsert(applicationSlug: string, payload: UpsertAlertConfigPayload): Promise<AlertConfigData> {
    return apiClient
      .put<AlertConfigData>(`/alert-config/${applicationSlug}`, payload)
      .then((r) => r.data)
  },
}
