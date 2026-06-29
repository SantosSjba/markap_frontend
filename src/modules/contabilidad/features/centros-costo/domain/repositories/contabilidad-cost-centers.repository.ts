import type {
  ContabilidadCostCenterDTO,
  CreateContabilidadCostCenterBody,
  UpdateContabilidadCostCenterBody,
} from '../cost-center.types'

export interface ContabilidadCostCentersRepository {
  list(search?: string): Promise<ContabilidadCostCenterDTO[]>
  create(body: CreateContabilidadCostCenterBody): Promise<ContabilidadCostCenterDTO>
  update(id: string, body: UpdateContabilidadCostCenterBody): Promise<ContabilidadCostCenterDTO>
  deactivate(id: string): Promise<ContabilidadCostCenterDTO>
}
