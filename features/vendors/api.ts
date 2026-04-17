import { getAdminSession } from "@/features/auth/session";
import { Vendor, AdminOnboardVendorDto, UpdateVendorDto, VendorListResult } from "./types";

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("Missing NEXT_PUBLIC_API_URL.");
  return apiUrl.replace(/\/$/, "");
}

function getAccessToken() {
  const session = getAdminSession();
  if (!session?.accessToken) throw new Error("Your admin session is missing. Please sign in again.");
  return session.accessToken;
}

function findStringDeep(value: unknown, keys: string[]): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findStringDeep(item, keys);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value !== 'object' || value === null) return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const v = record[key];
    if (typeof v === 'string' && v.trim()) return v;
  }
  for (const v of Object.values(record)) {
    const found = findStringDeep(v, keys);
    if (found) return found;
  }
  return undefined;
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  
  if (!response.ok) {
    const errorMsg = findStringDeep(payload, ["message", "error"]) 
      || (typeof payload === 'string' ? payload : "An unexpected error occurred");
    throw new Error(errorMsg);
  }
  return payload;
}

export async function listVendors(params: { page?: number; limit?: number; status?: string } = {}): Promise<VendorListResult> {
  const url = new URL(`${getApiUrl()}/admin/vendors`);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.status && params.status !== 'all') url.searchParams.set("status", params.status);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });

  const data = await handleResponse(response);
  
  // Adapt backend vendors to frontend Vendor type if needed
  const items = (data.items || data.data || []).map((v: any) => ({
    ...v,
    // Ensure nested fields are handled or defaulted
    address: v.address || {},
    bankingDetails: v.bankingDetails || {},
    // Backend uses joinedAt or createdAt? DTO.md says JoinedAt
    joinedAt: v.joinedAt || v.createdAt || new Date().toISOString(),
  }));

  return {
    items,
    total: data.meta?.totalItems || data.total || items.length,
  };
}

export async function getVendorById(vendorId: string): Promise<Vendor> {
  const response = await fetch(`${getApiUrl()}/admin/vendors/${vendorId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });
  return handleResponse(response);
}

export async function onboardVendor(dto: AdminOnboardVendorDto): Promise<Vendor> {
  const response = await fetch(`${getApiUrl()}/admin/onboard-vendor`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}` 
    },
    body: JSON.stringify(dto),
  });
  return handleResponse(response);
}

export async function updateVendor(vendorId: string, dto: UpdateVendorDto): Promise<Vendor> {
  const response = await fetch(`${getApiUrl()}/admin/vendors/${vendorId}`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}` 
    },
    body: JSON.stringify(dto),
  });
  return handleResponse(response);
}

export async function banVendor(vendorId: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/admin/vendors/${vendorId}/ban`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  await handleResponse(response);
}

export async function unbanVendor(vendorId: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/admin/vendors/${vendorId}/unban`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  await handleResponse(response);
}

export async function deleteVendor(vendorId: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/admin/vendors/${vendorId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  await handleResponse(response);
}
