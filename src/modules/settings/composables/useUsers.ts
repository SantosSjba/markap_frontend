import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { usersService } from '../services'
import { useAuthStore } from '@modules/auth/stores'
import type { CreateUserData, UpdateUserData } from '../types'

/**
 * Query Keys for Users
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

/**
 * Query Keys for Roles
 */
export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
}

/**
 * Hook to fetch all users
 */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: () => usersService.getAll(),
  })
}

/**
 * Hook to fetch a single user
 */
export function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => usersService.getById(userId),
    enabled: !!userId,
  })
}

/**
 * Hook to fetch all roles
 */
export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => usersService.getRoles(),
  })
}

/**
 * Hook to create a user
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userData: CreateUserData) => usersService.create(userData),
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const authStore = useAuthStore()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) => 
      usersService.update(id, data),
    onSuccess: (updatedUser, variables) => {
      // Invalidate specific user and list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })

      // If updating current user, sync with auth store
      if (authStore.user?.id === variables.id) {
        authStore.updateCurrentUser({
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
        })
      }
    },
  })
}

/**
 * Hook to toggle user active status
 */
export function useToggleUserActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => usersService.toggleActive(userId),
    onSuccess: (_, userId) => {
      // Invalidate specific user and list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

/**
 * Hook to assign role to user
 */
export function useAssignRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => 
      usersService.assignRole(userId, roleId),
    onSuccess: (_, variables) => {
      // Invalidate specific user and list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

/**
 * Hook to revoke role from user
 */
export function useRevokeRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) => 
      usersService.revokeRole(userId, roleId),
    onSuccess: (_, variables) => {
      // Invalidate specific user and list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
