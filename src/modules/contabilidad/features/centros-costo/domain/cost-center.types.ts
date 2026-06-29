export interface ContabilidadCostCenterDTO {
  id: string
  parentId: string | null
  code: string
  name: string
  isActive: boolean
}

export interface CreateContabilidadCostCenterBody {
  code: string
  name: string
  parentId?: string | null
}

export interface UpdateContabilidadCostCenterBody {
  code?: string
  name?: string
  parentId?: string | null
  isActive?: boolean
}
