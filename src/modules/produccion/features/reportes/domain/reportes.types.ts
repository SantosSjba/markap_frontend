export type ProduccionReportesRangeParams = {
  startDate: string
  endDate: string
  clientId?: string
  category?: string
}

export type ProduccionReportsProduccion = {
  workOrdersCreated: number
  workOrdersCompleted: number
  workOrdersInProgressSnapshot: number
  workOrdersByStatus: { status: string; count: number }[]
  materialConsumptionQty: number
}

export type ProduccionReportsVentas = {
  quotationsSent: number
  quotationsAccepted: number
  ordersCreated: number
  ordersDelivered: number
  salesRevenuePeriod: number
  pipelineValue: number
}

export type ProduccionReportsInventario = {
  totalMaterials: number
  activeMaterials: number
  lowStockCount: number
  totalStockValue: number
  stockValueByCategory: { category: string; itemCount: number; totalValue: number }[]
  movementsInPeriod: number
  stockInValuePeriod: number
}

export type ProduccionReportsRentabilidadRow = {
  furnitureId: string
  furnitureCode: string
  furnitureName: string
  category: string
  referencePrice: number
  estimatedCost: number
  marginAmount: number
  marginPercent: number | null
  unitsSoldPeriod: number
  revenuePeriod: number
}

export type ProduccionReportsRentabilidad = {
  rows: ProduccionReportsRentabilidadRow[]
  avgMarginPercent: number | null
}

export type ProduccionReportsKpis = {
  openQuotations: number
  pendingOrders: number
  activeWorkOrders: number
  pendingPurchaseOrders: number
}

export type ProduccionReportsDashboard = {
  applicationSlug: string
  range: { startDate: string; endDate: string }
  filters: { clientId: string | null; category: string | null }
  produccion: ProduccionReportsProduccion
  ventas: ProduccionReportsVentas
  inventario: ProduccionReportsInventario
  rentabilidad: ProduccionReportsRentabilidad
  kpis: ProduccionReportsKpis
}
