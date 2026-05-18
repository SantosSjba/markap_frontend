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
