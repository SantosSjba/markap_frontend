import { ref, watch, computed } from 'vue'
import type { ContabilidadPeriodDTO } from '@modules/contabilidad/features/periodos/domain/period.types'
import { contabilidadPeriodsApiRepository } from '@modules/contabilidad/features/periodos/infrastructure/repositories/contabilidad-periods.api.repository'

const STORAGE_KEY = 'markap.contabilidad.activePeriod'

export interface ContabilidadActivePeriod extends ContabilidadPeriodDTO {}

function readStored(): ContabilidadActivePeriod | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ContabilidadActivePeriod
  } catch {
    return null
  }
}

function writeStored(period: ContabilidadActivePeriod | null) {
  if (!period) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(period))
}

const activePeriod = ref<ContabilidadActivePeriod | null>(readStored())
const listYear = ref(activePeriod.value?.year ?? new Date().getFullYear())
const periods = ref<ContabilidadPeriodDTO[]>([])
const loading = ref(false)

async function loadPeriods(year?: number) {
  loading.value = true
  try {
    const y = year ?? listYear.value
    const res = await contabilidadPeriodsApiRepository.list(y)
    listYear.value = res.year
    periods.value = res.periods

    const stored = activePeriod.value
    const match = stored ? res.periods.find((p: ContabilidadPeriodDTO) => p.id === stored.id) : null
    if (match) {
      activePeriod.value = match
      writeStored(match)
      return
    }

    const now = new Date()
    const current =
      res.periods.find((p: ContabilidadPeriodDTO) => p.year === now.getFullYear() && p.month === now.getMonth() + 1) ??
      res.periods.find((p: ContabilidadPeriodDTO) => p.status === 'OPEN') ??
      res.periods[0]

    if (current) {
      activePeriod.value = current
      writeStored(current)
    }
  } finally {
    loading.value = false
  }
}

function setActivePeriod(period: ContabilidadPeriodDTO) {
  activePeriod.value = period
  writeStored(period)
}

function setListYear(year: number) {
  listYear.value = year
  void loadPeriods(year)
}

watch(
  activePeriod,
  (p) => {
    if (p) writeStored(p)
  },
  { deep: true },
)

const openPeriods = computed(() => periods.value.filter((p) => p.status === 'OPEN'))

export function useContabilidadActivePeriod() {
  if (!periods.value.length && !loading.value) {
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
