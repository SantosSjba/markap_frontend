/**
 * Constantes de acceso por rol a aplicaciones.
 * Define qué aplicación (slug) puede ver cada rol en el selector de apps.
 * La fuente de verdad de permisos es el backend (/applications/me); esto sirve
 * para documentación, tipos y validaciones en el front (ej. guards o filtros).
 */

/** Slugs de aplicaciones (deben coincidir con el backend) */
export const APPLICATION_SLUGS = [
  'alquileres',
  'ventas',
  'interiorismo',
  'arquitectura',
  'produccion',
  'contabilidad',
] as const;

export type ApplicationSlug = (typeof APPLICATION_SLUGS)[number];

/** Códigos de rol (sincronizados con el seed del backend) */
export const ROLE_CODES = [
  'ADMIN',
  'ADMIN_CONTAB',
  'ASIST_ARQUITECTURA',
  'ASIST_ADMIN',
  'MANAGER',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

/**
 * Aplicaciones a las que tiene acceso cada rol.
 * ADMIN tiene todas; el resto según asignación en seed.
 */
export const ROLE_APPLICATION_ACCESS: Record<RoleCode, readonly ApplicationSlug[]> = {
  ADMIN: APPLICATION_SLUGS,
  MANAGER: [
    'alquileres',
    'ventas',
    'interiorismo',
    'arquitectura',
    'produccion',
    'contabilidad',
  ],
  ADMIN_CONTAB: ['alquileres', 'contabilidad'],
  ASIST_ARQUITECTURA: ['arquitectura'],
  ASIST_ADMIN: ['alquileres', 'ventas', 'contabilidad'],
};

/**
 * Indica si un rol tiene acceso a una aplicación (según constantes del front).
 * Para comprobar acceso real del usuario, usar las apps devueltas por /applications/me.
 */
export function roleCanAccessApp(roleCode: RoleCode, appSlug: ApplicationSlug): boolean {
  const slugs = ROLE_APPLICATION_ACCESS[roleCode];
  return slugs.includes(appSlug);
}

/**
 * Dado una lista de códigos de rol del usuario, devuelve los slugs de aplicaciones
 * a los que tendría acceso (unión de todos sus roles).
 */
export function getApplicationSlugsForRoles(roleCodes: RoleCode[]): ApplicationSlug[] {
  const set = new Set<ApplicationSlug>();
  for (const code of roleCodes) {
    const slugs = ROLE_APPLICATION_ACCESS[code];
    if (slugs) slugs.forEach((s) => set.add(s));
  }
  return [...set];
}
