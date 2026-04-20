import type { RouteRecordRaw } from 'vue-router'

export const agentesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'alquileres-agentes',
    component: () => import('../views/AgentesView.vue'),
    meta: { title: 'Agentes' },
  },
  {
    path: 'nuevo',
    name: 'alquileres-agentes-nuevo',
    component: () => import('../views/NuevoAgenteView.vue'),
    meta: { title: 'Nuevo Agente' },
  },
  {
    path: ':id/editar',
    name: 'alquileres-agentes-editar',
    component: () => import('../views/EditarAgenteView.vue'),
    meta: { title: 'Editar Agente' },
  },
]
