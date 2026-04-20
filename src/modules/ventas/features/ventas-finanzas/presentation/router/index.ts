import type { RouteRecordRaw } from 'vue-router'

export const ventasFinanzasPagosRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-pagos',
    component: () => import('../views/VentasPagosView.vue'),
    meta: { title: 'Pagos' },
  },
]

export const ventasFinanzasComisionesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-comisiones',
    component: () => import('../views/VentasComisionesView.vue'),
    meta: { title: 'Comisiones' },
  },
]

export const ventasFinanzasCostosDocRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-costos-documentacion',
    component: () => import('../views/VentasCostosDocumentacionView.vue'),
    meta: { title: 'Costos de Documentación' },
  },
]
