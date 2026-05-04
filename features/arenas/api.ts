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

function extractObject(payload: any): any {
  if (!isRecord(payload)) return payload;
  const candidates = ["item", "data", "result", "arena"];
  for (const key of candidates) {
    if (isRecord(payload[key])) return payload[key];
  }
  return payload;
}

function normalizeArena(arena: any): Arena {
  const kyc = isRecord(arena?.kyc)
    ? {
        ...arena.kyc,
        status: (arena.kyc.status || arena.kycStatus || "not_started").toLowerCase(),
        verification: arena.kyc.verification || arena.verification || {},
        documents: arena.kyc.documents || arena.documents || {},
      }
    : undefined;

  return {
    ...arena,
    address: arena.address || {},
    amenities: Array.isArray(arena.amenities) ? arena.amenities : [],
    status: (arena.status || "pending").toLowerCase(),
    kycStatus: (kyc?.status || arena.kycStatus || "not_started").toLowerCase(),
    documents: kyc?.documents || arena.documents || {},
    verification: kyc?.verification || arena.verification || {},
    rating: isRecord(arena.rating)
      ? {
          avgScore:
            typeof arena.rating.avgScore === "number" ? arena.rating.avgScore : 0,
          totalReviews:
            typeof arena.rating.totalReviews === "number"
              ? arena.rating.totalReviews
              : 0,
        }
      : { avgScore: 0, totalReviews: 0 },
    createdAt: arena.createdAt || new Date().toISOString(),
    updatedAt: arena.updatedAt || arena.createdAt || new Date().toISOString(),
    kyc,
  };
}

export async function listArenas(
  params: any = {},
): Promise<{ items: Arena[]; total: number }> {
  const url = new URL(`${getApiUrl()}/admin/arenas`);
  Object.keys(params).forEach((key) => {
    if (params[key]) url.searchParams.set(key, String(params[key]));
  });

  const response = await authenticatedFetch(url.toString(), {
    cache: "no-store",
  });

  const data = await handleResponse(response);
  const items = extractItems(data);
  return {
    items: items.map(normalizeArena),
    total: extractTotal(data, items.length),
  };
}

export async function getArenaById(id: string): Promise<Arena> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/arenas/${id}`,
    {
      cache: "no-store",
    },
  );
  return normalizeArena(extractObject(await handleResponse(response)));
}

export async function createArena(dto: CreateArenaDto): Promise<Arena> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/arenas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return normalizeArena(extractObject(await handleResponse(response)));
}

export async function updateArenaStatus(
  id: string,
  status: ArenaStatus,
): Promise<Arena> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/arenas/${id}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  return normalizeArena(extractObject(await handleResponse(response)));
}

export async function updateArena(
  id: string,
  dto: Partial<CreateArenaDto>,
): Promise<Arena> {
  const response = await authenticatedFetch(`${getApiUrl()}/admin/arenas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return normalizeArena(extractObject(await handleResponse(response)));
}

export async function banArena(id: string): Promise<void> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/arenas/${id}/ban`,
    {
      method: "POST",
    },
  );
  await handleResponse(response);
}

export async function unbanArena(id: string): Promise<void> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/arenas/${id}/unban`,
    {
      method: "POST",
    },
  );
  await handleResponse(response);
}

export async function reviewArenaDocuments(
  id: string,
  dto: any,
): Promise<Arena> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/arenas/${id}/documents/review`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    },
  );
  return normalizeArena(extractObject(await handleResponse(response)));
}

export async function uploadArenaDocuments(
  id: string,
  dto: { documents: Record<string, string | string[]> },
): Promise<Arena> {
  const response = await authenticatedFetch(
    `${getApiUrl()}/admin/arenas/${id}/documents`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    },
  );
  return normalizeArena(extractObject(await handleResponse(response)));
}
