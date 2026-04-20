import type { RouteRecordRaw } from 'vue-router'
import VentasLayout from '../views/VentasLayout.vue'
import { SectionLayout } from '@widgets'
import { ventasAgentesRoutes } from '@applications/ventas/agentes/router'

export const ventasRoutes: RouteRecordRaw[] = [
  {
    path: '/ventas',
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
        children: [
          {
            path: '',
            name: 'ventas-clientes',
            component: () => import('../clientes/views/VentasClientesView.vue'),
            meta: { title: 'Listado de Clientes' },
          },
          {
            path: 'propietarios',
            name: 'ventas-clientes-propietarios',
            component: () => import('../clientes/views/VentasClientesView.vue'),
            meta: { title: 'Propietarios' },
          },
          {
            path: 'nuevo',
            name: 'ventas-clientes-nuevo',
            component: () => import('../clientes/views/VentasNuevoClienteView.vue'),
            meta: { title: 'Nuevo Cliente' },
          },
          {
            path: ':id/editar',
            name: 'ventas-clientes-editar',
            component: () => import('../clientes/views/VentasEditarClienteView.vue'),
            meta: { title: 'Editar Cliente' },
          },
        ],
      },
      {
        path: 'propiedades',
        component: SectionLayout,
        meta: { title: 'Propiedades' },
        children: [
          {
            path: '',
            name: 'ventas-propiedades',
            component: () => import('../propiedades/views/VentasPropiedadesView.vue'),
            meta: { title: 'Listado de Propiedades' },
          },
          {
            path: 'nueva',
            name: 'ventas-propiedades-nueva',
            component: () => import('../propiedades/views/VentasNuevaPropiedadView.vue'),
            meta: { title: 'Nueva Propiedad' },
          },
          {
            path: ':id/editar',
            name: 'ventas-propiedades-editar',
            component: () => import('../propiedades/views/VentasEditarPropiedadView.vue'),
            meta: { title: 'Editar Propiedad' },
          },
        ],
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
        children: [
          {
            path: '',
            name: 'ventas-procesos',
            component: () => import('../ventas-sales/views/VentasProcesosView.vue'),
            meta: { title: 'Procesos de Venta' },
          },
          {
            path: 'pipeline',
            name: 'ventas-procesos-pipeline',
            component: () => import('../ventas-sales/views/VentasPipelineView.vue'),
            meta: { title: 'Pipeline de ventas' },
          },
          {
            path: ':id',
            name: 'ventas-proceso-detalle',
            component: () => import('../ventas-sales/views/VentasProcesoDetalleView.vue'),
            meta: { title: 'Detalle proceso' },
          },
        ],
      },
      {
        path: 'separaciones',
        component: SectionLayout,
        meta: { title: 'Separaciones' },
        children: [
          {
            path: '',
            name: 'ventas-separaciones',
            component: () => import('../ventas-sales/views/VentasSeparacionesView.vue'),
            meta: { title: 'Separaciones' },
          },
        ],
      },
      {
        path: 'cierres',
        component: SectionLayout,
        meta: { title: 'Cierres' },
        children: [
          {
            path: '',
            name: 'ventas-cierres',
            component: () => import('../ventas-sales/views/VentasCierresView.vue'),
            meta: { title: 'Cierres' },
          },
        ],
      },
      {
        path: 'pagos',
        component: SectionLayout,
        meta: { title: 'Pagos' },
        children: [
          {
            path: '',
            name: 'ventas-pagos',
            component: () => import('../ventas-finanzas/views/VentasPagosView.vue'),
            meta: { title: 'Pagos' },
          },
        ],
      },
      {
        path: 'comisiones',
        component: SectionLayout,
        meta: { title: 'Comisiones' },
        children: [
          {
            path: '',
            name: 'ventas-comisiones',
            component: () => import('../ventas-finanzas/views/VentasComisionesView.vue'),
            meta: { title: 'Comisiones' },
          },
        ],
      },
      {
        path: 'costos-documentacion',
        component: SectionLayout,
        meta: { title: 'Costos de Documentación' },
        children: [
          {
            path: '',
            name: 'ventas-costos-documentacion',
            component: () => import('../ventas-finanzas/views/VentasCostosDocumentacionView.vue'),
            meta: { title: 'Costos de Documentación' },
          },
        ],
      },
      {
        path: 'reportes',
        component: SectionLayout,
        meta: { title: 'Reportes' },
        children: [
          {
            path: '',
            name: 'ventas-reportes',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Reportes' },
          },
        ],
      },
      {
        path: 'configuracion',
        component: SectionLayout,
        meta: { title: 'Configuración' },
        children: [
          {
            path: '',
            name: 'ventas-configuracion',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Configuración' },
          },
        ],
      },
    ],
  },
]
