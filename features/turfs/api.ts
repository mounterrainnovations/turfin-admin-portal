import { getAdminSession } from "@/features/auth/session";
import {
  Turf,
  TurfListResult,
  CreateTurfDto,
  UpdateTurfDto,
  TurfReviewDto,
} from "./types";

function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error("Missing NEXT_PUBLIC_API_URL.");
  return apiUrl.replace(/\/$/, "");
}

function getAccessToken() {
  const session = getAdminSession();
  if (!session?.accessToken)
    throw new Error("Your admin session is missing. Please sign in again.");
  return session.accessToken;
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    let errorMsg = "An unexpected error occurred";
    if (typeof payload === "object" && payload !== null) {
      errorMsg =
        payload.error?.message || payload.message || JSON.stringify(payload);
    } else if (typeof payload === "string" && payload.trim()) {
      errorMsg = payload;
    }
    throw new Error(errorMsg);
  }
  return payload;
}

function isRecord(v: any): v is Record<string, any> {
  return typeof v === "object" && v !== null;
}

function extractItems(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const candidates = ["items", "data", "results", "turfs"];
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

export async function listTurfs(
  params: {
    page?: number;
    limit?: number;
    status?: string;
    sportType?: string;
    city?: string;
    search?: string;
  } = {},
): Promise<TurfListResult> {
  const url = new URL(`${getApiUrl()}/admin/turfs`);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.status && params.status !== "all")
    url.searchParams.set("status", params.status);
  if (params.sportType) url.searchParams.set("sportType", params.sportType);
  if (params.city) url.searchParams.set("city", params.city);
  if (params.search) url.searchParams.set("search", params.search);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });

  const data = await handleResponse(response);
  const rawItems = extractItems(data);
  const items = rawItems.map((t: any) => ({
    ...t,
    status: (t.status || "pending").toLowerCase(),
    kycStatus: (t.kycStatus || "not_started").toLowerCase(),
    address: t.address || {},
    vendor: t.vendor || {},
    listedAt: t.createdAt || t.listedAt || new Date().toISOString(),
  }));

  return {
    items,
    total: extractTotal(data, items.length),
  };
}

export async function getTurfById(turfId: string): Promise<Turf> {
  const response = await fetch(`${getApiUrl()}/admin/turfs/${turfId}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
    cache: "no-store",
  });
  return handleResponse(response);
}

export async function createTurfForVendor(
  vendorId: string,
  dto: CreateTurfDto,
): Promise<Turf> {
  const response = await fetch(
    `${getApiUrl()}/admin/vendors/${vendorId}/turfs`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(dto),
    },
  );
  return handleResponse(response);
}

export async function updateTurfStatus(
  turfId: string,
  status: string,
): Promise<Turf> {
  const response = await fetch(`${getApiUrl()}/admin/turfs/${turfId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ status }),
  });
  return handleResponse(response);
}

export async function reviewTurfDocuments(
  turfId: string,
  dto: TurfReviewDto,
): Promise<void> {
  const response = await fetch(
    `${getApiUrl()}/admin/turfs/${turfId}/documents/review`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(dto),
    },
  );
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

export async function updateTurf(
  turfId: string,
  dto: UpdateTurfDto,
): Promise<Turf> {
  const response = await fetch(`${getApiUrl()}/admin/turfs/${turfId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify(dto),
  });
  return handleResponse(response);
}
