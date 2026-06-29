export const CONTABILIDAD_CPE_LOG_APP_SLUG = 'contabilidad'

export const CPE_DOCUMENT_KIND_OPTIONS = [
  { value: 'FACTURA', label: 'Factura' },
  { value: 'BOLETA', label: 'Boleta' },
  { value: 'NOTA_CREDITO', label: 'Nota de crédito' },
  { value: 'NOTA_DEBITO', label: 'Nota de débito' },
  { value: 'OTRO', label: 'Otro' },
] as const

export const CPE_SUNAT_STATUS_OPTIONS = [
  { value: 'REGISTERED', label: 'Registrado local' },
  { value: 'SENT', label: 'Enviado' },
  { value: 'ACCEPTED', label: 'Aceptado' },
  { value: 'REJECTED', label: 'Rechazado' },
] as const

export interface ContabilidadCpeLogDTO {
  id: string
  periodId: string | null
  documentKind: string
  documentRef: string
  sunatStatus: string
  xmlHash: string | null
  cdrReference: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCpeLogBody {
  periodId?: string | null
  documentKind: string
  documentRef: string
  sunatStatus?: string
  xmlHash?: string | null
  cdrReference?: string | null
  notes?: string | null
}
