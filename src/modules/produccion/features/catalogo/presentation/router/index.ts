import type { RouteRecordRaw } from 'vue-router'

export const produccionCatalogoRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'produccion-catalogo',
    component: () => import('../views/ProduccionCatalogoListView.vue'),
    meta: { title: 'Catálogo' },
  },
  {
    path: 'nuevo',
    name: 'produccion-catalogo-nuevo',
    component: () => import('../views/ProduccionCatalogoNuevoView.vue'),
    meta: { title: 'Nuevo mueble' },
  },
  {
    path: ':id',
    name: 'produccion-catalogo-detalle',
    component: () => import('../views/ProduccionCatalogoDetalleView.vue'),
    meta: { title: 'Mueble' },
  },
]
