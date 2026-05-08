import type { RouteRecordRaw } from 'vue-router'

export const interiorismoMaterialesCatalogoRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'interiorismo-materiales-catalogo',
    component: () => import('../views/InteriorismoMaterialesCatalogoListView.vue'),
    meta: { title: 'Catálogo de materiales' },
  },
  {
    path: 'nuevo',
    name: 'interiorismo-materiales-catalogo-nuevo',
    component: () => import('../views/InteriorismoMaterialCatalogoNuevoView.vue'),
    meta: { title: 'Nuevo material' },
  },
  {
    path: ':id',
    name: 'interiorismo-materiales-catalogo-detalle',
    component: () => import('../views/InteriorismoMaterialCatalogoDetalleView.vue'),
    meta: { title: 'Material' },
  },
]

export const interiorismoMaterialesProveedoresRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'interiorismo-materiales-proveedores',
    component: () => import('../views/InteriorismoProveedoresListView.vue'),
    meta: { title: 'Proveedores' },
  },
  {
    path: 'nuevo',
    name: 'interiorismo-materiales-proveedores-nuevo',
    component: () => import('../views/InteriorismoProveedorNuevoView.vue'),
    meta: { title: 'Nuevo proveedor' },
  },
  {
    path: ':id',
    name: 'interiorismo-materiales-proveedores-detalle',
    component: () => import('../views/InteriorismoProveedorDetalleView.vue'),
    meta: { title: 'Proveedor' },
  },
]
