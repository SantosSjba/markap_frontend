import type { RouteRecordRaw } from 'vue-router'

export const arquitecturaMaterialesCatalogoRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'arquitectura-materiales-catalogo',
    component: () => import('../views/ArquitecturaMaterialesCatalogoListView.vue'),
    meta: { title: 'Catálogo de materiales' },
  },
  {
    path: 'nuevo',
    name: 'arquitectura-materiales-catalogo-nuevo',
    component: () => import('../views/ArquitecturaMaterialCatalogoNuevoView.vue'),
    meta: { title: 'Nuevo material' },
  },
  {
    path: ':id',
    name: 'arquitectura-materiales-catalogo-detalle',
    component: () => import('../views/ArquitecturaMaterialCatalogoDetalleView.vue'),
    meta: { title: 'Material' },
  },
]

export const arquitecturaMaterialesProveedoresRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'arquitectura-materiales-proveedores',
    component: () => import('../views/ArquitecturaProveedoresListView.vue'),
    meta: { title: 'Proveedores' },
  },
  {
    path: 'nuevo',
    name: 'arquitectura-materiales-proveedores-nuevo',
    component: () => import('../views/ArquitecturaProveedorNuevoView.vue'),
    meta: { title: 'Nuevo proveedor' },
  },
  {
    path: ':id',
    name: 'arquitectura-materiales-proveedores-detalle',
    component: () => import('../views/ArquitecturaProveedorDetalleView.vue'),
    meta: { title: 'Proveedor' },
  },
]
