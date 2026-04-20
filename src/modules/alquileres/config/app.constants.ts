/**
 * Identificador del **producto** Alquileres en backend (`applicationSlug` multi-app).
 * Lo usan clientes, propiedades, contratos, cobranzas, etc.
 *
 * No es el nombre del feature de contratos: ese dominio vive en `features/alquileres/domain/rental.*`, API `/rentals`
 * y el puerto `RentalsRepository`.
 */
export const ALQUILERES_APP_SLUG = 'alquileres' as const
