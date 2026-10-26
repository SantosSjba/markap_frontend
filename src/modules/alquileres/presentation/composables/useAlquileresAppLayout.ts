import { computed } from 'vue'
import { useMyApplications } from '@modules/applications/presentation/composables/useApplications'
import { ALQUILERES_MENUS } from '../../config/menu'
/**
 * Layout de Alquileres: datos de la aplicación del usuario + menú lateral estático (`config/menu.ts`).
 */
export function useAlquileresAppLayout() {
  const { data: applications } = useMyApplications()
  const application = computed(() => applications.value?.find((a) => a.slug === 'alquileres') ?? null)

  return {
    application,
    menus: ALQUILERES_MENUS,
  }
}
