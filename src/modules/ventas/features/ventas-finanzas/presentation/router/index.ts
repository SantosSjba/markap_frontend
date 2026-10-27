import type { RouteRecordRaw } from 'vue-router'

// Pagos del comprador y gastos de documentación se gestionan en la ficha del proceso (Cobranza y gastos)
export const ventasFinanzasComisionesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-comisiones',
    component: () => import('../views/VentasComisionesView.vue'),
    meta: { title: 'Comisiones' },
  },
]
