import type { RouteRecordRaw } from 'vue-router'

export const ventasConfiguracionRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-configuracion',
    component: () => import('../views/VentasConfiguracionView.vue'),
    meta: { title: 'Configuración' },
  },
]
