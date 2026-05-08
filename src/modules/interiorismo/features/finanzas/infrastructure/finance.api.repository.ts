import { apiClient } from '@core/api/apiClient'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type { InteriorFinanceRepository } from '../domain/repositories/finance.repository'
import type {
  CreateFinancePaymentPayload,
  CreateFinanceSchedulePayload,
  InteriorFinanceOverviewDto,
  UpdateFinancePaymentPayload,
  UpdateFinanceSchedulePayload,
} from '../domain/finance.types'

const BASE = '/interiorismo-finance'

const q = () => ({ params: { applicationSlug: INTERIORISMO_APP_SLUG } })

export const interiorFinanceApiRepository: InteriorFinanceRepository = {
  getOverview: (projectId: string) =>
    apiClient.get<InteriorFinanceOverviewDto>(`${BASE}/projects/${projectId}/overview`, q()).then((r) => r.data),

  createSchedule: (projectId: string, payload: CreateFinanceSchedulePayload) =>
    apiClient.post(`${BASE}/projects/${projectId}/schedules`, payload, q()).then((r) => r.data),

  updateSchedule: (projectId: string, scheduleId: string, payload: UpdateFinanceSchedulePayload) =>
    apiClient.patch(`${BASE}/projects/${projectId}/schedules/${scheduleId}`, payload, q()).then((r) => r.data),

  deleteSchedule: (projectId: string, scheduleId: string) =>
    apiClient.delete(`${BASE}/projects/${projectId}/schedules/${scheduleId}`, q()).then(() => undefined),

  createPayment: (projectId: string, payload: CreateFinancePaymentPayload) =>
    apiClient.post(`${BASE}/projects/${projectId}/payments`, payload, q()).then((r) => r.data),

  updatePayment: (projectId: string, paymentId: string, payload: UpdateFinancePaymentPayload) =>
    apiClient.patch(`${BASE}/projects/${projectId}/payments/${paymentId}`, payload, q()).then((r) => r.data),

  deletePayment: (projectId: string, paymentId: string) =>
    apiClient.delete(`${BASE}/projects/${projectId}/payments/${paymentId}`, q()).then(() => undefined),
}
