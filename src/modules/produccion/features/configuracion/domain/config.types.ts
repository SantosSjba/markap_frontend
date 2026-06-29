import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'

export const PRODUCCION_CONFIG_APP_SLUG = PRODUCCION_APP_SLUG

export interface ProduccionAppSettingsDTO {
  igvPercent: number
  woodWastePercent: number
  quotationValidDays: number
}

export interface ProduccionFurnitureCategoryDTO {
  id?: string
  code: string
  label: string
  sortOrder: number
  isActive: boolean
}

export interface ProduccionMaterialCategoryDTO {
  id?: string
  code: string
  label: string
  sortOrder: number
  isActive: boolean
}

export interface ProduccionProductionStageDTO {
  id?: string
  stageKey: string
  label: string
  sortOrder: number
  isActive: boolean
}

export interface ProduccionUnitDTO {
  id?: string
  code: string
  label: string
  sortOrder: number
  isActive: boolean
}

export interface ProduccionNumberingSeriesDTO {
  seriesKey: string
  prefix: string
  lastNumber: number
  padLength: number
  includeYear: boolean
  nextPreview: string
}

export interface ProduccionConfigBootstrap {
  settings: ProduccionAppSettingsDTO
  furnitureCategories: ProduccionFurnitureCategoryDTO[]
  materialCategories: ProduccionMaterialCategoryDTO[]
  productionStages: ProduccionProductionStageDTO[]
  units: ProduccionUnitDTO[]
  numbering: ProduccionNumberingSeriesDTO[]
}

export const PRODUCCION_NUMBERING_LABELS: Record<string, string> = {
  FURNITURE: 'Muebles',
  WORK_ORDER: 'Órdenes de trabajo',
  QUOTATION: 'Cotizaciones',
  PURCHASE_ORDER: 'Órdenes de compra',
  ORDER: 'Pedidos',
  DELIVERY: 'Entregas',
}
