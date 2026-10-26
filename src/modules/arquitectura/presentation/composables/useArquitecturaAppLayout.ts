import { computed } from 'vue'
import { useMyApplications } from '@modules/applications/presentation/composables/useApplications'
import { ARQUITECTURA_MENUS } from '../../config/menu'
/**
 * Layout de Arquitectura: datos de la aplicación del usuario + menú lateral estático (`config/menu.ts`).
 */
export function useArquitecturaAppLayout() {
  const { data: applications } = useMyApplications()
  const application = computed(() => applications.value?.find((a) => a.slug === 'arquitectura') ?? null)

  return {
    application,
    menus: ARQUITECTURA_MENUS,
  }
}
