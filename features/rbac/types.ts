import { IdentityStatus } from "../auth/types";

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions?: Permission[];
}

export interface SubAdmin {
  id: string;
  email: string;
  name?: string;
  status: IdentityStatus;
  createdAt: string;
  roles: Role[];
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRolePermissionsDto {
  permissionIds: string[];
}

export interface CreateSubAdminDto {
  email: string;
  password: string;
  name?: string;
}

export interface AssignRolesToSubAdminDto {
  roleIds: string[];
}
