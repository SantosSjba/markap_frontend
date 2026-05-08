import type { RouteRecordRaw } from 'vue-router'

export const interiorismoProyectosRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'interiorismo-proyectos',
    component: () => import('../views/InteriorismoProyectosListView.vue'),
    meta: { title: 'Listado de proyectos', inProgressOnly: false },
  },
  {
    path: 'nuevo',
    name: 'interiorismo-proyectos-nuevo',
    component: () => import('../views/InteriorismoProyectoNuevoView.vue'),
    meta: { title: 'Nuevo proyecto' },
  },
  {
    path: 'en-progreso',
    name: 'interiorismo-proyectos-en-progreso',
    component: () => import('../views/InteriorismoProyectosListView.vue'),
    meta: { title: 'En progreso', inProgressOnly: true },
  },
  {
    path: ':id/editar',
    name: 'interiorismo-proyectos-editar',
    component: () => import('../views/InteriorismoProyectoEditarView.vue'),
    meta: { title: 'Editar proyecto' },
  },
  {
    path: ':id',
    name: 'interiorismo-proyectos-detalle',
    component: () => import('../views/InteriorismoProyectoDetalleView.vue'),
    meta: { title: 'Proyecto' },
  },
]
