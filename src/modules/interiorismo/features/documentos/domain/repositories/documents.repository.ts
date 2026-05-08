import type {
  CreateInteriorDocumentPayload,
  InteriorDocumentRow,
  ListInteriorDocumentsParams,
  ListInteriorDocumentsResponse,
  UpdateInteriorDocumentPayload,
} from '../document.types'

export interface InteriorDocumentsRepository {
  list(params: ListInteriorDocumentsParams): Promise<ListInteriorDocumentsResponse>
  create(payload: CreateInteriorDocumentPayload): Promise<InteriorDocumentRow>
  update(id: string, payload: UpdateInteriorDocumentPayload): Promise<InteriorDocumentRow>
  delete(id: string): Promise<void>
}
