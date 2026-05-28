import type { RouteRecordRaw } from 'vue-router'
import VentasLayout from '../views/VentasLayout.vue'
import { SectionLayout } from '@layouts'
import { VENTAS_BASE_PATH } from '../../config/routes.constants'
import { ventasAgentesRoutes } from '@modules/ventas/features/agentes'
import { ventasClientesRoutes } from '@modules/ventas/features/clientes'
import { ventasPropiedadesRoutes } from '@modules/ventas/features/propiedades'
import {
  ventasSalesProcesosRoutes,
  ventasSalesSeparacionesRoutes,
  ventasSalesCierresRoutes,
} from '@ventas/sales'
import { ventasFinanzasComisionesRoutes } from '@ventas/finanzas'
import { ventasReportesRoutes } from '@ventas/reportes'
import { ventasConfiguracionRoutes } from '@ventas/configuracion'

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
