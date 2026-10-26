import type {
  ListCommissionsParams,
  RentalCommissionsList,
  UpdateCommissionPayload,
} from '../commission.types'
export interface CommissionsRepository {
  list: (params?: ListCommissionsParams) => Promise<RentalCommissionsList>
  update: (rentalId: string, data: UpdateCommissionPayload) => Promise<unknown>
}
