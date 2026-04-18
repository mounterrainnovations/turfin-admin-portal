import { getAdminSession } from "@/features/auth/session";
import { Vendor, AdminOnboardVendorDto, UpdateVendorDto, VendorListResult, KycReviewDto } from "./types";

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
    let errorMsg = "An unexpected error occurred";
    if (typeof payload === 'object' && payload !== null) {
      errorMsg = payload.error?.message || payload.message || findStringDeep(payload, ["message", "error"]) || JSON.stringify(payload);
    } else if (typeof payload === 'string' && payload.trim()) {
      errorMsg = payload;
    }
    throw new Error(errorMsg);
  }
  return payload;
}

function isRecord(v: any): v is Record<string, any> {
  return typeof v === 'object' && v !== null;
}

function extractItems(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const candidates = ["items", "data", "results", "vendors"];
  for (const key of candidates) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
}

function extractTotal(payload: any, itemsLength: number): number {
  if (!isRecord(payload)) return itemsLength;
  if (typeof payload.total === "number") return payload.total;
  if (typeof payload.totalItems === "number") return payload.totalItems;
  
  const meta = payload.meta || payload.pagination;
  if (isRecord(meta)) {
    if (typeof meta.total === "number") return meta.total;
    if (typeof meta.totalItems === "number") return meta.totalItems;
    if (typeof meta.count === "number") return meta.count;
  }
  return itemsLength;
}

export async function listVendors(params: { page?: number; limit?: number; status?: string; search?: string } = {}): Promise<VendorListResult> {
  const url = new URL(`${getApiUrl()}/admin/vendors`);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.status && params.status !== "all") url.searchParams.set("status", params.status);
  if (params.search) url.searchParams.set("search", params.search);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });

  const data = await handleResponse(response);
  const rawItems = extractItems(data);
  const items = rawItems.map((v: any) => ({
    ...v,
    status: (v.status || "pending").toLowerCase(),
    businessName: v.businessName || "-",
    ownerFullName: v.ownerFullName || "-",
    email: v.email || "-",
    phone: v.phone || "-",
    address: v.address || {},
    bankingDetails: v.bankingDetails || {},
    verification: v.kyc?.verification || v.verification || {},
    kycStatus: (v.kyc?.status || v.kycStatus || "not_started").toLowerCase(),
    joinedAt: v.joinedAt || v.createdAt || new Date().toISOString(),
    createdAt: v.createdAt || v.joinedAt || new Date().toISOString(),

  }));

  return {
    items,
    total: extractTotal(data, items.length),
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

export async function reviewVendorKyc(vendorId: string, dto: KycReviewDto): Promise<void> {
  const response = await fetch(`${getApiUrl()}/admin/vendors/${vendorId}/kyc/review`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}` 
    },
    body: JSON.stringify(dto),
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
