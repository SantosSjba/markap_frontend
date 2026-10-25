import { createServiceKey } from './service-key'
export interface AgentOption {
  id: string
  fullName: string
}
export interface AgentDirectoryFilters {
  applicationSlug?: string
  limit?: number
  page?: number
  search?: string
  isActive?: boolean
}
export interface CurrencyOption {
  id: string
  code: string
  name: string
  symbol: string
}
export interface DirectoryPort {
  listAgents(filters: AgentDirectoryFilters): Promise<{ data: AgentOption[] }>
  listCurrencies(): Promise<CurrencyOption[]>
}
export const DIRECTORY = createServiceKey<DirectoryPort>('shared.directory')
