import { apiClient } from '@core/api/apiClient'
import type { UserListItem, CreateUserData, UpdateUserData, RoleInfo } from '../../domain/settings.types'
import type { UsersRepository } from '../../domain/repositories/users.repository'

export const usersApiRepository: UsersRepository = {
  async getAll(): Promise<UserListItem[]> {
    const { data } = await apiClient.get<UserListItem[]>('/users')
    return data
  },

  async getById(id: string): Promise<UserListItem> {
    const { data } = await apiClient.get<UserListItem>(`/users/${id}`)
    return data
  },

  async create(userData: CreateUserData): Promise<UserListItem> {
    const { data } = await apiClient.post<UserListItem>('/users', userData)
    return data
  },

  async update(id: string, userData: UpdateUserData): Promise<UserListItem> {
    const { data } = await apiClient.patch<UserListItem>(`/users/${id}`, userData)
    return data
  },

  async toggleActive(id: string): Promise<UserListItem> {
    const { data } = await apiClient.patch<UserListItem>(`/users/${id}/toggle-active`)
    return data
  },

  async getRoles(): Promise<RoleInfo[]> {
    const { data } = await apiClient.get<RoleInfo[]>('/roles')
    return data
  },

  async assignRole(userId: string, roleId: string): Promise<void> {
    await apiClient.post(`/users/${userId}/roles/${roleId}`)
  },

  async revokeRole(userId: string, roleId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}/roles/${roleId}`)
  },
}
