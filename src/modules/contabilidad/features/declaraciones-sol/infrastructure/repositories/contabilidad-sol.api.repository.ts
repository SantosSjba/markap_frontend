import { getContabilidadApiScope } from '@modules/contabilidad/config/api-scope'
import { apiClient } from '@core/api/apiClient'
import { downloadBlobFile } from '@modules/contabilidad/features/libros-e/domain/ple.types'
import type {
  ContabilidadSolPdt621PackageDTO,
  ContabilidadSunatDeclarationLogDTO,
  ContabilidadSolCredentialsDTO,
  UpsertSolCredentialsBody,
} from '../../domain/sol.types'

function qs(extra?: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries({ ...getContabilidadApiScope(), ...extra }).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const contabilidadSolApiRepository = {
  getCredentials: () =>
    apiClient
      .get<{
        credentials: ContabilidadSolCredentialsDTO
        typeLabels: Record<string, string>
        statusLabels: Record<string, string>
        manualInstructions: string[]
      }>(`/contabilidad-sol/credentials?${qs()}`)
      .then((r) => r.data),

  saveCredentials: (body: UpsertSolCredentialsBody) =>
    apiClient.put(`/contabilidad-sol/credentials?${qs()}`, body).then((r) => r.data),

  listDeclarations: (params: { periodId?: string; declarationType?: string }) =>
    apiClient
      .get<{
        logs: ContabilidadSunatDeclarationLogDTO[]
        latest: ContabilidadSunatDeclarationLogDTO | null
        typeLabels: Record<string, string>
        statusLabels: Record<string, string>
      }>(`/contabilidad-sol/declarations?${qs(params)}`)
      .then((r) => r.data),

  preparePdt621: (periodId: string) =>
    apiClient
      .post<ContabilidadSolPdt621PackageDTO>(`/contabilidad-sol/pdt621/prepare?${qs({ periodId })}`)
      .then((r) => r.data),

  markManualPending: (logId: string, periodId: string) =>
    apiClient
      .post(`/contabilidad-sol/pdt621/${logId}/manual-pending?${qs({ periodId })}`)
      .then((r) => r.data),

  submitPdt621: (logId: string, periodId: string) =>
    apiClient
      .post<{ log: ContabilidadSunatDeclarationLogDTO; mode: string }>(
        `/contabilidad-sol/pdt621/${logId}/submit?${qs({ periodId })}`,
      )
      .then((r) => r.data),

  preparePlame: (periodId: string) =>
    apiClient.post(`/contabilidad-sol/plame/prepare?${qs({ periodId })}`).then((r) => r.data),

  async downloadPackage(logId: string) {
    const response = await apiClient.get<Blob>(`/contabilidad-sol/declarations/${logId}/package?${qs()}`, {
      responseType: 'blob',
    })
    const disposition = response.headers['content-disposition'] ?? response.headers['Content-Disposition']
    const match = typeof disposition === 'string' ? disposition.match(/filename="?([^"]+)"?/) : null
    downloadBlobFile(match?.[1] ?? `${logId}.json`, response.data)
  },
}
