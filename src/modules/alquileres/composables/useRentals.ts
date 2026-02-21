import { useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  rentalsService,
  type CreateRentalPayload,
} from '../services/rentals.service'

export const rentalKeys = {
  all: ['rentals'] as const,
}

export function useCreateRental() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      data: CreateRentalPayload
      files?: { contractFile?: File; deliveryActFile?: File }
    }) => rentalsService.create(params.data, params.files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all })
    },
  })
}
