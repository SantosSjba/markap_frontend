import type { RouteRecordRaw } from 'vue-router'
import { INTERIOR_DOCUMENT_NAV } from '../documentNav'
export const interiorismoDocumentosRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'interiorismo-documentos',
    component: () => import('../views/InteriorismoDocumentosView.vue'),
    meta: { title: 'Documentos' },
  },
  // Antes había una pantalla por tipo: ahora es la vista única filtrada por `?type=`
  ...INTERIOR_DOCUMENT_NAV.map((item) => ({
    path: item.segment,
    name: `interiorismo-documentos-${item.segment}`,
    redirect: { name: 'interiorismo-documentos', query: { type: item.docType } },
  })),
]
