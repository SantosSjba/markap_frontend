import { ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { apiClient } from '@core/api/apiClient'
import { getContabilidadApiScope, activeLegalEntityIdRef } from '../../config/api-scope'

const STORAGE_KEY = 'markap.contabilidad.activeLegalEntity'

export interface ContabilidadLegalEntityDTO {
  id: string
  code: string
  ruc: string
  legalName: string
  tradeName: string | null
  isDefault: boolean
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStored(id: string | null) {
  try {
    if (!id) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

const initialized = ref(false)

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

async function fetchLegalEntities() {
  const res = await apiClient.get<{ entities: ContabilidadLegalEntityDTO[] }>(
    `/contabilidad-legal-entities?${qs(getContabilidadApiScope())}`,
  )
  return res.data.entities
}

export function useContabilidadActiveLegalEntity() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contabilidad-legal-entities'],
    queryFn: fetchLegalEntities,
    staleTime: 60_000,
  })

  watch(
    data,
    (entities) => {
      if (!entities?.length || initialized.value) return
      const stored = readStored()
      const match = stored ? entities.find((e) => e.id === stored) : null
      const selected = match ?? entities.find((e) => e.isDefault) ?? entities[0]
      if (!selected) return
      activeLegalEntityIdRef.value = selected.id
      writeStored(selected.id)
      initialized.value = true
    },
    { immediate: true },
  )

  function setActiveLegalEntity(entity: ContabilidadLegalEntityDTO) {
    activeLegalEntityIdRef.value = entity.id
    writeStored(entity.id)
  }

  return {
    entities: data,
    activeLegalEntityId: activeLegalEntityIdRef,
    loading: isLoading,
    setActiveLegalEntity,
    refetch,
  }
}
