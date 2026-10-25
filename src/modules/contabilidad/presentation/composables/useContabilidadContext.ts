import type { ContabilidadConfigRepository } from '../../features/configuracion/domain/repositories/contabilidad-config.repository'
import { contabilidadPeriodsRepositoryKey } from '../../features/periodos/application/ports/contabilidad-periods.port'
import { contabilidadConfigRepositoryKey } from '../../features/configuracion/application/ports/contabilidad-config.port'
import { useService } from '@shared/presentation/di/services'
import { ref, computed } from 'vue'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import type { ContabilidadPeriodDTO } from '../../features/periodos/domain/period.types'
import { activeLegalEntityIdRef } from '../../config/api-scope'
import type { ContabilidadLegalEntityDTO } from '../../domain/legal-entity.types'
import {
  applyPeriodBootstrap,
  loadPeriodsForEntity,
  useContabilidadActivePeriodState,
} from './useContabilidadActivePeriod'
const LEGAL_ENTITY_STORAGE_KEY = 'markap.contabilidad.activeLegalEntity'

const entities = ref<ContabilidadLegalEntityDTO[]>([])
const initializing = ref(false)
const initError = ref<string | null>(null)
const ready = ref(false)

let initPromise: Promise<void> | null = null

function readStoredLegalEntityId(): string | null {
  try {
    return localStorage.getItem(LEGAL_ENTITY_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredLegalEntityId(id: string) {
  try {
    localStorage.setItem(LEGAL_ENTITY_STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

function pickDefaultPeriod(periodList: ContabilidadPeriodDTO[], storedId?: string | null) {
  if (storedId) {
    const match = periodList.find((p) => p.id === storedId)
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

async function runBootstrap(
  contabilidadConfigApiRepository: ContabilidadConfigRepository,
  legalEntityId?: string,
  year?: number,
) {
  const storedEntityId = legalEntityId ?? readStoredLegalEntityId() ?? undefined
  const { listYear, activePeriod } = useContabilidadActivePeriodState()
  const targetYear = year ?? activePeriod.value?.year ?? listYear.value

  const data = await contabilidadConfigApiRepository.bootstrap({
    legalEntityId: storedEntityId,
    year: targetYear,
  })

  entities.value = data.legalEntities

  const storedEntity = storedEntityId
    ? data.legalEntities.find((e) => e.id === storedEntityId)
    : null
  const entity =
    storedEntity ??
    data.legalEntities.find((e) => e.id === data.defaultLegalEntityId) ??
    data.legalEntities.find((e) => e.isDefault) ??
    data.legalEntities[0]

  if (entity) {
    activeLegalEntityIdRef.value = entity.id
    writeStoredLegalEntityId(entity.id)
  }

  applyPeriodBootstrap(
    data.year,
    data.periods,
    pickDefaultPeriod(data.periods, activePeriod.value?.id),
  )
  ready.value = true
  initError.value = null
}

async function ensureContabilidadContext(
  repository: ContabilidadConfigRepository,
  legalEntityId?: string,
  year?: number,
) {
  if (ready.value && !legalEntityId && year === undefined) return
  if (initPromise && !legalEntityId && year === undefined) return initPromise

  initializing.value = true
  initError.value = null

  const task = runBootstrap(repository, legalEntityId, year)
    .catch((error) => {
      initError.value = getApiErrorMessage(error)
      ready.value = false
      throw error
    })
    .finally(() => {
      initializing.value = false
      initPromise = null
    })

  if (!legalEntityId && year === undefined) {
    initPromise = task
  }
  return task
}

export function useContabilidadContext() {
  const repository = useService(contabilidadConfigRepositoryKey)
  const periodsRepository = useService(contabilidadPeriodsRepositoryKey)
  const ensureInitialized = (entityId?: string, year?: number) =>
    ensureContabilidadContext(repository, entityId, year)
  const periodState = useContabilidadActivePeriodState()

  const entityOptions = computed(() =>
    entities.value.map((e) => ({
      value: e.id,
      label: `${e.ruc} — ${e.legalName}`,
    })),
  )

  const activeEntity = computed(() =>
    entities.value.find((e) => e.id === activeLegalEntityIdRef.value),
  )

  async function setActiveLegalEntity(entity: ContabilidadLegalEntityDTO) {
    ready.value = false
    await ensureInitialized(entity.id, periodState.listYear.value)
  }

  async function setListYear(year: number) {
    periodState.listYear.value = year
    if (!activeLegalEntityIdRef.value) return
    await loadPeriodsForEntity(periodsRepository, activeLegalEntityIdRef.value, year)
  }

  async function retryInit() {
    ready.value = false
    return ensureInitialized()
  }

  if (!ready.value && !initializing.value && !initPromise) {
    void ensureInitialized().catch(() => {
      /* initError is exposed to the layout */
    })
  }

  return {
    ready,
    initializing,
    initError,
    entities,
    entityOptions,
    activeEntity,
    activeLegalEntityId: activeLegalEntityIdRef,
    setActiveLegalEntity,
    ensureInitialized,
    retryInit,
    ...periodState,
    setListYear,
  }
}
