import type {
  ProduccionAppSettingsDTO,
  ProduccionConfigBootstrap,
  ProduccionFurnitureCategoryDTO,
  ProduccionMaterialCategoryDTO,
  ProduccionProductionStageDTO,
  ProduccionUnitDTO,
  ProduccionNumberingSeriesDTO,
} from '../config.types'

export interface ProduccionConfigRepository {
  bootstrap(): Promise<ProduccionConfigBootstrap>
  updateSettings(body: Partial<ProduccionAppSettingsDTO>): Promise<ProduccionAppSettingsDTO>
  replaceFurnitureCategories(categories: ProduccionFurnitureCategoryDTO[]): Promise<ProduccionFurnitureCategoryDTO[]>
  replaceMaterialCategories(categories: ProduccionMaterialCategoryDTO[]): Promise<ProduccionMaterialCategoryDTO[]>
  replaceProductionStages(stages: ProduccionProductionStageDTO[]): Promise<ProduccionProductionStageDTO[]>
  replaceUnits(units: ProduccionUnitDTO[]): Promise<ProduccionUnitDTO[]>
  patchNumbering(
    seriesKey: string,
    body: { prefix?: string; lastNumber?: number; padLength?: number; includeYear?: boolean },
  ): Promise<ProduccionNumberingSeriesDTO>
}
