import type { RouteRecordRaw } from 'vue-router'
/**
 * Rutas bajo `/interiorismo/equipo` (SectionLayout).
 */
export const interiorismoEquipoRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'interiorismo-equipo',
    component: () => import('../views/InteriorismoEquipoView.vue'),
    meta: { title: 'Equipo' },
  },
  {
    path: 'nuevo',
    name: 'interiorismo-equipo-nuevo',
    component: () => import('../views/InteriorismoNuevoIntegranteView.vue'),
    meta: { title: 'Nuevo integrante' },
  },
  {
    path: ':id/editar',
    name: 'interiorismo-equipo-editar',
    component: () => import('../views/InteriorismoEditarIntegranteView.vue'),
    meta: { title: 'Editar integrante' },
  },
]
