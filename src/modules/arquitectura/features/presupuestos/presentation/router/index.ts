import type { RouteRecordRaw } from 'vue-router'

export const arquitecturaPresupuestosRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'arquitectura-presupuestos',
    component: () => import('../views/ArquitecturaPresupuestosListView.vue'),
    meta: { title: 'Listado de presupuestos' },
  },
  {
    path: 'nuevo',
    name: 'arquitectura-presupuestos-nuevo',
    component: () => import('../views/ArquitecturaPresupuestoNuevoView.vue'),
    meta: { title: 'Nuevo presupuesto' },
  },
]
