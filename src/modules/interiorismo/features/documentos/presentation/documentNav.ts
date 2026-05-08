export const INTERIOR_DOCUMENT_NAV = [
  { segment: 'contratos', docType: 'CONTRATO' as const, label: 'Contratos' },
  { segment: 'pdfs', docType: 'PDF' as const, label: 'PDFs' },
  { segment: 'renderizados', docType: 'RENDERIZADO' as const, label: 'Renderizados' },
  { segment: 'planos', docType: 'PLANO' as const, label: 'Planos' },
  { segment: 'facturas', docType: 'FACTURA' as const, label: 'Facturas' },
  { segment: 'actas', docType: 'ACTA' as const, label: 'Actas' },
] as const

export const DOCUMENT_TYPE_FORM_OPTIONS = INTERIOR_DOCUMENT_NAV.map((item) => ({
  value: item.docType,
  label: item.label,
}))
