import type { QueryClient } from '@tanstack/vue-query'

/**
 * Inmuebles, clientes, asesores, procesos, finanzas y reportes de Ventas se muestran unos
 * dentro de otros (nombres, precios, monedas, estados). Tras editar cualquiera se marca
 * todo Ventas como desactualizado: lo visible se refresca y lo demás al volver a abrirse.
 */
export function invalidateVentasRelatedData(qc: QueryClient): Promise<void> {
  return qc.invalidateQueries({
    predicate: ({ queryKey }) => {
      const root = queryKey[0]
      return typeof root === 'string' && root.startsWith('ventas-') && root !== 'ventas-config'
    },
  })
}
