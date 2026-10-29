export const INTERIOR_DOCUMENT_NAV = [
  { segment: 'contratos', docType: 'CONTRATO' as const, label: 'Contratos', icon: 'lucide:file-signature' },
  { segment: 'planos', docType: 'PLANO' as const, label: 'Planos', icon: 'lucide:drafting-compass' },
  { segment: 'renderizados', docType: 'RENDERIZADO' as const, label: 'Renderizados', icon: 'lucide:image' },
  { segment: 'pdfs', docType: 'PDF' as const, label: 'PDFs', icon: 'lucide:file-text' },
  { segment: 'facturas', docType: 'FACTURA' as const, label: 'Facturas', icon: 'lucide:receipt' },
  { segment: 'actas', docType: 'ACTA' as const, label: 'Actas', icon: 'lucide:clipboard-check' },
] as const

export const DOCUMENT_TYPE_FORM_OPTIONS = INTERIOR_DOCUMENT_NAV.map((item) => ({
  value: item.docType,
  label: item.label,
}))

export const DOCUMENT_TYPE_LABELS = Object.fromEntries(
  INTERIOR_DOCUMENT_NAV.map((i) => [i.docType, i.label.replace(/s$/, '')]),
) as Record<(typeof INTERIOR_DOCUMENT_NAV)[number]['docType'], string>
