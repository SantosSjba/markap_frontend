import type { Router, RouteLocationRaw } from 'vue-router'

export type NavigateAfterVentasSaveOptions = {
  /** Ruta del listado (ej. /ventas/clientes) */
  listPath: string
  /** Si viene de otro formulario (wizard), volver allí con query opcional */
  returnTo?: string
  returnQuery?: Record<string, string>
  /** Invalidar caché en segundo plano (no bloquear navegación) */
  invalidate?: () => void | Promise<void>
}

/**
 * Tras guardar en Ventas: vuelve al listado (o a returnTo) con replace
 * para no dejar el formulario "nuevo" en el historial del navegador.
 */
export async function navigateAfterVentasSave(
  router: Router,
  options: NavigateAfterVentasSaveOptions,
): Promise<void> {
  const { listPath, returnTo, returnQuery, invalidate } = options

  if (invalidate) {
    void Promise.resolve(invalidate()).catch(() => undefined)
  }

  if (returnTo?.trim()) {
    const target: RouteLocationRaw = returnQuery
      ? { path: returnTo, query: returnQuery }
      : returnTo
    await router.replace(target)
    return
  }

  await router.replace(listPath)
}
