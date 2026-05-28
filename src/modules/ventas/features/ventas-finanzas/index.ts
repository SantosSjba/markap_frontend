/**
 * Ventas — pagos del comprador, comisiones y costos de documentación.
 */
export {
  ventasFinanzasKeys,
  invalidateVentasFinanzasCache,
  useVentasBuyerPaymentsList,
  useVentasCreateBuyerPayment,
  useVentasMarkBuyerPaymentPaid,
  useVentasCommissionsList,
  useVentasCommissionProfiles,
  useVentasMarkCommissionPaid,
  useVentasMarkCommissionPaymentPartPaid,
  useVentasRecalculateCommission,
  useVentasUpsertCommissionProfile,
  useVentasDocumentationCostsList,
  useVentasCreateDocumentationCost,
  useVentasClosingProfitability,
} from './application/useVentasFinanzas'
export type { VentasFinanzasRepository } from './domain/repositories/ventas-finanzas.repository'
export { ventasFinanzasApiRepository as ventasFinanzasRepository } from './infrastructure/repositories/ventas-finanzas.api.repository'
export { ventasFinanzasApiRepository } from './infrastructure/repositories/ventas-finanzas.api.repository'
export type {
  BuyerPaymentRow,
  CommissionRow,
  CommissionProfileRow,
  DocumentationCostRow,
  ProfitabilitySummary,
} from './domain/finanzas.types'
export {
  ventasFinanzasPagosRoutes,
  ventasFinanzasComisionesRoutes,
  ventasFinanzasCostosDocRoutes,
} from './presentation/router'
