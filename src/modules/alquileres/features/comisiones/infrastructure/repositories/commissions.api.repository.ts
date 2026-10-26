import { apiClient } from '@shared/infrastructure/http/api-client'
import type {
  ListCommissionsParams,
  RentalCommissionsList,
  UpdateCommissionPayload,
} from '../../domain/commission.types'
import type { CommissionsRepository } from '../../domain/repositories/commissions.repository'
export const commissionsApiRepository: CommissionsRepository = {
  list: (params: ListCommissionsParams = {}) => {
    const p = new URLSearchParams()
    p.set('applicationSlug', params.applicationSlug ?? 'alquileres')
    if (params.status) p.set('status', params.status)
    if (params.search) p.set('search', params.search)
    return apiClient
      .get<RentalCommissionsList>(`/rental-commissions?${p.toString()}`)
      .then((r) => r.data)
  },

  update: (rentalId: string, data: UpdateCommissionPayload) =>
    apiClient.patch(`/rental-commissions/${rentalId}`, data).then((r) => r.data),
}
