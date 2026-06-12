import { computed } from 'vue'
import { useInteriorismoConfigBootstrap } from '@modules/interiorismo/features/configuracion'
import type { InteriorProjectStatus } from '../domain/project.types'
import {
  INTERIOR_PROJECT_LIFECYCLE_CODES,
  INTERIOR_PROJECT_STATUS_LABELS,
} from '../presentation/project-stages.constants'

type StageOption = { value: InteriorProjectStatus; label: string }

function fallbackLifecycleOptions(): StageOption[] {
  return INTERIOR_PROJECT_LIFECYCLE_CODES.map((code) => ({
    value: code,
    label: INTERIOR_PROJECT_STATUS_LABELS[code],
  }))
}

/** Opciones de estado según configuración del módulo (ciclo de 5 etapas). */
export function useInteriorProjectStageOptions(options?: { includeCancelled?: boolean }) {
  const includeCancelled = options?.includeCancelled ?? false
  const { data: boot, isLoading } = useInteriorismoConfigBootstrap()

  const stageLabelMap = computed(() => {
    const map: Record<string, string> = { ...INTERIOR_PROJECT_STATUS_LABELS }
    for (const row of boot.value?.projectStages ?? []) {
      if (row.isActive) map[row.code] = row.label
    }
    return map
  })

  const lifecycleOptions = computed((): StageOption[] => {
    const fromConfig = (boot.value?.projectStages ?? [])
      .filter((s) => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({
        value: s.code as InteriorProjectStatus,
        label: s.label,
      }))
    if (fromConfig.length >= INTERIOR_PROJECT_LIFECYCLE_CODES.length) return fromConfig
    return fallbackLifecycleOptions()
  })

  const filterOptions = computed((): StageOption[] => {
    const base = lifecycleOptions.value
    if (!includeCancelled) return base
    return [...base, { value: 'CANCELLED' as const, label: INTERIOR_PROJECT_STATUS_LABELS.CANCELLED }]
  })

  return {
    isLoading,
    stageLabelMap,
    lifecycleOptions,
    formOptions: lifecycleOptions,
    filterOptions,
  }
}
