import type { RouteRecordRaw } from 'vue-router'
import VentasLayout from '../views/VentasLayout.vue'
import SectionLayout from '@app/layouts/SectionLayout.vue'
import { VENTAS_BASE_PATH } from '../../config/routes.constants'
import { ventasAgentesRoutes } from '../../features/agentes/presentation/router/index'
import { ventasClientesRoutes } from '../../features/clientes/presentation/router/index'
import { ventasPropiedadesRoutes } from '../../features/propiedades/presentation/router/index'
import {
  ventasSalesProcesosRoutes,
  ventasSalesSeparacionesRoutes,
  ventasSalesCierresRoutes,
} from '../../features/ventas-sales/presentation/router/index'
import { ventasFinanzasComisionesRoutes } from '../../features/ventas-finanzas/presentation/router/index'
import { ventasReportesRoutes } from '../../features/ventas-reportes/presentation/router/index'
import { ventasConfiguracionRoutes } from '../../features/ventas-configuracion/presentation/router/index'
export const ventasRoutes: RouteRecordRaw[] = [
  {
    path: VENTAS_BASE_PATH,
    component: VentasLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ventas-home',
        component: () => import('../views/VentasHomeView.vue'),
        meta: { title: 'Ventas' },
      },
      {
        path: 'perfil',
        name: 'ventas-perfil',
        component: () => import('../views/VentasPerfilView.vue'),
        meta: { title: 'Mi Perfil' },
      },
      {
        path: 'clientes',
        component: SectionLayout,
        meta: { title: 'Clientes' },
        children: ventasClientesRoutes,
      },
      {
        path: 'propiedades',
        component: SectionLayout,
        meta: { title: 'Propiedades' },
        children: ventasPropiedadesRoutes,
      },
      {
        path: 'agentes',
        component: SectionLayout,
        meta: { title: 'Agentes' },
        children: ventasAgentesRoutes,
      },
      {
        path: 'procesos',
        component: SectionLayout,
        meta: { title: 'Procesos de Venta' },
        children: ventasSalesProcesosRoutes,
      },
      {
        path: 'separaciones',
        component: SectionLayout,
        meta: { title: 'Separaciones' },
        children: ventasSalesSeparacionesRoutes,
      },
      {
        path: 'cierres',
        component: SectionLayout,
        meta: { title: 'Cierres' },
        children: ventasSalesCierresRoutes,
      },
      {
        path: 'comisiones',
        component: SectionLayout,
        meta: { title: 'Comisiones' },
        children: ventasFinanzasComisionesRoutes,
      },
      {
        path: 'reportes',
        component: SectionLayout,
        meta: { title: 'Reportes' },
        children: ventasReportesRoutes,
      },
      {
        path: 'configuracion',
        component: SectionLayout,
        meta: { title: 'Configuración' },
        children: ventasConfiguracionRoutes,
      },
    ],
  },
]
