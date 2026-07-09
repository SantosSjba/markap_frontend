import type {
  CreateFinancePaymentPayload,
  CreateFinanceSchedulePayload,
  ArquitecturaFinanceOverviewDto,
  UpdateFinancePaymentPayload,
  UpdateFinanceSchedulePayload,
} from '../finance.types'

export interface ArquitecturaFinanceRepository {
  getOverview(projectId: string): Promise<ArquitecturaFinanceOverviewDto>
  createSchedule(projectId: string, payload: CreateFinanceSchedulePayload): Promise<unknown>
  updateSchedule(projectId: string, scheduleId: string, payload: UpdateFinanceSchedulePayload): Promise<unknown>
  deleteSchedule(projectId: string, scheduleId: string): Promise<void>
  createPayment(projectId: string, payload: CreateFinancePaymentPayload): Promise<unknown>
  updatePayment(projectId: string, paymentId: string, payload: UpdateFinancePaymentPayload): Promise<unknown>
  deletePayment(projectId: string, paymentId: string): Promise<void>
}
