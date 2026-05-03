import { authenticatedFetch } from "@/features/auth/request";
import { Arena, CreateArenaDto, ArenaStatus } from "./types";

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

function isRecord(v: any): v is Record<string, any> {
  return typeof v === "object" && v !== null;
}

function extractItems(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const candidates = ["data", "items", "results"];
  for (const key of candidates) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  return [];
}

function extractTotal(payload: any, itemsLength: number): number {
  if (!isRecord(payload)) return itemsLength;
  if (typeof payload.total === "number") return payload.total;
  
  const meta = payload.meta || payload.pagination;
  if (isRecord(meta)) {
    if (typeof meta.total === "number") return meta.total;
    if (typeof meta.count === "number") return meta.count;
  }
  return itemsLength;
}

export async function listArenas(params: any = {}): Promise<{ items: Arena[]; total: number }> {
  const url = new URL(`${getApiUrl()}/admin/arenas`);
  Object.keys(params).forEach(key => {
    if (params[key]) url.searchParams.set(key, String(params[key]));
  });

  const response = await authenticatedFetch(url.toString(), {
    cache: "no-store",
  });

  const data = await handleResponse(response);
  const items = extractItems(data);
  return {
    items,
    total: extractTotal(data, items.length),
  };
}

export async function getArenaById(id: string): Promise<Arena> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/arenas/${id}`, {
    cache: "no-store",
  });
  const data = await handleResponse(response);
  return data.data || data;
}

export async function createArena(dto: CreateArenaDto): Promise<Arena> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/arenas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return handleResponse(response);
}

export async function updateArenaStatus(id: string, status: ArenaStatus): Promise<void> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/arenas/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  await handleResponse(response);
}

export async function banArena(id: string): Promise<void> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/arenas/${id}/ban`, {
    method: "POST",
  });
  await handleResponse(response);
}

export async function unbanArena(id: string): Promise<void> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/arenas/${id}/unban`, {
    method: "POST",
  });
  await handleResponse(response);
}

export async function reviewArenaDocuments(id: string, dto: any): Promise<void> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/arenas/${id}/documents/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  await handleResponse(response);
}

export async function uploadArenaDocuments(id: string, dto: { documents: Record<string, string | string[]> }): Promise<void> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/arenas/${id}/documents`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  await handleResponse(response);
}
