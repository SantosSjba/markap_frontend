import type { AlertConfigData, UpsertAlertConfigPayload } from '../alert-config.types'

export interface AlertConfigRepository {
  get: (applicationSlug: string) => Promise<AlertConfigData>
  upsert: (applicationSlug: string, payload: UpsertAlertConfigPayload) => Promise<AlertConfigData>
}
