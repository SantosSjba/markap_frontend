import type { RouteRecordRaw } from 'vue-router'

export const arquitecturaProyectosRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'arquitectura-proyectos',
    component: () => import('../views/ArquitecturaProyectosListView.vue'),
    meta: { title: 'Listado de proyectos', inProgressOnly: false },
  },
  {
    path: 'nuevo',
    name: 'arquitectura-proyectos-nuevo',
    component: () => import('../views/ArquitecturaProyectoNuevoView.vue'),
    meta: { title: 'Nuevo proyecto' },
  },
  {
    path: 'en-ejecucion',
    name: 'arquitectura-proyectos-en-ejecucion',
    component: () => import('../views/ArquitecturaProyectosListView.vue'),
    meta: { title: 'En ejecución', inProgressOnly: true },
  },
  {
    path: ':id/editar',
    name: 'arquitectura-proyectos-editar',
    component: () => import('../views/ArquitecturaProyectoEditarView.vue'),
    meta: { title: 'Editar proyecto' },
  },
  {
    path: ':id',
    name: 'arquitectura-proyectos-detalle',
    component: () => import('../views/ArquitecturaProyectoDetalleView.vue'),
    meta: { title: 'Proyecto' },
  },
]
