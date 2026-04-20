import { authenticatedFetch } from "@/features/auth/request";
import { 
  Permission, 
  Role, 
  SubAdmin, 
  CreateRoleDto, 
  UpdateRolePermissionsDto, 
  CreateSubAdminDto, 
  AssignRolesToSubAdminDto 
} from "./types";

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("Missing NEXT_PUBLIC_API_URL.");
  return apiUrl.replace(/\/$/, "");
}


async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    let errorMsg = "An unexpected error occurred";
    if (typeof payload === "object" && payload !== null) {
      errorMsg = payload.error?.message || payload.message || JSON.stringify(payload);
    } else if (typeof payload === "string" && payload.trim()) {
      errorMsg = payload;
    }
    throw new Error(errorMsg);
  }
  return payload;
}

// ── Permission catalogue ─────────────────────────────────────────────────

export async function listPermissions(): Promise<Permission[]> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/sub-admins/permissions`, {
    cache: "no-store",
  });
  const data = await handleResponse(response);
  return data.data || data;
}

// ── Custom role management ───────────────────────────────────────────────

export async function listRoles(): Promise<Role[]> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/sub-admins/roles`, {
    cache: "no-store",
  });
  const data = await handleResponse(response);
  return data.data || data;
}

export async function createRole(dto: CreateRoleDto): Promise<Role> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/sub-admins/roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });
  const data = await handleResponse(response);
  return data.data || data;
}

export async function updateRolePermissions(roleId: string, dto: UpdateRolePermissionsDto): Promise<Role> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/sub-admins/roles/${roleId}/permissions`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });
  const data = await handleResponse(response);
  return data.data || data;
}

export async function deleteRole(roleId: string): Promise<void> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/sub-admins/roles/${roleId}`, {
    method: "DELETE",
  });
  await handleResponse(response);
}

// ── Sub-admin account management ─────────────────────────────────────────

export async function listSubAdmins(): Promise<SubAdmin[]> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/sub-admins`, {
    cache: "no-store",
  });
  const data = await handleResponse(response);
  return data.data || data;
}

export async function createSubAdmin(dto: CreateSubAdminDto): Promise<{ identityId: string; email: string }> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/sub-admins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });
  const data = await handleResponse(response);
  return data.data || data;
}

export async function deleteSubAdmin(id: string): Promise<void> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/sub-admins/${id}`, {
    method: "DELETE",
  });
  await handleResponse(response);
}

export async function getSubAdminRoles(id: string): Promise<Role[]> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/sub-admins/${id}/roles`, {
    cache: "no-store",
  });
  const data = await handleResponse(response);
  return data.data || data;
}

export async function assignRolesToSubAdmin(id: string, dto: AssignRolesToSubAdminDto): Promise<Role[]> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/sub-admins/${id}/roles`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });
  const data = await handleResponse(response);
  return data.data || data;
}
