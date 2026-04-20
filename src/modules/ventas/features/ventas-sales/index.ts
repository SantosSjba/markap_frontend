/**
 * Ventas — CRM procesos, separaciones y cierres (domain / application / infrastructure / presentation).
 */
export * from './application'
export type { VentasSalesRepository } from './domain/repositories/ventas-sales.repository'
export { ventasSalesApiRepository as ventasSalesRepository } from './infrastructure/repositories/ventas-sales.api.repository'
export { ventasSalesApiRepository, ventasSalesService } from './infrastructure'
export type {
  SaleProcessListRow,
  SaleSeparationRow,
  SaleClosingRow,
  SaleProcessNoteRow,
  SaleProcessActivityRow,
  SaleProcessReminderRow,
  SaleProcessDetail,
} from './domain/sales.types'
export { VENTAS_SALES_APP_SLUG } from './domain/sales.types'
export {
  PIPELINE_STAGE_OPTIONS,
  type PipelineStageValue,
  normalizePipelineStage,
  pipelineStageLabel,
  PROCESS_STATUS_OPTIONS,
  processStatusLabel,
  SEPARATION_STATUS_OPTIONS,
  separationStatusLabel,
  PAYMENT_TYPE_OPTIONS,
} from './domain/pipeline.constants'
export { ACTIVITY_TYPE_OPTIONS, type ActivityTypeCode } from './domain/activityTypes.constants'
export * from './presentation'
