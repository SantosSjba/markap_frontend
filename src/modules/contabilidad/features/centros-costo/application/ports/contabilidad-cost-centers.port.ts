import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadCostCentersRepository } from '../../domain/repositories/contabilidad-cost-centers.repository'
export const contabilidadCostCentersRepositoryKey =
  createServiceKey<ContabilidadCostCentersRepository>(
    'contabilidad.features.centros-costo.contabilidad-cost-centers',
  )
