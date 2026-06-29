/** Fallback cuando la API de configuración no está disponible aún. */
export const FALLBACK_FURNITURE_CATEGORY_OPTIONS = [
  { value: 'Comedor', label: 'Comedor' },
  { value: 'Dormitorio', label: 'Dormitorio' },
  { value: 'Oficina', label: 'Oficina' },
  { value: 'Cocina', label: 'Cocina' },
  { value: 'Sala', label: 'Sala' },
  { value: 'Otro', label: 'Otro' },
] as const

export const FALLBACK_UNIT_OPTIONS = [
  { value: 'und', label: 'Unidad (und)' },
  { value: 'plancha', label: 'Plancha' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'm2', label: 'Metro cuadrado (m²)' },
  { value: 'kg', label: 'Kilogramo (kg)' },
  { value: 'lt', label: 'Litro (lt)' },
] as const

export const FALLBACK_MATERIAL_CATEGORY_OPTIONS = [
  { value: 'Tableros', label: 'Tableros' },
  { value: 'Herrajes', label: 'Herrajes' },
  { value: 'Adhesivos', label: 'Adhesivos' },
  { value: 'Acabados', label: 'Acabados' },
  { value: 'Otros', label: 'Otros' },
] as const
