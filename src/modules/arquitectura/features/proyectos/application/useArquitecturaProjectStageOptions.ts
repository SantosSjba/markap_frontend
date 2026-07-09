import { computed } from 'vue'
import { useArquitecturaConfigBootstrap } from '@modules/arquitectura/features/configuracion'
import type { ArquitecturaProjectStatus } from '../domain/project.types'
import {
  ARQUITECTURA_PROJECT_LIFECYCLE_CODES,
  ARQUITECTURA_PROJECT_STATUS_LABELS,
} from '../presentation/project-stages.constants'

type StageOption = { value: ArquitecturaProjectStatus; label: string }

function fallbackLifecycleOptions(): StageOption[] {
  return ARQUITECTURA_PROJECT_LIFECYCLE_CODES.map((code) => ({
    value: code,
    label: ARQUITECTURA_PROJECT_STATUS_LABELS[code],
  }))
}

export function useArquitecturaProjectStageOptions(options?: { includeCancelled?: boolean }) {
  const includeCancelled = options?.includeCancelled ?? false
  const { data: boot, isLoading } = useArquitecturaConfigBootstrap()

  const stageLabelMap = computed(() => {
    const map: Record<string, string> = { ...ARQUITECTURA_PROJECT_STATUS_LABELS }
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
        value: s.code as ArquitecturaProjectStatus,
        label: s.label,
      }))
    if (fromConfig.length >= ARQUITECTURA_PROJECT_LIFECYCLE_CODES.length) return fromConfig
    return fallbackLifecycleOptions()
  })

  const filterOptions = computed((): StageOption[] => {
    const base = lifecycleOptions.value
    if (!includeCancelled) return base
    return [...base, { value: 'CANCELLED' as const, label: ARQUITECTURA_PROJECT_STATUS_LABELS.CANCELLED }]
  })

  return {
    isLoading,
    stageLabelMap,
    lifecycleOptions,
    formOptions: lifecycleOptions,
    filterOptions,
  }
}
