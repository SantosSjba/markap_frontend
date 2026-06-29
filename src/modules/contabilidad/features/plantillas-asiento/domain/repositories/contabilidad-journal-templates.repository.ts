import type {
  ContabilidadJournalTemplateDTO,
  CreateJournalTemplateBody,
  UpdateJournalTemplateBody,
} from '../journal-template.types'

export interface ContabilidadJournalTemplatesRepository {
  listTemplates(): Promise<{ templates: ContabilidadJournalTemplateDTO[] }>
  createTemplate(body: CreateJournalTemplateBody): Promise<ContabilidadJournalTemplateDTO>
  updateTemplate(id: string, body: UpdateJournalTemplateBody): Promise<ContabilidadJournalTemplateDTO>
}
