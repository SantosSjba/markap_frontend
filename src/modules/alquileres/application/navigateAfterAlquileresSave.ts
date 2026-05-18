import type { Router, RouteLocationRaw } from 'vue-router'

export type NavigateAfterAlquileresSaveOptions = {
  /** Ruta del listado (ej. /alquileres/clientes) */
  listPath: string
  /** Si viene de otro formulario, volver allí con el registro creado */
  returnTo?: string
  returnQuery?: Record<string, string>
  /** Invalidar/refetch en segundo plano (no bloquear navegación) */
  invalidate?: () => void | Promise<void>
}

/**
 * Tras guardar en Alquileres: navega al listado o a returnTo.
 * Usa replace para no dejar el formulario en el historial.
 */
export async function navigateAfterAlquileresSave(
  router: Router,
  options: NavigateAfterAlquileresSaveOptions,
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
