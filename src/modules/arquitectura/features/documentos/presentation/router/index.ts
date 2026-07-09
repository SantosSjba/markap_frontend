import type { RouteRecordRaw } from 'vue-router'
import { ARQUITECTURA_DOCUMENT_NAV } from '../documentNav'

export const arquitecturaDocumentosRoutes: RouteRecordRaw[] = ARQUITECTURA_DOCUMENT_NAV.map((item) => ({
  path: item.segment,
  name: `arquitectura-documentos-${item.segment}`,
  component: () => import('../views/ArquitecturaDocumentosCategoryView.vue'),
  meta: { title: item.label, docType: item.docType },
}))
