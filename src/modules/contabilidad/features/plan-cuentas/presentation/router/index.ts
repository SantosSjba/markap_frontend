import type { RouteRecordRaw } from 'vue-router'

export const contabilidadPlanCuentasRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'contabilidad-plan-cuentas',
    component: () => import('../views/ContabilidadPlanCuentasView.vue'),
    meta: { title: 'Plan de cuentas' },
  },
]
