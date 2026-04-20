import type { RouteRecordRaw } from 'vue-router'

export const ventasAgentesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-agentes',
    component: () => import('../views/VentasAgentesView.vue'),
    meta: { title: 'Agentes' },
  },
  {
    path: 'nuevo',
    name: 'ventas-agentes-nuevo',
    component: () => import('../views/VentasNuevoAgenteView.vue'),
    meta: { title: 'Nuevo Agente' },
  },
  {
    path: ':id/editar',
    name: 'ventas-agentes-editar',
    component: () => import('../views/VentasEditarAgenteView.vue'),
    meta: { title: 'Editar Agente' },
  },
]
