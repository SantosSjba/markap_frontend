import type {
  ContabilidadAccountDTO,
  ContabilidadAccountsTreeResponse,
  ContabilidadPcgeClassMeta,
  CreateContabilidadAccountBody,
  ImportPcgeResult,
  UpdateContabilidadAccountBody,
} from '../account.types'

export interface ContabilidadAccountsRepository {
  listTree(search?: string): Promise<ContabilidadAccountsTreeResponse>
  getPcgeClasses(): Promise<{ classes: ContabilidadPcgeClassMeta[] }>
  importPcge(classes: string): Promise<ImportPcgeResult>
  getById(id: string): Promise<ContabilidadAccountDTO>
  create(body: CreateContabilidadAccountBody): Promise<ContabilidadAccountDTO>
  update(id: string, body: UpdateContabilidadAccountBody): Promise<ContabilidadAccountDTO>
  deactivate(id: string): Promise<ContabilidadAccountDTO>
}
