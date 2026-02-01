/**
 * User Types for Settings Module
 */

export interface UserListItem {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  isActive: boolean
  createdAt: string
  roles: RoleInfo[]
}

export interface RoleInfo {
  id: string
  name: string
  code: string
}

export interface CreateUserData {
  email: string
  password: string
  firstName: string
  lastName: string
  roleIds?: string[]
}

export interface UpdateUserData {
  email?: string
  firstName?: string
  lastName?: string
  isActive?: boolean
}

export interface AssignRoleData {
  userId: string
  roleId: string
}
