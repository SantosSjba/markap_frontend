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

const activePeriod = ref<ContabilidadActivePeriod | null>(readStored())
const listYear = ref(activePeriod.value?.year ?? new Date().getFullYear())
const periods = ref<ContabilidadPeriodDTO[]>([])
const loading = ref(false)

function pickDefaultPeriod(periodList: ContabilidadPeriodDTO[], entityId: string) {
  const stored = readStored(entityId)
  if (stored) {
    const match = periodList.find((p) => p.id === stored.id)
    if (match) return match
  }
  const now = new Date()
  return (
    periodList.find((p) => p.year === now.getFullYear() && p.month === now.getMonth() + 1) ??
    periodList.find((p) => p.status === 'OPEN') ??
    periodList[0] ??
    null
  )
}

export function applyPeriodBootstrap(
  year: number,
  periodList: ContabilidadPeriodDTO[],
  selected?: ContabilidadPeriodDTO | null,
) {
  listYear.value = year
  periods.value = periodList
  if (selected) {
    activePeriod.value = selected
    writeStored(selected, activeLegalEntityIdRef.value)
  }
}

export async function loadPeriodsForEntity(entityId: string, year?: number) {
  loading.value = true
  try {
    const y = year ?? listYear.value
    const res = await contabilidadPeriodsApiRepository.list(y)
    listYear.value = res.year
    periods.value = res.periods

    const current = pickDefaultPeriod(res.periods, entityId)
    activePeriod.value = current
    writeStored(current, entityId)
  } finally {
    loading.value = false
  }
}

function setActivePeriod(period: ContabilidadPeriodDTO) {
  activePeriod.value = period
  writeStored(period, activeLegalEntityIdRef.value)
}

watch(activeLegalEntityIdRef, (entityId, prev) => {
  if (!entityId || entityId === prev) return
  activePeriod.value = readStored(entityId)
})

watch(
  activePeriod,
  (p) => {
    if (p) writeStored(p, activeLegalEntityIdRef.value)
  },
  { deep: true },
)

const openPeriods = computed(() => periods.value.filter((p) => p.status === 'OPEN'))

export function useContabilidadActivePeriodState() {
  return {
    activePeriod,
    periods,
    openPeriods,
    listYear,
    loading,
    setActivePeriod,
  }
}

/** @deprecated Prefer useContabilidadContext() for layout init; kept for views that only need period state. */
export function useContabilidadActivePeriod() {
  const state = useContabilidadActivePeriodState()

  return {
    ...state,
    loadPeriods: () =>
      activeLegalEntityIdRef.value
        ? loadPeriodsForEntity(activeLegalEntityIdRef.value)
        : Promise.resolve(),
    setListYear: (year: number) => {
      listYear.value = year
      return activeLegalEntityIdRef.value
        ? loadPeriodsForEntity(activeLegalEntityIdRef.value, year)
        : Promise.resolve()
    },
  }
}
