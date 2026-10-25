import type {
  ContabilidadSolPdt621PackageDTO,
  ContabilidadSunatDeclarationLogDTO,
  ContabilidadSolCredentialsDTO,
  UpsertSolCredentialsBody,
} from '../sol.types'
export interface ContabilidadSolRepository {
  getCredentials: () => Promise<{
    credentials: ContabilidadSolCredentialsDTO
    typeLabels: Record<string, string>
    statusLabels: Record<string, string>
    manualInstructions: string[]
  }>
  saveCredentials: (body: UpsertSolCredentialsBody) => Promise<unknown>
  listDeclarations: (params: { periodId?: string; declarationType?: string }) => Promise<{
    logs: ContabilidadSunatDeclarationLogDTO[]
    latest: ContabilidadSunatDeclarationLogDTO | null
    typeLabels: Record<string, string>
    statusLabels: Record<string, string>
  }>
  preparePdt621: (periodId: string) => Promise<ContabilidadSolPdt621PackageDTO>
  markManualPending: (logId: string, periodId: string) => Promise<unknown>
  submitPdt621: (
    logId: string,
    periodId: string,
  ) => Promise<{ log: ContabilidadSunatDeclarationLogDTO; mode: string }>
  preparePlame: (periodId: string) => Promise<unknown>
  downloadPackage: (logId: string) => Promise<void>
}
