import { computed } from 'vue'
import { useMyApplications } from '@modules/applications/presentation/composables/useApplications'
import { PRODUCCION_MENUS } from '../../config/menu'
/**
 * Layout de Produccion: datos de la aplicación del usuario + menú lateral estático (`config/menu.ts`).
 */
export function useProduccionAppLayout() {
  const { data: applications } = useMyApplications()
  const application = computed(() => applications.value?.find((a) => a.slug === 'produccion') ?? null)

  return {
    application,
    menus: PRODUCCION_MENUS,
  }
}
