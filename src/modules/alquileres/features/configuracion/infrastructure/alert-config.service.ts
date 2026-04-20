import { apiClient } from '@core/api/apiClient'
import type { AlertConfigData, UpsertAlertConfigPayload } from '../domain/alert-config.types'

export const alertConfigService = {
  get(applicationSlug: string): Promise<AlertConfigData> {
    return apiClient.get<AlertConfigData>(`/alert-config/${applicationSlug}`).then((r) => r.data)
  },

  upsert(applicationSlug: string, payload: UpsertAlertConfigPayload): Promise<AlertConfigData> {
    return apiClient.put<AlertConfigData>(`/alert-config/${applicationSlug}`, payload).then((r) => r.data)
  },
}
