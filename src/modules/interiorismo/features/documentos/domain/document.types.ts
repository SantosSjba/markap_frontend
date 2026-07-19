export type InteriorDocumentType =
  | 'CONTRATO'
  | 'PDF'
  | 'RENDERIZADO'
  | 'PLANO'
  | 'FACTURA'
  | 'ACTA'

export interface InteriorDocumentRow {
  id: string
  projectId: string
  projectCode: string
  projectName: string
  docType: string
  title: string
  fileUrl: string | null
  archivoId: string | null
  downloadUrl?: string | null
  createdAt: string
}

export interface ListInteriorDocumentsParams {
  page: number
  limit: number
  docType: InteriorDocumentType
  search?: string
  projectId?: string
}

export interface ListInteriorDocumentsResponse {
  data: InteriorDocumentRow[]
  total: number
  page: number
  limit: number
}

export interface CreateInteriorDocumentPayload {
  projectId: string
  docType: InteriorDocumentType
  title: string
  fileUrl?: string | null
}

export interface UploadInteriorDocumentPayload {
  projectId: string
  docType: InteriorDocumentType
  title: string
  file: File
}

export interface UpdateInteriorDocumentPayload {
  title?: string
  fileUrl?: string | null
  docType?: InteriorDocumentType
}
