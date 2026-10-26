import { commissionsRepositoryKey } from '../../application/ports/commissions.port'
import { useService } from '@shared/presentation/di/services'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { sk } from '@shared/domain/stable-query-key'
import { invalidateAlquileresQueries } from '../../../../presentation/queries/invalidateAlquileresQueries'
import { alquileresQueryKeys } from '../../../../application/alquileresQueryKeys'
import type { ListCommissionsParams, UpdateCommissionPayload } from '../../domain/commission.types'

/** Bajo `rentals`: editar un alquiler o su distribución financiera también las refresca. */
export const commissionKeys = {
  all: [...alquileresQueryKeys.rentals, 'commissions'] as const,
  list: (params: ListCommissionsParams) =>
    [
      ...commissionKeys.all,
      'list',
      sk(params.applicationSlug ?? 'alquileres'),
      sk(params.status ?? ''),
      sk(params.search ?? ''),
      sk(params.page ?? 1),
      sk(params.limit ?? 10),
    ] as const,
}

export function useCommissions(params: Ref<ListCommissionsParams>) {
  const commissionsRepository = useService(commissionsRepositoryKey)
  return useQuery({
    queryKey: computed(() => commissionKeys.list(params.value)),
    queryFn: () => commissionsRepository.list(params.value),
    placeholderData: keepPreviousData,
  })
}

export function useUpdateCommission() {
  const commissionsRepository = useService(commissionsRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rentalId, data }: { rentalId: string; data: UpdateCommissionPayload }) =>
      commissionsRepository.update(rentalId, data),
    onSuccess: (_res, { data }) => {
      void invalidateAlquileresQueries(queryClient, 'rentals')
      void markapAlert.toast.success(
        data.status === 'PAID'
          ? 'Comisión marcada como pagada'
          : data.status === 'PENDING'
            ? 'Comisión marcada como pendiente'
            : 'Comisión actualizada',
      )
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo actualizar la comisión', getApiErrorMessage(err))
    },
  })
}
