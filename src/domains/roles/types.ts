/**
 * RBAC & Roles Domain Types
 * Based on the Sub-Admin RBAC Integration Guide
 */

export interface PermissionListItem {
  id: string;
  resource: string;
  action: string;
  description: string;
}

export interface RoleSummary {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
}

export interface SubAdminListItem {
  id: string;
  email: string;
  roles: RoleSummary[]; // Hydrated list of assigned roles
  createdAt: string;
}

export interface CustomRoleItem extends RoleSummary {
  permissions: PermissionListItem[]; // Hydrated list of permissions
}

// Request Payloads
export interface CreateSubAdminDto {
  email: string;
  password?: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRolePermissionsDto {
  permissionIds: string[];
}

export interface AssignRolesToSubAdminDto {
  roleIds: string[];
}
