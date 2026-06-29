import type { RouteRecordRaw } from 'vue-router'

export const contabilidadTesoreriaRoutes: RouteRecordRaw[] = [
  {
    path: '',
    redirect: { name: 'contabilidad-tesoreria-caja' },
  },
  {
    path: 'caja',
    name: 'contabilidad-tesoreria-caja',
    component: () => import('../views/ContabilidadTesoreriaCajaView.vue'),
    meta: { title: 'Caja' },
  },
  {
    path: 'bancos',
    name: 'contabilidad-tesoreria-bancos',
    component: () => import('../views/ContabilidadTesoreriaBancosView.vue'),
    meta: { title: 'Bancos' },
  },
  {
    path: 'movimientos',
    name: 'contabilidad-tesoreria-movimientos',
    component: () => import('../views/ContabilidadTesoreriaMovimientosView.vue'),
    meta: { title: 'Movimientos' },
  },
  {
    path: 'transferencias',
    name: 'contabilidad-tesoreria-transferencias',
    component: () => import('../views/ContabilidadTesoreriaTransferenciasView.vue'),
    meta: { title: 'Transferencias' },
  },
  {
    path: 'conciliaciones',
    name: 'contabilidad-tesoreria-conciliaciones',
    component: () => import('../views/ContabilidadTesoreriaConciliacionesView.vue'),
    meta: { title: 'Conciliaciones' },
  },
]
