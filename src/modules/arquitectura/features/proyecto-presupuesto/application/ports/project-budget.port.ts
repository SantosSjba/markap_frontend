import { createServiceKey } from '@shared/application/ports/service-key'
import type { ProjectBudgetRepository } from '../../domain/repositories/project-budget.repository'
export const projectBudgetRepositoryKey = createServiceKey<ProjectBudgetRepository>(
  'arquitectura.features.proyecto-presupuesto.project-budget',
)
