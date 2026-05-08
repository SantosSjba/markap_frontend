import type { RouteRecordRaw } from 'vue-router'

export const interiorismoPresupuestosRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'interiorismo-presupuestos',
    component: () => import('../views/InteriorismoPresupuestosListView.vue'),
    meta: { title: 'Listado de presupuestos' },
  },
  {
    path: 'nuevo',
    name: 'interiorismo-presupuestos-nuevo',
    component: () => import('../views/InteriorismoPresupuestoNuevoView.vue'),
    meta: { title: 'Nuevo presupuesto' },
  },
  {
    path: ':id',
    name: 'interiorismo-presupuestos-detalle',
    component: () => import('../views/InteriorismoPresupuestoDetalleView.vue'),
    meta: { title: 'Presupuesto' },
  },
]
