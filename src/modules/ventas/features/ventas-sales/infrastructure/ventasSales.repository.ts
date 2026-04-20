import type { VentasSalesRepository } from '../domain/repositories/ventas-sales.repository'
import { ventasSalesApiRepository } from './repositories/ventas-sales.api.repository'

/** Instancia por defecto del puerto (adaptador HTTP). */
export const ventasSalesRepository: VentasSalesRepository = ventasSalesApiRepository
