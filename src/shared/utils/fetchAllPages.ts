/**
 * Trae todas las filas de un listado paginado, página por página.
 * Los listados del backend topan `limit` (p. ej. 50 en alquileres, propiedades, clientes y agentes),
 * así que pedir `limit: 10000` de una vez devolvía solo la primera página: las exportaciones
 * a Excel deben usar este helper para incluir todos los registros.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<{ data: T[]; total: number }>,
  pageSize = 50,
): Promise<T[]> {
  const rows: T[] = []
  for (let page = 1; ; page++) {
    const { data, total } = await fetchPage(page, pageSize)
    rows.push(...data)
    if (!data.length || rows.length >= total) return rows
  }
}
