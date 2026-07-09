import type {
  CreateArquitecturaDocumentPayload,
  ArquitecturaDocumentRow,
  ListArquitecturaDocumentsParams,
  ListArquitecturaDocumentsResponse,
  UpdateArquitecturaDocumentPayload,
} from '../document.types'

export interface ArquitecturaDocumentsRepository {
  list(params: ListArquitecturaDocumentsParams): Promise<ListArquitecturaDocumentsResponse>
  create(payload: CreateArquitecturaDocumentPayload): Promise<ArquitecturaDocumentRow>
  update(id: string, payload: UpdateArquitecturaDocumentPayload): Promise<ArquitecturaDocumentRow>
  delete(id: string): Promise<void>
}
