export const ARQUITECTURA_DOCUMENT_NAV = [
  { segment: 'contratos', docType: 'CONTRATO' as const, label: 'Contratos' },
  { segment: 'planos', docType: 'PLANO' as const, label: 'Planos' },
  { segment: 'renders', docType: 'RENDER' as const, label: 'Renders' },
  { segment: 'memoria-descriptiva', docType: 'MEMORIA_DESCRIPTIVA' as const, label: 'Memoria descriptiva' },
  { segment: 'facturas', docType: 'FACTURA' as const, label: 'Facturas' },
  { segment: 'actas', docType: 'ACTA' as const, label: 'Actas' },
] as const

export const DOCUMENT_TYPE_FORM_OPTIONS = ARQUITECTURA_DOCUMENT_NAV.map((item) => ({
  value: item.docType,
  label: item.label,
}))
