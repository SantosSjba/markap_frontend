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
]

export { contabilidadReportesFinancierosRoutes as default }
