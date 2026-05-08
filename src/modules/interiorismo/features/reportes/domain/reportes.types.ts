export type InteriorReportesRangeParams = {
  startDate: string
  endDate: string
}

export type InteriorReportsVentas = {
  cobranzasPeriodo: number
  pagosRegistradosPeriodo: number
  proyectosConCobroEnPeriodo: number
  carteraPendienteCuotas: number
}

export type InteriorReportsConversion = {
  proyectosPorEstado: { status: string; count: number }[]
  proyectosNuevosPeriodo: number
  proyectosFinalizadosPeriodo: number
  presupuestosAprobadosPeriodo: number
  presupuestosRechazadosPeriodo: number
  presupuestosEnviadosSnapshot: number
  tasaCierrePresupuestoPct: number | null
}

export type InteriorReportsRentabilidad = {
  volumenPresupuestosAprobadosPeriodo: number
  costosEjecucionPeriodo: number
  comprasMaterialesPeriodo: number
  margenBrutoEstimado: number
  margenBrutoPct: number | null
}

export type InteriorReportsProductividad = {
  tareasTotales: number
  tareasCompletadasSnapshot: number
  tareasCompletadasPeriodo: number
  pctAvanceTareas: number | null
  evidenciasPeriodo: number
  incidenciasAbiertas: number
  progresoPromedioProyectosPct: number | null
}

export type InteriorReportsCostosCategoria = {
  category: string
  total: number
}

export type InteriorReportsCostos = {
  ejecucionPorCategoria: InteriorReportsCostosCategoria[]
  comprasProveedoresPeriodo: number
  totalCostosPeriodo: number
}

export type InteriorReportsKpis = {
  proyectosActivos: number
  proyectosEnEjecucion: number
  clientesTotales: number
  presupuestosBorrador: number
}

export type InteriorReportsDashboard = {
  applicationSlug: string
  range: InteriorReportesRangeParams
  ventas: InteriorReportsVentas
  conversion: InteriorReportsConversion
  rentabilidad: InteriorReportsRentabilidad
  productividad: InteriorReportsProductividad
  costos: InteriorReportsCostos
  kpis: InteriorReportsKpis
}
