import type { RouteRecordRaw } from 'vue-router'

export const contabilidadAuditoriaRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'contabilidad-auditoria',
    component: () => import('../views/ContabilidadAuditoriaView.vue'),
    meta: { title: 'Auditoría contable' },
  },
]
