import { computed } from 'vue'
import { useMyApplications } from '@modules/applications/presentation/composables/useApplications'
import { CONTABILIDAD_MENUS } from '../../config/menu'
/**
 * Layout de Contabilidad: datos de la aplicación del usuario + menú lateral estático (`config/menu.ts`).
 */
export function useContabilidadAppLayout() {
  const { data: applications } = useMyApplications()
  const application = computed(() => applications.value?.find((a) => a.slug === 'contabilidad') ?? null)

  return {
    application,
    menus: CONTABILIDAD_MENUS,
  }
}
