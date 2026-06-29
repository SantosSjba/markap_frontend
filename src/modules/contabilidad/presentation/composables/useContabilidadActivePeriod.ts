import { ref, watch, computed } from 'vue'
import type { ContabilidadPeriodDTO } from '@modules/contabilidad/features/periodos/domain/period.types'
import { contabilidadPeriodsApiRepository } from '@modules/contabilidad/features/periodos/infrastructure/repositories/contabilidad-periods.api.repository'
import { activeLegalEntityIdRef } from '../../config/api-scope'

function periodStorageKey(entityId?: string) {
  return entityId ? `markap.contabilidad.activePeriod.${entityId}` : 'markap.contabilidad.activePeriod'
}

export interface ContabilidadActivePeriod extends ContabilidadPeriodDTO {}

function readStored(entityId?: string): ContabilidadActivePeriod | null {
  try {
    const raw = localStorage.getItem(periodStorageKey(entityId))
    if (!raw) return null
    return JSON.parse(raw) as ContabilidadActivePeriod
  } catch {
    return null
  }
}

function writeStored(period: ContabilidadActivePeriod | null, entityId?: string) {
  const key = periodStorageKey(entityId ?? period?.legalEntityId)
  if (!period) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, JSON.stringify(period))
}

const activePeriod = ref<ContabilidadActivePeriod | null>(null)
const listYear = ref(new Date().getFullYear())
const periods = ref<ContabilidadPeriodDTO[]>([])
const loading = ref(false)

async function loadPeriods(year?: number) {
  if (!activeLegalEntityIdRef.value) return
  loading.value = true
  try {
    const y = year ?? listYear.value
    const res = await contabilidadPeriodsApiRepository.list(y)
    listYear.value = res.year
    periods.value = res.periods

    const stored = readStored(activeLegalEntityIdRef.value)
    const match = stored ? res.periods.find((p: ContabilidadPeriodDTO) => p.id === stored.id) : null
    if (match) {
      activePeriod.value = match
      writeStored(match, activeLegalEntityIdRef.value)
      return
    }

    const now = new Date()
    const current =
      res.periods.find((p: ContabilidadPeriodDTO) => p.year === now.getFullYear() && p.month === now.getMonth() + 1) ??
      res.periods.find((p: ContabilidadPeriodDTO) => p.status === 'OPEN') ??
      res.periods[0]

    if (current) {
      activePeriod.value = current
      writeStored(current, activeLegalEntityIdRef.value)
    } else {
      activePeriod.value = null
    }
  } finally {
    loading.value = false
  }
}

function setActivePeriod(period: ContabilidadPeriodDTO) {
  activePeriod.value = period
  writeStored(period, activeLegalEntityIdRef.value)
}

watch(activeLegalEntityIdRef, (entityId) => {
  if (!entityId) return
  activePeriod.value = readStored(entityId)
  void loadPeriods()
})

watch(
  activePeriod,
  (p) => {
    if (p) writeStored(p, activeLegalEntityIdRef.value)
  },
  { deep: true },
)

function setListYear(year: number) {
  listYear.value = year
  void loadPeriods(year)
}

const openPeriods = computed(() => periods.value.filter((p) => p.status === 'OPEN'))

export function useContabilidadActivePeriod() {
  if (!periods.value.length && !loading.value && activeLegalEntityIdRef.value) {
    void loadPeriods()
  }

  return {
    activePeriod,
    periods,
    openPeriods,
    listYear,
    loading,
    loadPeriods,
    setActivePeriod,
    setListYear,
  }
}
