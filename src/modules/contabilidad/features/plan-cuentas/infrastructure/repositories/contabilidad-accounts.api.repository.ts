import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_ACCOUNTS_APP_SLUG } from '../../domain/account.types'
import type {
  ContabilidadAccountDTO,
  ContabilidadAccountsTreeResponse,
} from '../../domain/account.types'
import type { ContabilidadAccountsRepository } from '../../domain/repositories/contabilidad-accounts.repository'

const scope = { applicationSlug: CONTABILIDAD_ACCOUNTS_APP_SLUG } as const

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const contabilidadAccountsApiRepository: ContabilidadAccountsRepository = {
  listTree: (search) =>
    apiClient
      .get<ContabilidadAccountsTreeResponse>(`/contabilidad-accounts/tree?${qs({ ...scope, search })}`)
      .then((r) => r.data),

  getById: (id) =>
    apiClient
      .get<ContabilidadAccountDTO>(`/contabilidad-accounts/${id}?${qs({ ...scope })}`)
      .then((r) => r.data),

  create: (body) =>
    apiClient
      .post<ContabilidadAccountDTO>(`/contabilidad-accounts?${qs({ ...scope })}`, body)
      .then((r) => r.data),

  update: (id, body) =>
    apiClient
      .patch<ContabilidadAccountDTO>(`/contabilidad-accounts/${id}?${qs({ ...scope })}`, body)
      .then((r) => r.data),

  deactivate: (id) =>
    apiClient
      .patch<ContabilidadAccountDTO>(`/contabilidad-accounts/${id}/deactivate?${qs({ ...scope })}`)
      .then((r) => r.data),
}
