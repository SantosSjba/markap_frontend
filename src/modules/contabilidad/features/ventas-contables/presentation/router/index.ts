import type { RouteRecordRaw } from 'vue-router'
import { SALES_DOCUMENT_TYPE } from '../../domain/sales.types'

export const contabilidadVentasContablesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    redirect: { name: 'contabilidad-ventas-facturas' },
  },
  {
    path: 'facturas',
    name: 'contabilidad-ventas-facturas',
    component: () => import('../views/ContabilidadVentasComprobantesView.vue'),
    meta: { title: 'Facturas de venta', documentType: SALES_DOCUMENT_TYPE.FACTURA },
  },
  {
    path: 'boletas',
    name: 'contabilidad-ventas-boletas',
    component: () => import('../views/ContabilidadVentasComprobantesView.vue'),
    meta: { title: 'Boletas de venta', documentType: SALES_DOCUMENT_TYPE.BOLETA },
  },
  {
    path: 'notas-credito',
    name: 'contabilidad-ventas-notas-credito',
    component: () => import('../views/ContabilidadVentasNotasCreditoView.vue'),
    meta: { title: 'Notas de crédito' },
  },
  {
    path: 'notas-debito',
    name: 'contabilidad-ventas-notas-debito',
    component: () => import('../views/ContabilidadVentasNotasDebitoView.vue'),
    meta: { title: 'Notas de débito' },
  },
  {
    path: 'clientes',
    name: 'contabilidad-ventas-clientes',
    component: () => import('../views/ContabilidadVentasClientesView.vue'),
    meta: { title: 'Clientes' },
  },
  {
    path: 'cobros',
    name: 'contabilidad-ventas-cobros',
    component: () => import('../views/ContabilidadVentasCobrosView.vue'),
    meta: { title: 'Cobros' },
  },
  {
    path: 'nueva-factura',
    redirect: '/contabilidad/ventas/facturas',
  },
]
