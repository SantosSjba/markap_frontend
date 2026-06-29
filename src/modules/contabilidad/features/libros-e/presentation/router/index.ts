import type { RouteRecordRaw } from 'vue-router'

export const contabilidadLibrosERoutes: RouteRecordRaw[] = [
  {
    path: '',
    redirect: { name: 'contabilidad-libros-ple' },
  },
  {
    path: 'ple',
    name: 'contabilidad-libros-ple',
    component: () => import('../views/ContabilidadLibrosPleView.vue'),
    meta: { title: 'Generación PLE' },
  },
  {
    path: 'registro-compras',
    name: 'contabilidad-libros-registro-compras',
    component: () => import('../views/ContabilidadLibrosRegistroComprasView.vue'),
    meta: { title: 'Registro de compras' },
  },
  {
    path: 'registro-ventas',
    name: 'contabilidad-libros-registro-ventas',
    component: () => import('../views/ContabilidadLibrosRegistroVentasView.vue'),
    meta: { title: 'Registro de ventas' },
  },
  {
    path: 'libro-diario',
    name: 'contabilidad-libros-libro-diario',
    redirect: { name: 'contabilidad-asientos-libro-diario' },
  },
  {
    path: 'libro-mayor',
    name: 'contabilidad-libros-libro-mayor',
    component: () => import('../views/ContabilidadLibrosMayorView.vue'),
    meta: { title: 'Libro mayor' },
  },
  {
    path: 'libro-caja',
    name: 'contabilidad-libros-libro-caja',
    component: () => import('../views/ContabilidadLibrosCajaView.vue'),
    meta: { title: 'Libro caja' },
  },
  {
    path: 'libro-bancos',
    name: 'contabilidad-libros-libro-bancos',
    component: () => import('../views/ContabilidadLibrosBancosView.vue'),
    meta: { title: 'Libro bancos' },
  },
]
