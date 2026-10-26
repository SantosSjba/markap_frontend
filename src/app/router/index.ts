import { createRouter, createWebHistory, type RouterHistory, type RouteRecordRaw } from 'vue-router'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage, SUPPORT_HINT } from '@shared/utils/apiErrorMessage'
import { applicationAccessGuard } from './guards/application-access.guard'
import { authGuard } from './guards/auth.guard'
import { authRoutes } from '@modules/auth/presentation/router/index'
import { applicationsRoutes } from '@modules/applications/presentation/router/index'
import { dashboardRoutes } from '@modules/shell/presentation/router/index'
import { settingsRoutes } from '@modules/settings/presentation/router/index'
import { alquileresRoutes } from '@modules/alquileres/presentation/router/index'
import { ventasRoutes } from '@modules/ventas/presentation/router/index'
import { interiorismoRoutes } from '@modules/interiorismo/presentation/router/index'
import { arquitecturaRoutes } from '@modules/arquitectura/presentation/router/index'
import { produccionRoutes } from '@modules/produccion/presentation/router/index'
import { contabilidadRoutes } from '@modules/contabilidad/presentation/router/index'
const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/applications',
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('@modules/shell/presentation/views/UnauthorizedView.vue'),
    meta: { title: 'Acceso Denegado' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@modules/shell/presentation/views/NotFoundView.vue'),
    meta: { title: 'Página no encontrada' },
  },
]

const routes: RouteRecordRaw[] = [
  ...authRoutes,
  ...applicationsRoutes,
  ...alquileresRoutes,
  ...ventasRoutes,
  ...interiorismoRoutes,
  ...arquitecturaRoutes,
  ...produccionRoutes,
  ...contabilidadRoutes,
  ...settingsRoutes,
  ...dashboardRoutes,
  ...baseRoutes,
]

export function createAppRouter(
  history: RouterHistory = createWebHistory(import.meta.env.BASE_URL),
) {
  const router = createRouter({
    history,
    routes,
    scrollBehavior(_to, _from, savedPosition) {
      if (savedPosition) return savedPosition
      return { top: 0 }
    },
  })

  router.beforeEach(authGuard)
  router.beforeEach(applicationAccessGuard)

  /**
   * Tras un despliegue, una pestaña abierta puede pedir módulos que ya no existen.
   * Se recarga una vez hacia la ruta destino; si vuelve a fallar se avisa al usuario.
   */
  const RELOAD_FLAG = 'markap_chunk_reload'
  router.onError((error, to) => {
    const message = error instanceof Error ? error.message : String(error)
    const isChunkError =
      /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch/i.test(
        message,
      )
    if (isChunkError && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, '1')
      window.location.assign(to.fullPath)
      return
    }
    console.error('[router]', error)
    void markapAlert.toast.error(
      'No se pudo abrir la pantalla',
      isChunkError
        ? `Hay una versión nueva del sistema. Recarga la página para continuar. ${SUPPORT_HINT}`
        : getApiErrorMessage(error, 'No se pudo abrir la pantalla'),
    )
  })

  router.afterEach((to) => {
    sessionStorage.removeItem(RELOAD_FLAG)
    const title = to.meta.title as string | undefined
    document.title = title ? `${title} | Markap` : 'Markap'
  })

  return router
}
