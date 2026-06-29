import { ref } from 'vue'
import { CONTABILIDAD_APP_SLUG } from './app.constants'

/** Entidad legal activa compartida por todos los repositorios API del módulo. */
export const activeLegalEntityIdRef = ref<string | undefined>(undefined)

export function getContabilidadApiScope(extra?: Record<string, string | undefined>) {
  return {
    applicationSlug: CONTABILIDAD_APP_SLUG,
    legalEntityId: activeLegalEntityIdRef.value,
    ...extra,
  }
}
