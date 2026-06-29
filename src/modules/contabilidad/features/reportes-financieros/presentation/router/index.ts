import type { RouteRecordRaw } from 'vue-router'

export const contabilidadReportesFinancierosRoutes: RouteRecordRaw[] = [
  {
    path: 'balance-general',
    name: 'contabilidad-reportes-balance-general',
    component: () =>
      import('../views/ContabilidadBalanceGeneralView.vue'),
    meta: { title: 'Balance general' },
  },
  {
    path: 'estado-resultados',
    name: 'contabilidad-reportes-estado-resultados',
    component: () =>
      import('../views/ContabilidadEstadoResultadosView.vue'),
    meta: { title: 'Estado de resultados' },
  },
  {
    path: 'flujo-efectivo',
    name: 'contabilidad-reportes-flujo-efectivo',
    component: () =>
      import('../views/ContabilidadFlujoEfectivoView.vue'),
    meta: { title: 'Flujo de efectivo' },
  },
  {
    path: 'flujo-caja',
    name: 'contabilidad-reportes-flujo-caja',
    component: () => import('../views/ContabilidadFlujoCajaView.vue'),
    meta: { title: 'Flujo de caja' },
  },
  {
    path: 'analisis-financiero',
    name: 'contabilidad-reportes-analisis-financiero',
    component: () => import('../views/ContabilidadAnalisisFinancieroView.vue'),
    meta: { title: 'Análisis financiero' },
  },
  {
    path: 'kpis',
    name: 'contabilidad-reportes-kpis',
    component: () => import('../views/ContabilidadKpisView.vue'),
    meta: { title: 'KPIs' },
  },
  {
    path: 'libro-mayor',
    redirect: '/contabilidad/libros-e/libro-mayor',
  },
]

export { contabilidadReportesFinancierosRoutes as default }
