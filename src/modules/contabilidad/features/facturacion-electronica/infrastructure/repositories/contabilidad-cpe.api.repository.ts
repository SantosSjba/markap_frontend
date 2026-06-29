import { getContabilidadApiScope } from '@modules/contabilidad/config/api-scope'
import { apiClient } from '@core/api/apiClient'
import type { ContabilidadCpeRepository } from '../../domain/repositories/contabilidad-cpe.repository'
import type {
  ContabilidadCpeEmitResultDTO,
  ContabilidadCpeProviderConfigResponse,
} from '../../domain/cpe.types'
import { downloadBlobFile } from '@modules/contabilidad/features/libros-e/domain/ple.types'

function qs(extra?: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries({ ...getContabilidadApiScope(), ...extra }).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const contabilidadCpeApiRepository: ContabilidadCpeRepository = {
  getProviderConfig: () =>
    apiClient
      .get<ContabilidadCpeProviderConfigResponse>(`/contabilidad-cpe/provider-config?${qs()}`)
      .then((r) => r.data),

  saveProviderConfig: (body) =>
    apiClient
      .put<ContabilidadCpeProviderConfigResponse>(`/contabilidad-cpe/provider-config?${qs()}`, body)
      .then((r) => r.data),

  emitSalesInvoice: (invoiceId) =>
    apiClient
      .post<ContabilidadCpeEmitResultDTO>(
        `/contabilidad-cpe/emit/sales-invoices/${invoiceId}?${qs()}`,
      )
      .then((r) => r.data),

  async downloadArtifact(logId, kind) {
    const response = await apiClient.get<Blob>(`/contabilidad-cpe/documents/${logId}/${kind}?${qs()}`, {
      responseType: 'blob',
    })
    const disposition = response.headers['content-disposition'] ?? response.headers['Content-Disposition']
    const match = typeof disposition === 'string' ? disposition.match(/filename="?([^"]+)"?/) : null
    const fileName = match?.[1] ?? `${logId}.${kind === 'xml' ? 'xml' : 'cdr.xml'}`
    downloadBlobFile(fileName, response.data)
  },
}
