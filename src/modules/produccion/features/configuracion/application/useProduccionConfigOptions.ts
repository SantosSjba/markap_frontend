import { computed } from 'vue'
import { useProduccionConfigBootstrap } from './useProduccionConfig'
import {
  FALLBACK_FURNITURE_CATEGORY_OPTIONS,
  FALLBACK_MATERIAL_CATEGORY_OPTIONS,
  FALLBACK_UNIT_OPTIONS,
} from '../domain/config.defaults'

export type SelectOption = { value: string; label: string }

export function useProduccionFurnitureCategoryOptions() {
  const { data, isLoading, isError } = useProduccionConfigBootstrap()

  const options = computed<SelectOption[]>(() => {
    const rows = (data.value?.furnitureCategories ?? [])
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    if (!rows.length) return [...FALLBACK_FURNITURE_CATEGORY_OPTIONS]
    return rows.map((c) => ({ value: c.label, label: c.label }))
  })

  const defaultCategory = computed(() => options.value[0]?.value ?? 'Otro')

  return { options, defaultCategory, isLoading, isError }
}

export function useProduccionMaterialCategoryOptions() {
  const { data, isLoading, isError } = useProduccionConfigBootstrap()

  const options = computed<SelectOption[]>(() => {
    const rows = (data.value?.materialCategories ?? [])
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    if (!rows.length) return [...FALLBACK_MATERIAL_CATEGORY_OPTIONS]
    return rows.map((c) => ({ value: c.label, label: c.label }))
  })

  const defaultCategory = computed(() => options.value[0]?.value ?? 'Otros')

  return { options, defaultCategory, isLoading, isError }
}

export function useProduccionUnitOptions() {
  const { data, isLoading, isError } = useProduccionConfigBootstrap()

  const options = computed<SelectOption[]>(() => {
    const rows = (data.value?.units ?? [])
      .filter((u) => u.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    if (!rows.length) return [...FALLBACK_UNIT_OPTIONS]
    return rows.map((u) => ({ value: u.code, label: u.label }))
  })

  const defaultUnit = computed(() => options.value[0]?.value ?? 'und')

  return { options, defaultUnit, isLoading, isError }
}
