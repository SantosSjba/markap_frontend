import type { UserListItem, CreateUserData, UpdateUserData, RoleInfo } from '../settings.types'

export interface UsersRepository {
  getAll(): Promise<UserListItem[]>
  getById(id: string): Promise<UserListItem>
  create(userData: CreateUserData): Promise<UserListItem>
  update(id: string, userData: UpdateUserData): Promise<UserListItem>
  toggleActive(id: string): Promise<UserListItem>
  getRoles(): Promise<RoleInfo[]>
  assignRole(userId: string, roleId: string): Promise<void>
  revokeRole(userId: string, roleId: string): Promise<void>
}
