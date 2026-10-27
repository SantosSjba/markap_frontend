export const VENTAS_CONFIG_APP_SLUG = 'ventas' as const

export interface VentasPipelineStageDTO {
  code: string
  label: string
  sortOrder: number
  isActive: boolean
}

export interface VentasConfigBootstrap {
  pipelineStages: VentasPipelineStageDTO[]
}

/** Categorías del catálogo de bancos y medios de pago */
export type FinancingChannelCategory = 'BANK' | 'PAYMENT_METHOD' | 'OWN_FUNDS' | 'OTHER'

export const FINANCING_CHANNEL_CATEGORIES: { value: FinancingChannelCategory; label: string; icon: string }[] = [
  { value: 'BANK', label: 'Bancos', icon: 'lucide:landmark' },
  { value: 'PAYMENT_METHOD', label: 'Medios de pago', icon: 'lucide:credit-card' },
  { value: 'OWN_FUNDS', label: 'Fondos propios', icon: 'lucide:piggy-bank' },
  { value: 'OTHER', label: 'Otros', icon: 'lucide:circle-ellipsis' },
]

export interface VentasFinancingChannel {
  id: string
  category: FinancingChannelCategory
  code: string
  name: string
  sortOrder: number
  isActive: boolean
  /** Procesos que lo usan */
  usage: number
}
