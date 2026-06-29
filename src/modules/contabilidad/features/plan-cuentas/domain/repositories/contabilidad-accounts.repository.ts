import type {
  ContabilidadAccountDTO,
  ContabilidadAccountsTreeResponse,
  CreateContabilidadAccountBody,
  UpdateContabilidadAccountBody,
} from '../account.types'

export interface ContabilidadAccountsRepository {
  listTree(search?: string): Promise<ContabilidadAccountsTreeResponse>
  getById(id: string): Promise<ContabilidadAccountDTO>
  create(body: CreateContabilidadAccountBody): Promise<ContabilidadAccountDTO>
  update(id: string, body: UpdateContabilidadAccountBody): Promise<ContabilidadAccountDTO>
  deactivate(id: string): Promise<ContabilidadAccountDTO>
}
