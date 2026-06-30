import { computed } from 'vue'
import { useContabilidadContext } from './useContabilidadContext'

export type { ContabilidadLegalEntityDTO } from './contabilidad-context.types'

/** Compat: delega en el contexto unificado (bootstrap + entidad activa). */
export function useContabilidadActiveLegalEntity() {
  const ctx = useContabilidadContext()

  return {
    entities: computed(() => ctx.entities.value),
    activeLegalEntityId: ctx.activeLegalEntityId,
    loading: computed(() => ctx.initializing.value),
    setActiveLegalEntity: ctx.setActiveLegalEntity,
    refetch: ctx.retryInit,
  }
}
