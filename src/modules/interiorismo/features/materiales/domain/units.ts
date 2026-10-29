/** Unidades de medida de uso común en presupuestos y catálogo (Excel PRIZE y Markap Spaces). */
export const MEASUREMENT_UNITS = [
  { value: 'und', label: 'und — unidad' },
  { value: 'pza', label: 'pza — pieza' },
  { value: 'glb', label: 'glb — global' },
  { value: 'm', label: 'm — metro' },
  { value: 'ml', label: 'ml — metro lineal' },
  { value: 'm²', label: 'm² — metro cuadrado' },
  { value: 'm³', label: 'm³ — metro cúbico' },
  { value: 'kg', label: 'kg — kilogramo' },
  { value: 'gl', label: 'gl — galón' },
  { value: 'rollo', label: 'rollo' },
  { value: 'plancha', label: 'plancha' },
  { value: 'día', label: 'día' },
] as const

/** Opciones del selector; agrega la unidad guardada si no es una de las comunes */
export function unitOptions(current?: string | null) {
  const base: { value: string; label: string }[] = [...MEASUREMENT_UNITS]
  if (current && !base.some((u) => u.value === current)) base.push({ value: current, label: current })
  return base
}
