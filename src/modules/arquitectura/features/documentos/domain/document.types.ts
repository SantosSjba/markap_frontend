export type ArquitecturaDocumentType =
  | 'CONTRATO'
  | 'PLANO'
  | 'RENDER'
  | 'MEMORIA_DESCRIPTIVA'
  | 'FACTURA'
  | 'ACTA'

export interface ArquitecturaDocumentRow {
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

export interface ListArquitecturaDocumentsParams {
  page: number
  limit: number
  docType: ArquitecturaDocumentType
  search?: string
  projectId?: string
}

export interface ListArquitecturaDocumentsResponse {
  data: ArquitecturaDocumentRow[]
  total: number
  page: number
  limit: number
}

export interface CreateArquitecturaDocumentPayload {
  projectId: string
  docType: ArquitecturaDocumentType
  title: string
  fileUrl?: string | null
}

export interface UploadArquitecturaDocumentPayload {
  projectId: string
  docType: ArquitecturaDocumentType
  title: string
  file: File
}

export interface UpdateArquitecturaDocumentPayload {
  title?: string
  fileUrl?: string | null
  docType?: ArquitecturaDocumentType
}
