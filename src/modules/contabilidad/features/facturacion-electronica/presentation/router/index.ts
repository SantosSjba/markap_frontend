import type { RouteRecordRaw } from 'vue-router'

export const contabilidadFacturacionElectronicaRoutes: RouteRecordRaw[] = [
  {
    path: 'facturacion-electronica',
    name: 'contabilidad-facturacion-electronica',
    component: () => import('../views/ContabilidadFacturacionElectronicaView.vue'),
    meta: { title: 'Facturación electrónica' },
  },
]
