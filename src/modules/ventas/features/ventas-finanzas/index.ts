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
  useVentasRecalculateCommission,
  useVentasUpsertCommissionProfile,
  useVentasDocumentationCostsList,
  useVentasCreateDocumentationCost,
  useVentasClosingProfitability,
} from './application/useVentasFinanzas'
export { ventasFinanzasService } from './infrastructure/ventasFinanzas.service'
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
