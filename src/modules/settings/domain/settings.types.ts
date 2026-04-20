/**
 * Settings module — domain types
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

/** Aplicación en contexto admin (roles ↔ apps) */
export interface ApplicationItem {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  color?: string | null
  order?: number
}
