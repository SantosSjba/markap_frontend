/** Debe coincidir con el backend (ubigeo-other.constants.ts). */
export const UBIGEO_OTHER_DEPARTMENT_ID = '99'
export const UBIGEO_OTHER_PROVINCE_ID = '9999'
export const UBIGEO_OTHER_DISTRICT_ID = '999999'

export const UBIGEO_OTHER_DEPARTMENT_LABEL = 'Otros (extranjero / fuera de Perú)'

/** Opción fija al final del combo de departamentos (también si el seed aún no corrió en BD). */
export const UBIGEO_OTHER_DEPARTMENT_OPTION = {
  value: UBIGEO_OTHER_DEPARTMENT_ID,
  label: UBIGEO_OTHER_DEPARTMENT_LABEL,
} as const

export function mergeDepartmentOptions(
  departments: { id: string; name: string }[] | undefined,
): { value: string; label: string }[] {
  const fromApi = (departments ?? [])
    .filter((d) => d.id !== UBIGEO_OTHER_DEPARTMENT_ID)
    .map((d) => ({ value: d.id, label: d.name }))
  return [...fromApi, { ...UBIGEO_OTHER_DEPARTMENT_OPTION }]
}

export interface LocationCustom {
  country: string
  department: string
  province: string
  district: string
}

export function isUbigeoOtherDepartment(departmentId: string | undefined): boolean {
  return departmentId === UBIGEO_OTHER_DEPARTMENT_ID
}

export function buildLocationCustomPayload(form: {
  locationCountry: string
  locationDepartment: string
  locationProvince: string
  locationDistrict: string
}): LocationCustom {
  return {
    country: form.locationCountry.trim(),
    department: form.locationDepartment.trim(),
    province: form.locationProvince.trim(),
    district: form.locationDistrict.trim(),
  }
}

const LOCATION_LINE_RE =
  /(?:^|\n\n?)Ubicación:\s*([^,\n]+),\s*([^,\n]+),\s*([^,\n]+),\s*([^\n]+)\s*$/

/** Extrae ubicación libre guardada en descripción (propiedades sin locationCustom en API). */
export function parseLocationFromDescription(
  description: string | null | undefined,
): LocationCustom | null {
  if (!description?.trim()) return null
  const match = description.match(LOCATION_LINE_RE)
  if (!match?.[1] || !match[2] || !match[3] || !match[4]) return null
  return {
    country: match[1].trim(),
    department: match[2].trim(),
    province: match[3].trim(),
    district: match[4].trim(),
  }
}

export function stripLocationFromDescription(description: string | null | undefined): string {
  if (!description?.trim()) return ''
  return description.replace(LOCATION_LINE_RE, '').trim()
}

export function formatLocationInDescription(loc: LocationCustom): string {
  return `Ubicación: ${loc.country}, ${loc.department}, ${loc.province}, ${loc.district}`
}

/** districtId + locationCustom para API de propiedades (mismo contrato que clientes). */
export function buildPropertyUbigeoPayload(form: {
  departmentId: string
  districtId: string
  locationCountry: string
  locationDepartment: string
  locationProvince: string
  locationDistrict: string
}): { districtId: string; locationCustom: LocationCustom | null } {
  if (form.departmentId === UBIGEO_OTHER_DEPARTMENT_ID) {
    return {
      districtId: UBIGEO_OTHER_DISTRICT_ID,
      locationCustom: buildLocationCustomPayload({
        locationCountry: form.locationCountry,
        locationDepartment: form.locationDepartment,
        locationProvince: form.locationProvince,
        locationDistrict: form.locationDistrict,
      }),
    }
  }
  return { districtId: form.districtId, locationCustom: null }
}
