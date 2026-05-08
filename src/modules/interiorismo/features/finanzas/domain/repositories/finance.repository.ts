import type {
  CreateFinancePaymentPayload,
  CreateFinanceSchedulePayload,
  InteriorFinanceOverviewDto,
  UpdateFinancePaymentPayload,
  UpdateFinanceSchedulePayload,
} from '../finance.types'

export interface InteriorFinanceRepository {
  getOverview(projectId: string): Promise<InteriorFinanceOverviewDto>
  createSchedule(projectId: string, payload: CreateFinanceSchedulePayload): Promise<unknown>
  updateSchedule(projectId: string, scheduleId: string, payload: UpdateFinanceSchedulePayload): Promise<unknown>
  deleteSchedule(projectId: string, scheduleId: string): Promise<void>
  createPayment(projectId: string, payload: CreateFinancePaymentPayload): Promise<unknown>
  updatePayment(projectId: string, paymentId: string, payload: UpdateFinancePaymentPayload): Promise<unknown>
  deletePayment(projectId: string, paymentId: string): Promise<void>
}
