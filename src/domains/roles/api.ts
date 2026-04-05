/**
 * Sub-Admin & RBAC Management API Service
 */

import { api } from "@/lib/api-client";
import { 
  SubAdminListItem, 
  CustomRoleItem, 
  CreateRoleDto,
  UpdateRolePermissionsDto,
  AssignRolesToSubAdminDto,
  CreateSubAdminDto,
  PermissionListItem
} from "./types";
import { useQuery } from "@tanstack/react-query";

export const rolesApi = {
  // --- Sub-Admin Endpoints ---

  fetchSubAdmins: async () => {
    return api.get<SubAdminListItem[]>("/admin/sub-admins");
  },

  createSubAdmin: async (payload: CreateSubAdminDto) => {
    return api.post("/admin/sub-admins", payload);
  },

  deleteSubAdmin: async (id: string) => {
    return api.delete(`/admin/sub-admins/${id}`);
  },

  assignRolesToSubAdmin: async (userId: string, payload: AssignRolesToSubAdminDto) => {
    return api.patch(`/admin/sub-admins/${userId}/roles`, payload);
  },

  // --- Role & Permission Endpoints ---

  fetchPermissions: async () => {
    return api.get<PermissionListItem[]>("/admin/sub-admins/permissions");
  },

  fetchRoles: async () => {
    return api.get<CustomRoleItem[]>("/admin/sub-admins/roles");
  },

  createRole: async (payload: CreateRoleDto) => {
    return api.post<CustomRoleItem>("/admin/sub-admins/roles", payload);
  },

  updateRolePermissions: async (roleId: string, payload: UpdateRolePermissionsDto) => {
    return api.patch(`/admin/sub-admins/roles/${roleId}/permissions`, payload);
  },

  deleteRole: async (roleId: string) => {
    return api.delete(`/admin/sub-admins/roles/${roleId}`);
  },
};

// --- React Query Hooks ---

export function useRoles() {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: rolesApi.fetchRoles,
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: rolesApi.fetchPermissions,
  });
}

export function useSubAdmins() {
  return useQuery({
    queryKey: ["admin", "sub-admins"],
    queryFn: rolesApi.fetchSubAdmins,
  });
}
