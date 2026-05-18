import { computed, watch, type Ref } from 'vue'
import {
  UBIGEO_OTHER_DEPARTMENT_ID,
  UBIGEO_OTHER_DISTRICT_ID,
  UBIGEO_OTHER_PROVINCE_ID,
  isUbigeoOtherDepartment,
} from '../constants/ubigeo-other'

type AddressFormValues = {
  departmentId?: string
  provinceId?: string
  districtId?: string
  locationCountry?: string
  locationDepartment?: string
  locationProvince?: string
  locationDistrict?: string
}

export function useClientAddressUbigeo(options: {
  values: AddressFormValues
  setFieldValue: (field: keyof AddressFormValues, value: string) => void
  isInitializing?: Ref<boolean>
}) {
  const isOtherLocation = computed(() => isUbigeoOtherDepartment(options.values.departmentId))

  watch(
    () => options.values.departmentId,
    (depId) => {
      if (options.isInitializing?.value) return
      if (depId === UBIGEO_OTHER_DEPARTMENT_ID) {
        options.setFieldValue('provinceId', UBIGEO_OTHER_PROVINCE_ID)
        options.setFieldValue('districtId', UBIGEO_OTHER_DISTRICT_ID)
        return
      }
      options.setFieldValue('locationCountry', '')
      options.setFieldValue('locationDepartment', '')
      options.setFieldValue('locationProvince', '')
      options.setFieldValue('locationDistrict', '')
      options.setFieldValue('provinceId', '')
      options.setFieldValue('districtId', '')
    },
  )

  watch(
    () => options.values.provinceId,
    () => {
      if (options.isInitializing?.value || isOtherLocation.value) return
      options.setFieldValue('districtId', '')
    },
  )

  return { isOtherLocation }
}
