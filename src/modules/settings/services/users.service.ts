import { apiClient } from '@core/api'
import type { UserListItem, CreateUserData, UpdateUserData, RoleInfo } from '../types'

/**
 * Users Service
 */

export const usersService = {
  /**
   * Get all users
   */
  async getAll(): Promise<UserListItem[]> {
    const { data } = await apiClient.get<UserListItem[]>('/users')
    return data
  },

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<UserListItem> {
    const { data } = await apiClient.get<UserListItem>(`/users/${id}`)
    return data
  },

  /**
   * Create a new user
   */
  async create(userData: CreateUserData): Promise<UserListItem> {
    const { data } = await apiClient.post<UserListItem>('/users', userData)
    return data
  },

  /**
   * Update user
   */
  async update(id: string, userData: UpdateUserData): Promise<UserListItem> {
    const { data } = await apiClient.patch<UserListItem>(`/users/${id}`, userData)
    return data
  },

  /**
   * Toggle user active status
   */
  async toggleActive(id: string): Promise<UserListItem> {
    const { data } = await apiClient.patch<UserListItem>(`/users/${id}/toggle-active`)
    return data
  },

  /**
   * Get all roles
   */
  async getRoles(): Promise<RoleInfo[]> {
    const { data } = await apiClient.get<RoleInfo[]>('/roles')
    return data
  },

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string): Promise<void> {
    await apiClient.post(`/users/${userId}/roles/${roleId}`)
  },

  /**
   * Revoke role from user
   */
  async revokeRole(userId: string, roleId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}/roles/${roleId}`)
  },
}
