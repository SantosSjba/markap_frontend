import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { usersApiRepository } from '../infrastructure/repositories/users.api.repository'
import { useAuthStore } from '@modules/auth'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type { CreateUserData, UpdateUserData } from '../domain/settings.types'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => usersApiRepository.getAll(),
  })
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => usersApiRepository.getById(userId),
    enabled: !!userId,
  })
}

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => usersApiRepository.getRoles(),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userData: CreateUserData) => usersApiRepository.create(userData),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, userKeys.all)
      void markapAlert.toast.success('Usuario creado', 'El listado se actualizará.')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(err))
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) => usersApiRepository.update(id, data),
    onSuccess: (updatedUser, variables) => {
      invalidateQuerySubtree(queryClient, userKeys.all)

      if (authStore.user?.id === variables.id) {
        authStore.updateCurrentUser({
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
        })
      }
      void markapAlert.toast.success('Usuario actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
}

export function useToggleUserActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => usersApiRepository.toggleActive(userId),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, userKeys.all)
      void markapAlert.toast.success('Estado del usuario actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo cambiar el estado', getApiErrorMessage(err))
    },
  })
}

export function useAssignRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      usersApiRepository.assignRole(userId, roleId),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, userKeys.all)
      void markapAlert.toast.success('Rol asignado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo asignar el rol', getApiErrorMessage(err))
    },
  })
}

export function useRevokeRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      usersApiRepository.revokeRole(userId, roleId),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, userKeys.all)
      void markapAlert.toast.success('Rol quitado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo quitar el rol', getApiErrorMessage(err))
    },
  })
}
