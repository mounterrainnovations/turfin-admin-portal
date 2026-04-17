import { getAdminSession } from "@/features/auth/session";
import { 
  Turf, 
  TurfListResult, 
  CreateTurfDto, 
  UpdateTurfDto, 
  TurfReviewDto 
} from "./types";

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

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();
  
  if (!response.ok) {
    const errorMsg = (typeof payload === 'object' && payload !== null && 'message' in payload) 
      ? (payload as any).message 
      : (typeof payload === 'string' ? payload : "An unexpected error occurred");
    throw new Error(errorMsg);
  }
  return payload;
}

export async function listTurfs(params: { 
  page?: number; 
  limit?: number; 
  status?: string;
  sportType?: string;
  city?: string;
} = {}): Promise<TurfListResult> {
  const url = new URL(`${getApiUrl()}/admin/turfs`);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.status && params.status !== 'all') url.searchParams.set("status", params.status);
  if (params.sportType) url.searchParams.set("sportType", params.sportType);
  if (params.city) url.searchParams.set("city", params.city);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });

  const data = await handleResponse(response);
  const items = (data.items || data.data || []).map((t: any) => ({
    ...t,
    address: t.address || {},
    vendor: t.vendor || {},
    listedAt: t.createdAt || t.listedAt || new Date().toISOString(),
  }));

  return {
    items,
    total: data.meta?.totalItems || data.total || items.length,
  };
}

export async function getTurfById(turfId: string): Promise<Turf> {
  const response = await fetch(`${getApiUrl()}/admin/turfs/${turfId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });
  return handleResponse(response);
}

export async function createTurfForVendor(vendorId: string, dto: CreateTurfDto): Promise<Turf> {
  const response = await fetch(`${getApiUrl()}/admin/vendors/${vendorId}/turfs`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}` 
    },
    body: JSON.stringify(dto),
  });
  return handleResponse(response);
}

export async function updateTurfStatus(turfId: string, status: string): Promise<Turf> {
  const response = await fetch(`${getApiUrl()}/admin/turfs/${turfId}/status`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}` 
    },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}

export async function reviewTurfDocuments(turfId: string, dto: TurfReviewDto): Promise<void> {
  const response = await fetch(`${getApiUrl()}/admin/turfs/${turfId}/documents/review`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}` 
    },
    body: JSON.stringify(dto),
  });
  await handleResponse(response);
}

export async function banTurf(turfId: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/admin/turfs/${turfId}/ban`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  await handleResponse(response);
}

export async function unbanTurf(turfId: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/admin/turfs/${turfId}/unban`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  await handleResponse(response);
}
