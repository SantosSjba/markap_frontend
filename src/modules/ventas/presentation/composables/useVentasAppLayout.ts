import { computed } from 'vue'
import { useMyApplications } from '@modules/applications/presentation/composables/useApplications'
import { VENTAS_MENUS } from '../../config/menu'
/**
 * Layout de Ventas: datos de la aplicación del usuario + menú lateral estático (`config/menu.ts`).
 */
export function useVentasAppLayout() {
  const { data: applications } = useMyApplications()
  const application = computed(() => applications.value?.find((a) => a.slug === 'ventas') ?? null)

  return {
    application,
    menus: VENTAS_MENUS,
  }
}
