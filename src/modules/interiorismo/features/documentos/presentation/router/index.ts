import type { RouteRecordRaw } from 'vue-router'
import { INTERIOR_DOCUMENT_NAV } from '../documentNav'

export const interiorismoDocumentosRoutes: RouteRecordRaw[] = INTERIOR_DOCUMENT_NAV.map((item) => ({
  path: item.segment,
  name: `interiorismo-documentos-${item.segment}`,
  component: () => import('../views/InteriorismoDocumentosCategoryView.vue'),
  meta: { title: item.label, docType: item.docType },
}))
