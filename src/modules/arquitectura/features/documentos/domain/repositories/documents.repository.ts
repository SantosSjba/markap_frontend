import type {
  CreateArquitecturaDocumentPayload,
  ArquitecturaDocumentRow,
  ListArquitecturaDocumentsParams,
  ListArquitecturaDocumentsResponse,
  UpdateArquitecturaDocumentPayload,
  UploadArquitecturaDocumentPayload,
} from '../document.types'

export interface ArquitecturaDocumentsRepository {
  list(params: ListArquitecturaDocumentsParams): Promise<ListArquitecturaDocumentsResponse>
  create(payload: CreateArquitecturaDocumentPayload): Promise<ArquitecturaDocumentRow>
  upload(payload: UploadArquitecturaDocumentPayload): Promise<ArquitecturaDocumentRow>
  update(id: string, payload: UpdateArquitecturaDocumentPayload): Promise<ArquitecturaDocumentRow>
  delete(id: string): Promise<void>
  getDownloadUrl(archivoId: string): Promise<string>
}
