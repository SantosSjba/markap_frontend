export type ArquitecturaReportesRangeParams = {
  startDate: string
  endDate: string
}

export type ArquitecturaReportsVentas = {
  cobranzasPeriodo: number
  pagosRegistradosPeriodo: number
  proyectosConCobroEnPeriodo: number
  carteraPendienteCuotas: number
}

export type ArquitecturaReportsConversion = {
  proyectosPorEstado: { status: string; count: number }[]
  proyectosNuevosPeriodo: number
  proyectosFinalizadosPeriodo: number
  presupuestosAprobadosPeriodo: number
  presupuestosRechazadosPeriodo: number
  presupuestosEnviadosSnapshot: number
  tasaCierrePresupuestoPct: number | null
}

export type ArquitecturaReportsRentabilidad = {
  volumenPresupuestosAprobadosPeriodo: number
  costosEjecucionPeriodo: number
  comprasMaterialesPeriodo: number
  margenBrutoEstimado: number
  margenBrutoPct: number | null
}

export type ArquitecturaReportsProductividad = {
  tareasTotales: number
  tareasCompletadasSnapshot: number
  tareasCompletadasPeriodo: number
  pctAvanceTareas: number | null
  evidenciasPeriodo: number
  incidenciasAbiertas: number
  progresoPromedioProyectosPct: number | null
}

export type ArquitecturaReportsCostosCategoria = {
  category: string
  total: number
}

export type ArquitecturaReportsCostos = {
  ejecucionPorCategoria: ArquitecturaReportsCostosCategoria[]
  comprasProveedoresPeriodo: number
  totalCostosPeriodo: number
}

export type ArquitecturaReportsKpis = {
  proyectosActivos: number
  proyectosEnEjecucion: number
  clientesTotales: number
  presupuestosBorrador: number
}

export type ArquitecturaReportsDashboard = {
  applicationSlug: string
  range: ArquitecturaReportesRangeParams
  ventas: ArquitecturaReportsVentas
  conversion: ArquitecturaReportsConversion
  rentabilidad: ArquitecturaReportsRentabilidad
  productividad: ArquitecturaReportsProductividad
  costos: ArquitecturaReportsCostos
  kpis: ArquitecturaReportsKpis
}
