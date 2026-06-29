import type { RouteRecordRaw } from 'vue-router'

export const contabilidadTributosRoutes: RouteRecordRaw[] = [
  {
    path: '',
    redirect: { name: 'contabilidad-tributos-igv' },
  },
  {
    path: 'igv',
    name: 'contabilidad-tributos-igv',
    component: () => import('../views/ContabilidadTributosIgvView.vue'),
    meta: { title: 'IGV' },
  },
  {
    path: 'detracciones',
    name: 'contabilidad-tributos-detracciones',
    component: () => import('../views/ContabilidadTributosDetraccionesView.vue'),
    meta: { title: 'Detracciones' },
  },
  {
    path: 'retenciones',
    name: 'contabilidad-tributos-retenciones',
    component: () => import('../views/ContabilidadTributosRetencionesView.vue'),
    meta: { title: 'Retenciones' },
  },
  {
    path: 'percepciones',
    name: 'contabilidad-tributos-percepciones',
    component: () => import('../views/ContabilidadTributosPercepcionesView.vue'),
    meta: { title: 'Percepciones' },
  },
]
