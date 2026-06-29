import type {
  ContabilidadJournalDetailResponse,
  ContabilidadJournalEntryDetailDTO,
  ContabilidadJournalListResponse,
  CreateContabilidadJournalBody,
  ListContabilidadJournalParams,
  UpdateContabilidadJournalBody,
} from '../journal.types'

export interface ContabilidadJournalRepository {
  list(params: ListContabilidadJournalParams): Promise<ContabilidadJournalListResponse>
  getById(id: string): Promise<ContabilidadJournalDetailResponse>
  create(body: CreateContabilidadJournalBody): Promise<ContabilidadJournalEntryDetailDTO>
  update(id: string, body: UpdateContabilidadJournalBody): Promise<ContabilidadJournalEntryDetailDTO>
  deleteDraft(id: string): Promise<void>
  post(id: string): Promise<ContabilidadJournalEntryDetailDTO>
  reverse(id: string): Promise<ContabilidadJournalEntryDetailDTO>
}
