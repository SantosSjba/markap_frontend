import type {
  DirectoryPort,
  AgentDirectoryFilters,
  CurrencyOption,
  AgentOption,
} from '../../application/ports/directory.port'
import { apiClient } from './api-client'
export const directoryApiAdapter: DirectoryPort = {
  listAgents: (params: AgentDirectoryFilters) =>
    apiClient.get<{ data: AgentOption[] }>('/agents', { params }).then((response) => response.data),
  listCurrencies: () =>
    apiClient.get<CurrencyOption[]>('/properties/currencies').then((response) => response.data),
}
